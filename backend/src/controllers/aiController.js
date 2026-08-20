const ragService = require('../services/ragService');
const summaryService = require('../services/summaryService');
const { asyncHandler } = require('../utils/asyncHandler');

const ask = asyncHandler(async (req, res) => {
  const result = await ragService.askQuestion({
    user: req.user,
    question: req.body.question,
    chatId: req.body.chatId,
  });

  res.json({
    success: true,
    data: {
      chatId: result.chatId,
      answer: result.answer,
      sources: result.sources,
    },
  });
});

const semanticSearch = asyncHandler(async (req, res) => {
  const results = await ragService.semanticSearch({
    user: req.user,
    query: req.query.q,
    limit: Number(req.query.limit) || 10,
  });

  res.json({
    success: true,
    data: { results },
  });
});

const listChats = asyncHandler(async (req, res) => {
  const chats = await ragService.listChats(req.user);
  res.json({
    success: true,
    data: { chats, count: chats.length },
  });
});

const getChat = asyncHandler(async (req, res) => {
  const chat = await ragService.getChat(req.user, req.params.id);
  res.json({
    success: true,
    data: { chat },
  });
});

const generateSummary = asyncHandler(async (req, res) => {
  const summary = await summaryService.generateDocumentSummary(
    req.params.id,
    req.user
  );
  res.json({
    success: true,
    message: 'Summary generated.',
    data: { summary },
  });
});

const compareDocuments = asyncHandler(async (req, res) => {
  const result = await summaryService.compareDocuments({
    user: req.user,
    documentIdA: req.body.documentIdA,
    documentIdB: req.body.documentIdB,
  });
  res.json({
    success: true,
    data: result,
  });
});

module.exports = {
  ask,
  semanticSearch,
  listChats,
  getChat,
  generateSummary,
  compareDocuments,
};
