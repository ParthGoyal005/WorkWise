const mongoose = require('mongoose');

const documentSummarySchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      unique: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      default: null,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    regeneratedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const DocumentSummary = mongoose.model('DocumentSummary', documentSummarySchema);

module.exports = DocumentSummary;
