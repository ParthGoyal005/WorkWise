const { GoogleGenerativeAI } = require('@google/generative-ai');
const { loadEnv } = require('../config/env');
const { ApiError } = require('../utils/ApiError');

let genAI = null;

/** Models tried in order when the primary model is rate-limited or unavailable. */
const CHAT_MODEL_FALLBACKS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.6-flash',
];

function getClient() {
  const { geminiApiKey } = loadEnv();
  if (!geminiApiKey) {
    throw new ApiError(
      503,
      'Gemini API key is not configured. Add GEMINI_API_KEY to backend/.env.'
    );
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(geminiApiKey);
  }
  return genAI;
}

function isQuotaOrRateLimitError(err) {
  const message = String(err?.message || err || '');
  return (
    message.includes('429') ||
    message.includes('Too Many Requests') ||
    message.includes('Quota exceeded') ||
    message.includes('RESOURCE_EXHAUSTED')
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithModel(modelName, prompt) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: modelName });

  const result = await model.generateContent(prompt);
  const text = (result.response?.text?.() || '').trim();

  return text;
}

/**
 * Calls Gemini generateContent with model fallbacks and one retry on 429.
 */
async function generateText(prompt, options = {}) {
  const { geminiChatModel } = loadEnv();
  const preferred = options.model || geminiChatModel;
  const models = [
    preferred,
    ...CHAT_MODEL_FALLBACKS.filter((name) => name !== preferred),
  ];

  let lastError = null;

  for (const modelName of models) {
    try {
      return await generateWithModel(modelName, prompt);
    } catch (err) {
      lastError = err;
      if (!isQuotaOrRateLimitError(err)) {
        throw mapGeminiError(err);
      }
      // Brief pause then try the next lighter model
      await sleep(1200);
    }
  }

  // One delayed retry on the lightest model
  try {
    await sleep(12000);
    return await generateWithModel(models[models.length - 1], prompt);
  } catch (err) {
    lastError = err;
  }

  throw mapGeminiError(lastError);
}

function mapGeminiError(err) {
  if (isQuotaOrRateLimitError(err)) {
    return new ApiError(
      429,
      'Gemini quota exceeded for chat models. Wait a minute and try again, or enable billing / use a different API key. A local fallback summary can still be used.'
    );
  }
  return new ApiError(502, err?.message || 'Gemini request failed.');
}

async function generateJson(prompt) {
  const text = await generateText(prompt);
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new ApiError(502, 'AI returned invalid JSON. Please try again.');
  }
}

function hasGeminiConfigured() {
  return Boolean(loadEnv().geminiApiKey);
}

/**
 * Prefer Gemini; on quota/network failure return null so callers can fall back locally.
 */
async function generateTextOrNull(prompt, options = {}) {
  if (!hasGeminiConfigured()) {
    console.warn('[AI] No GEMINI_API_KEY — skipping Gemini, local fallback will be used.');
    return null;
  }
  try {
    return await generateText(prompt, options);
  } catch (err) {
    if (isQuotaOrRateLimitError(err) || err.statusCode === 429 || err.statusCode === 502) {
      console.warn('[AI] Gemini unavailable, using local fallback:', err.message);
      return null;
    }
    throw err;
  }
}

module.exports = {
  generateText,
  generateJson,
  generateTextOrNull,
  hasGeminiConfigured,
  isQuotaOrRateLimitError,
};
