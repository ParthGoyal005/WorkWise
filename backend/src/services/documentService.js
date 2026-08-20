const path = require('path');
const fs = require('fs/promises');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const DocumentSummary = require('../models/DocumentSummary');   
const { ApiError } = require('../utils/ApiError');
const { ACCESS_TYPES } = require('../config/constants');
const { loadEnv } = require('../config/env');
const { extractText, detectFileType } = require('./textExtractionService');
const { splitIntoChunks } = require('./chunkingService');
const { embedMany, isUsingFallbackEmbeddings } = require('./embeddingService');
const {canUserAccessDocument,buildAccessibleDocumentFilter,normalizePermissionsInput} = require('./permissionService');

/**
 * Full upload pipeline:
 * 1. Save metadata
 * 2. Extract text
 * 3. Chunk
 * 4. Embed each chunk
 * 5. Mark document ready
 */
async function uploadDocument({ file, body, user }) {
  if (!file) {
    throw new ApiError(400, 'A document file is required.');
  }

  const fileType = detectFileType(file.originalname, file.mimetype);
  const permissions = normalizePermissionsInput({
    accessType: body.accessType,
    allowedRoles: parseMaybeJson(body.allowedRoles),
    allowedDepartments: parseMaybeJson(body.allowedDepartments),
    allowedUsers: parseMaybeJson(body.allowedUsers),
  });

  const document = await Document.create({
    name: body.name || path.parse(file.originalname).name,
    originalFileName: file.originalname,
    fileType,
    mimeType: file.mimetype,
    filePath: file.path,
    fileSize: file.size,
    department: body.department || 'General',
    category: body.category || 'Other',
    uploadedBy: user._id,
    permissions,
    status: 'processing',
  });

  try {
    await processDocumentContent(document);
    return Document.findById(document._id).populate('uploadedBy', 'name email');
  } catch (err) {
    document.status = 'failed';
    document.processingError = err.message;
    await document.save();
    throw new ApiError(500, `Document processing failed: ${err.message}`);
  }
}

async function processDocumentContent(document) {
  const { text } = await extractText(document.filePath, document.fileType);
  if (!text) {
    throw new Error('No readable text found in the uploaded file.');
  }

  const pieces = splitIntoChunks(text);
  if (pieces.length === 0) {
    throw new Error('Could not create text chunks from the document.');
  }

  const embeddings = await embedMany(
    pieces.map((p) => p.content),
    { taskType: 'RETRIEVAL_DOCUMENT' }
  );

  await Chunk.deleteMany({ documentId: document._id });

  const chunkDocs = await Chunk.insertMany(
    pieces.map((piece, index) => ({
      documentId: document._id,
      chunkIndex: piece.chunkIndex,
      content: piece.content,
      pageNumber: piece.pageNumber,
      tokenEstimate: piece.tokenEstimate,
      embedding: embeddings[index].vector,
      embeddingModel: embeddings[index].model,
    }))
  );

  document.status = 'ready';
  document.chunkCount = chunkDocs.length;
  document.processingError = null;
  await document.save();

  // Auto-generate a summary after processing
  try {
    const summaryService = require('./summaryService');
    await summaryService.generateDocumentSummary(document._id, {
      _id: document.uploadedBy,
      role: 'admin',
    });
  } catch {
    // Summary can be regenerated later from the UI
  }

  return {
    document,
    usedFallbackEmbeddings: isUsingFallbackEmbeddings(),
  };
}

async function listDocuments(user, query = {}) {
  const filter = {
    ...buildAccessibleDocumentFilter(user),
  };

  if (query.department) {
    filter.department = query.department;
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.name) {
    filter.name = { $regex: query.name, $options: 'i' };
  }
  if (query.status) {
    filter.status = query.status;
  }

  const documents = await Document.find(filter)
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 });

  return documents;
}

async function getDocumentById(documentId, user) {
  const document = await Document.findById(documentId).populate(
    'uploadedBy',
    'name email'
  );

  if (!document) {
    throw new ApiError(404, 'Document not found.');
  }

  if (!canUserAccessDocument(user, document)) {
    throw new ApiError(403, 'You do not have permission to view this document.');
  }

  document.viewCount += 1;
  await document.save();

  const summary = await DocumentSummary.findOne({ documentId: document._id });

  return { document, summary };
}

async function deleteDocument(documentId, user) {
  const document = await Document.findById(documentId);
  if (!document) {
    throw new ApiError(404, 'Document not found.');
  }

  await Chunk.deleteMany({ documentId: document._id });
  await DocumentSummary.deleteOne({ documentId: document._id });

  try {
    await fs.unlink(path.resolve(document.filePath));
  } catch {
    // File may already be missing; continue deleting DB records
  }

  await document.deleteOne();
  return { deleted: true };
}

async function updatePermissions(documentId, permissionsInput) {
  const document = await Document.findById(documentId);
  if (!document) {
    throw new ApiError(404, 'Document not found.');
  }

  document.permissions = normalizePermissionsInput(permissionsInput);
  await document.save();
  return document;
}

async function keywordSearch(user, { q, department, category }) {
  if (!q || !q.trim()) {
    throw new ApiError(400, 'Search query is required.');
  }

  const filter = {
    ...buildAccessibleDocumentFilter(user),
    status: 'ready',
    $or: [
      { name: { $regex: q.trim(), $options: 'i' } },
      { category: { $regex: q.trim(), $options: 'i' } },
    ],
  };

  if (department) filter.department = department;
  if (category) filter.category = category;

  return Document.find(filter).populate('uploadedBy', 'name email').sort({ updatedAt: -1 }).limit(50);
}

function parseMaybeJson(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function getUploadDirectory() {
  const { uploadDir } = loadEnv();
  return path.join(__dirname, '..', '..', uploadDir);
}

module.exports = {
  uploadDocument,
  processDocumentContent,
  listDocuments,
  getDocumentById,
  deleteDocument,
  updatePermissions,
  keywordSearch,
  getUploadDirectory,
  ACCESS_TYPES,
};
