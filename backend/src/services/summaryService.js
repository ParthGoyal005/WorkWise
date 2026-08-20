const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const DocumentSummary = require('../models/DocumentSummary');
const { ApiError } = require('../utils/ApiError');
const { canUserAccessDocument } = require('./permissionService');
const { generateTextOrNull, generateJson, hasGeminiConfigured } = require('./aiService');
const { documentSummaryPrompt, documentComparisonPrompt} = require('../prompts/templates');

function buildLocalSummary(document, text) {
  const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 320);
  return (
    `This document (${document.name}) covers ${document.category.toLowerCase()} ` +
    `topics for the ${document.department} department. ` +
    `Key content: ${snippet}${snippet.length >= 320 ? '…' : ''}`
  );
}

async function generateDocumentSummary(documentId, user) {
  const document = await Document.findById(documentId);
  if (!document) {
    throw new ApiError(404, 'Document not found.');
  }
  if (!canUserAccessDocument(user, document)) {
    throw new ApiError(403, 'You do not have permission to view this document.');
  }

  const chunks = await Chunk.find({ documentId }).sort({ chunkIndex: 1 });
  const text = chunks.map((c) => c.content).join('\n\n');

  if (!text) {
    throw new ApiError(400, 'Document has no processed text to summarize.');
  }

  const aiSummary = await generateTextOrNull(
    documentSummaryPrompt({ documentName: document.name, text })
  );
  const summaryText = aiSummary || buildLocalSummary(document, text);
  const modelUsed = aiSummary ? 'gemini' : 'local-fallback';

  const existing = await DocumentSummary.findOne({ documentId });
  let summary;
  if (existing) {
    existing.summary = summaryText;
    existing.regeneratedCount += 1;
    existing.generatedBy = user._id;
    existing.model = modelUsed;
    await existing.save();
    summary = existing;
  } else {
    summary = await DocumentSummary.create({
      documentId,
      summary: summaryText,
      generatedBy: user._id,
      model: modelUsed,
    });
  }

  document.hasSummary = true;
  await document.save();

  return summary;
}

async function compareDocuments({ user, documentIdA, documentIdB }) {
  if (!documentIdA || !documentIdB) {
    throw new ApiError(400, 'Two document ids are required.');
  }
  if (documentIdA === documentIdB) {
    throw new ApiError(400, 'Please select two different documents.');
  }

  const [docA, docB] = await Promise.all([
    Document.findById(documentIdA),
    Document.findById(documentIdB),
  ]);

  if (!docA || !docB) {
    throw new ApiError(404, 'One or both documents were not found.');
  }
  if (!canUserAccessDocument(user, docA) || !canUserAccessDocument(user, docB)) {
    throw new ApiError(
      403,
      'You can only compare documents you are allowed to access.'
    );
  }

  const [chunksA, chunksB] = await Promise.all([
    Chunk.find({ documentId: docA._id }).sort({ chunkIndex: 1 }).limit(8),
    Chunk.find({ documentId: docB._id }).sort({ chunkIndex: 1 }).limit(8),
  ]);

  const contextA = chunksA.map((c) => c.content).join('\n\n').slice(0, 8000);
  const contextB = chunksB.map((c) => c.content).join('\n\n').slice(0, 8000);

  const localComparison = {
    similarities: [
      `Both documents are available in your accessible library (${docA.category} / ${docB.category}).`,
    ],
    differences: [
      `${docA.name} belongs to ${docA.department}; ${docB.name} belongs to ${docB.department}.`,
    ],
    importantRules: [
      'Review each policy carefully before acting.',
    ],
    summary: `Compared ${docA.name} and ${docB.name} using retrieved chunks.`,
  };

  if (hasGeminiConfigured()) {
    try {
      const comparison = await generateJson(
        documentComparisonPrompt({
          docAName: docA.name,
          docBName: docB.name,
          contextA,
          contextB,
        })
      );
      return {
        documentA: { id: docA._id, name: docA.name },
        documentB: { id: docB._id, name: docB.name },
        comparison,
      };
    } catch (err) {
      console.warn('Comparison falling back locally:', err.message);
    }
  }

  return {
    documentA: { id: docA._id, name: docA.name },
    documentB: { id: docB._id, name: docB.name },
    comparison: localComparison,
  };
}

module.exports = {
  generateDocumentSummary,
  compareDocuments,
};
