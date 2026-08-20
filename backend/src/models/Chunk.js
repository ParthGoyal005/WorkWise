const mongoose = require('mongoose');

/**
 * Text chunks extracted from documents.
 * Embeddings are stored on each chunk for Atlas Vector Search.
 */
const chunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    pageNumber: {
      type: Number,
      default: null,
    },
    tokenEstimate: {
      type: Number,
      default: 0,
    },
    /**
     * Dense embedding vector (Gemini text-embedding-004 → 768 dims).
     * Indexed via Atlas Vector Search in production.
     */
    embedding: {
      type: [Number],
      default: undefined,
      select: false,
    },
    embeddingModel: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

chunkSchema.index({ documentId: 1 });
chunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });

const Chunk = mongoose.model('Chunk', chunkSchema);

module.exports = Chunk;
