const documentService = require('../services/documentService');
const { asyncHandler } = require('../utils/asyncHandler');

const uploadDocument = asyncHandler(async (req, res) => {
  const document = await documentService.uploadDocument({
    file: req.file,
    body: req.body,
    user: req.user,
  });

  res.status(201).json({
    success: true,
    message: 'Document uploaded and processed successfully.',
    data: { document },
  });
});

const listDocuments = asyncHandler(async (req, res) => {
  const documents = await documentService.listDocuments(req.user, req.query);
  res.json({
    success: true,
    data: { documents, count: documents.length },
  });
});

const getDocument = asyncHandler(async (req, res) => {
  const result = await documentService.getDocumentById(
    req.params.id,
    req.user
  );
  res.json({
    success: true,
    data: result,
  });
});

const deleteDocument = asyncHandler(async (req, res) => {
  await documentService.deleteDocument(req.params.id, req.user);
  res.json({
    success: true,
    message: 'Document deleted successfully.',
  });
});

const updatePermissions = asyncHandler(async (req, res) => {
  const document = await documentService.updatePermissions(
    req.params.id,
    req.body
  );
  res.json({
    success: true,
    message: 'Document permissions updated.',
    data: { document },
  });
});

const searchDocuments = asyncHandler(async (req, res) => {
  const documents = await documentService.keywordSearch(req.user, req.query);
  res.json({
    success: true,
    data: { documents, count: documents.length },
  });
});

module.exports = {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
  updatePermissions,
  searchDocuments,
};
