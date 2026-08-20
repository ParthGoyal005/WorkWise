/**
 * Re-embed documents that still use local-hash-fallback (or a requested model mismatch)
 * so RAG queries that use Gemini embeddings can find them.
 *
 * Usage: node scripts/reembed-docs.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('../src/models/Document');
const Chunk = require('../src/models/Chunk');
const { processDocumentContent } = require('../src/services/documentService');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const fallbackChunkDocIds = await Chunk.distinct('documentId', {
    embeddingModel: { $in: [null, 'local-hash-fallback', 'empty'] },
  });

  console.log('Documents needing re-embed:', fallbackChunkDocIds.length);

  for (const id of fallbackChunkDocIds) {
    const doc = await Document.findById(id);
    if (!doc) continue;
    console.log(`Re-embedding "${doc.name}" (${doc._id}) ...`);
    try {
      doc.status = 'processing';
      await doc.save();
      await processDocumentContent(doc);
      console.log(`  OK — chunks: ${doc.chunkCount}`);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      doc.status = 'failed';
      doc.processingError = err.message;
      await doc.save();
    }
  }

  const remaining = await Chunk.countDocuments({
    embeddingModel: { $in: [null, 'local-hash-fallback', 'empty'] },
  });
  console.log('Remaining local-hash chunks:', remaining);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
