const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    documentName: String,
    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chunk',
    },
    chunkIndex: Number,
    pageNumber: Number,
    score: Number,
    excerpt: String,
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sources: {
      type: [sourceSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New conversation',
      trim: true,
      maxlength: 200,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    lastQuestion: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

chatSchema.index({ userId: 1, updatedAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
