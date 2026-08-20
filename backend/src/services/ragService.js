const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const Chat = require('../models/Chat');
const { ApiError } = require('../utils/ApiError');
const { RAG_TOP_K } = require('../config/constants');
const { embedText, cosineSimilarity } = require('./embeddingService');
const { buildAccessibleDocumentFilter } = require('./permissionService');
const { generateTextOrNull } = require('./aiService');
const { questionAnsweringPrompt } = require('../prompts/templates');

/**
 * Permission-aware RAG:
 * 1. Find document IDs the user can access
 * 2. Embed the question
 * 3. Score only chunks from those documents (cosine + keyword boost)
 * 4. Build context and ask Gemini (or a local fallback answer)
 */
async function askQuestion({ user, question, chatId = null }) {
  const trimmed = String(question || '').trim();
  if (!trimmed) {
    throw new ApiError(400, 'Question is required.');
  }

  const accessibleDocs = await Document.find({
    ...buildAccessibleDocumentFilter(user),
    status: 'ready',
  }).select('_id name');

  if (accessibleDocs.length === 0) {
    return saveAndReturn({
      user,
      chatId,
      question: trimmed,
      answer:
        'No accessible information was found for your account. If you believe you should have access, contact an administrator.',
      sources: [],
    });
  }

  const docIds = accessibleDocs.map((d) => d._id);
  const docNameById = Object.fromEntries(
    accessibleDocs.map((d) => [d._id.toString(), d.name])
  );

  const queryEmbedding = await embedText(trimmed, { taskType: 'RETRIEVAL_QUERY' });
  const queryTerms = extractSearchTerms(trimmed);
  const chunks = await Chunk.find({ documentId: { $in: docIds } }).select(
    '+embedding content chunkIndex pageNumber documentId'
  );

  const ranked = chunks
    .map((chunk) => {
      const semantic = cosineSimilarity(queryEmbedding.vector, chunk.embedding || []);
      const lexical = keywordOverlapScore(chunk.content, queryTerms);
      // Hybrid score so exact policy phrases (e.g. "medical leave") surface
      // even when a document was indexed with a different embedding model.
      const score = semantic + lexical * 0.35;
      return { chunk, score, semantic, lexical };
    })
    .filter((item) => item.score > 0.05 || item.lexical > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, RAG_TOP_K);

  if (ranked.length === 0) {
    return saveAndReturn({
      user,
      chatId,
      question: trimmed,
      answer:
        'No accessible information was found that matches your question. Try rephrasing, or ask about a policy you have permission to view.',
      sources: [],
    });
  }

  const sources = ranked.map(({ chunk, score }) => ({
    documentId: chunk.documentId,
    documentName: docNameById[chunk.documentId.toString()] || 'Document',
    chunkId: chunk._id,
    chunkIndex: chunk.chunkIndex,
    pageNumber: chunk.pageNumber,
    score: Number(score.toFixed(4)),
    excerpt: chunk.content.slice(0, 220),
  }));

  const context = ranked
    .map(
      ({ chunk }, index) =>
        `[Source ${index + 1}] ${docNameById[chunk.documentId.toString()]} (chunk ${chunk.chunkIndex})\n${chunk.content}`
    )
    .join('\n\n');

  let answer;
  const aiAnswer = await generateTextOrNull(
    questionAnsweringPrompt({ question: trimmed, context })
  );
  answer = aiAnswer || buildLocalAnswer(trimmed, sources);

  return saveAndReturn({
    user,
    chatId,
    question: trimmed,
    answer,
    sources,
  });
}

function extractSearchTerms(text) {
  const stop = new Set([
    'a', 'an', 'the', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'is', 'are',
    'was', 'were', 'be', 'been', 'do', 'does', 'did', 'can', 'could', 'would',
    'should', 'may', 'might', 'will', 'to', 'of', 'in', 'on', 'for', 'with',
    'about', 'into', 'from', 'at', 'by', 'or', 'and', 'if', 'this', 'that',
    'it', 'as', 'how', 'what', 'when', 'where', 'which', 'who', 'why',
  ]);
  return [...new Set(
    String(text)
      .toLowerCase()
      .match(/[a-z0-9]+/g) || []
  )].filter((t) => t.length > 1 && !stop.has(t));
}

