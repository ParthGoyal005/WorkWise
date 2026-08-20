const { CHUNK_SIZE, CHUNK_OVERLAP } = require('../config/constants');

/**
 * Splits long document text into overlapping chunks for embeddings / RAG.
 * Overlap helps keep sentences that cross boundaries searchable.
 */
function splitIntoChunks(text, options = {}) {
  const size = options.chunkSize || CHUNK_SIZE;
  const overlap = options.chunkOverlap || CHUNK_OVERLAP;
  const normalized = String(text || '').trim();

  if (!normalized) {
    return [];
  }

  const paragraphs = normalized.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let buffer = '';

  function pushChunk(content) {
    const trimmed = content.trim();
    if (!trimmed) return;
    chunks.push({
      chunkIndex: chunks.length,
      content: trimmed,
      tokenEstimate: Math.ceil(trimmed.length / 4),
      pageNumber: null,
    });
  }

  for (const paragraph of paragraphs) {
    if ((buffer + '\n\n' + paragraph).length <= size) {
      buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
      continue;
    }

    if (buffer) {
      pushChunk(buffer);
    }

    if (paragraph.length <= size) {
      // Start next buffer with overlap from previous chunk when possible
      const previous = chunks[chunks.length - 1]?.content || '';
      const overlapText = overlap > 0 && previous ? previous.slice(Math.max(0, previous.length - overlap)) : '';
      buffer = overlapText ? `${overlapText}\n\n${paragraph}` : paragraph;
    } 
    else {
      // Hard-split very long paragraphs
      let start = 0;
      while (start < paragraph.length) {
        const end = Math.min(start + size, paragraph.length);
        pushChunk(paragraph.slice(start, end));
        start = Math.max(end - overlap, end);
      }
      buffer = '';
    }
  }

  if (buffer) {
    pushChunk(buffer);
  }

  return chunks;
}

module.exports = { splitIntoChunks };
