const { GoogleGenerativeAI } = require('@google/generative-ai');
const { loadEnv } = require('../config/env');

const EMBEDDING_DIMENSIONS = 768;

let genAI = null;

function getClient() {
  const { geminiApiKey } = loadEnv();
  if (!geminiApiKey) {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(geminiApiKey);
  }
  return genAI;
}

/**
 * Creates an embedding vector for a piece of text.
 * Uses Gemini when GEMINI_API_KEY is set; otherwise a local hash embedding
 * so document upload / search still work during development.
 *
 * @param {string} text
 * @param {{ taskType?: string }} [options]
 *   Use RETRIEVAL_DOCUMENT when indexing chunks, RETRIEVAL_QUERY when searching.
 */
async function embedText(text, options = {}) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    return {
      vector: new Array(EMBEDDING_DIMENSIONS).fill(0),
      model: 'empty',
      dimensions: EMBEDDING_DIMENSIONS,
    };
  }

  const client = getClient();
  const { geminiEmbeddingModel } = loadEnv();

  if (client) {
    const { TaskType } = require('@google/generative-ai');
    const model = client.getGenerativeModel({ model: geminiEmbeddingModel });
    const taskType =
      options.taskType === 'RETRIEVAL_DOCUMENT'
        ? TaskType.RETRIEVAL_DOCUMENT
        : TaskType.RETRIEVAL_QUERY;

    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text: trimmed }] },
      taskType,
    });
    const values = result.embedding?.values || [];
    // gemini-embedding-001 defaults to 3072 dims; truncate + L2-normalize for 768.
    return {
      vector: normalize(padOrTrim(values, EMBEDDING_DIMENSIONS)),
      model: geminiEmbeddingModel,
      dimensions: EMBEDDING_DIMENSIONS,
    };
  }

  return {
    vector: localHashEmbedding(trimmed, EMBEDDING_DIMENSIONS),
    model: 'local-hash-fallback',
    dimensions: EMBEDDING_DIMENSIONS,
  };
}

async function embedMany(texts, options = {}) {
  const results = [];
  for (const text of texts) {
    // Sequential to stay within free-tier rate limits
    // eslint-disable-next-line no-await-in-loop
    results.push(await embedText(text, options));
  }
  return results;
}

function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Deterministic local embedding used when Gemini is not configured.
 * Not as accurate as Gemini, but enough to demo RAG end-to-end.
 */
function localHashEmbedding(text, dimensions) {
  const vector = new Array(dimensions).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) || [];

  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i += 1) {
      hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
    }
    const index = hash % dimensions;
    const sign = hash % 2 === 0 ? 1 : -1;
    vector[index] += sign;
  }

  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

function padOrTrim(values, dimensions) {
  if (values.length === dimensions) {
    return values;
  }
  if (values.length > dimensions) {
    return values.slice(0, dimensions);
  }
  return [...values, ...new Array(dimensions - values.length).fill(0)];
}

/** L2-normalize a vector (required after truncating gemini-embedding-001). */
function normalize(values) {
  const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  if (!norm) return values;
  return values.map((v) => v / norm);
}

function isUsingFallbackEmbeddings() {
  return !loadEnv().geminiApiKey;
}

module.exports = {
  embedText,
  embedMany,
  cosineSimilarity,
  isUsingFallbackEmbeddings,
  EMBEDDING_DIMENSIONS,
};