function keywordOverlapScore(content, terms) {
  if (!terms.length) return 0;
  const hay = String(content || '').toLowerCase();
  if (!hay) return 0;

  let hits = 0;
  for (const term of terms) {
    if (hay.includes(term)) hits += 1;
  }
  const coverage = hits / terms.length;

  // Extra weight for multi-word policy phrases that often appear together.
  let phraseBonus = 0;
  if (terms.includes('medical') && terms.includes('leave') && /medical\s+leave/.test(hay)) {
    phraseBonus += 0.5;
  }
  if (terms.includes('casual') && terms.includes('leave') && /casual\s+leave/.test(hay)) {
    phraseBonus += 0.5;
  }
  if (terms.includes('maternity') && /maternity\s+leave/.test(hay)) {
    phraseBonus += 0.5;
  }
  if (terms.includes('wfh') && /\bwfh\b|work from home/.test(hay)) {
    phraseBonus += 0.4;
  }

  return coverage + phraseBonus;
}

function buildLocalAnswer(question, sources) {
  const citations = sources
    .map(
      (s) =>
        `- ${s.documentName} (chunk ${s.chunkIndex}${s.pageNumber != null ? `, page ${s.pageNumber}` : ''})`
    )
    .join('\n');

  return [
    `Based on accessible documents related to "${question}", here are the most relevant excerpts.`,
    '',
    ...sources.map(
      (s, i) =>
        `${i + 1}. From ${s.documentName}: ${s.excerpt}${s.excerpt.length >= 220 ? '...' : ''}`
    ),
    '',
    'Sources:',
    citations,
    '',
    'Note: Add GEMINI_API_KEY in backend/.env for polished AI-generated answers.',
  ].join('\n');
}

async function saveAndReturn({ user, chatId, question, answer, sources }) {
  let chat;

  if (chatId) {
    chat = await Chat.findOne({ _id: chatId, userId: user._id });
  }

  if (!chat) {
    chat = await Chat.create({
      userId: user._id,
      title: question.slice(0, 80),
      messages: [],
      lastQuestion: question,
    });
  }

  chat.messages.push(
    { role: 'user', content: question, sources: [] },
    { role: 'assistant', content: answer, sources }
  );
  chat.lastQuestion = question;
  if (chat.title === 'New conversation') {
    chat.title = question.slice(0, 80);
  }
  await chat.save();

  return {
    chatId: chat._id,
    answer,
    sources,
    chat,
  };
}

async function semanticSearch({ user, query, limit = 10 }) {
  const accessibleDocs = await Document.find({
    ...buildAccessibleDocumentFilter(user),
    status: 'ready',
  }).select('_id name department category');

  if (!accessibleDocs.length) {
    return [];
  }

  const docMap = Object.fromEntries(
    accessibleDocs.map((d) => [d._id.toString(), d])
  );
  const embedding = await embedText(query, { taskType: 'RETRIEVAL_QUERY' });
  const queryTerms = extractSearchTerms(query);
  const chunks = await Chunk.find({
    documentId: { $in: accessibleDocs.map((d) => d._id) },
  }).select('+embedding content chunkIndex documentId');

  const bestByDoc = new Map();

  for (const chunk of chunks) {
    const semantic = cosineSimilarity(embedding.vector, chunk.embedding || []);
    const lexical = keywordOverlapScore(chunk.content, queryTerms);
    const score = semantic + lexical * 0.35;
    const key = chunk.documentId.toString();
    const current = bestByDoc.get(key);
    if (!current || score > current.score) {
      bestByDoc.set(key, { chunk, score });
    }
  }

  return [...bestByDoc.entries()]
    .map(([docId, { chunk, score }]) => ({
      document: docMap[docId],
      score: Number(score.toFixed(4)),
      chunkIndex: chunk.chunkIndex,
      excerpt: chunk.content.slice(0, 200),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function listChats(user) {
  return Chat.find({ userId: user._id })
    .sort({ updatedAt: -1 })
    .select('title lastQuestion createdAt updatedAt messages');
}

async function getChat(user, chatId) {
  const chat = await Chat.findOne({ _id: chatId, userId: user._id });
  if (!chat) {
    throw new ApiError(404, 'Chat not found.');
  }
  return chat;
}

module.exports = {
  askQuestion,
  semanticSearch,
  listChats,
  getChat,
};
