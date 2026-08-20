const mongoose = require('mongoose');
const {
  DEPARTMENTS,
  DOCUMENT_CATEGORIES,
  ACCESS_TYPES,
  ROLES,
  FILE_TYPES,
} = require('../config/constants');

/**
 * Document-level access rules.
 * Stored on the document for simple permission checks during RAG.
 */
const documentPermissionSchema = new mongoose.Schema(
  {
    accessType: {
      type: String,
      enum: Object.values(ACCESS_TYPES),
      default: ACCESS_TYPES.PUBLIC,
      required: true,
    },
    allowedRoles: {
      type: [
        {
          type: String,
          enum: Object.values(ROLES),
        },
      ],
      default: [],
    },
    allowedDepartments: {
      type: [
        {
          type: String,
          enum: DEPARTMENTS,
        },
      ],
      default: [],
    },
    allowedUsers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true,
      maxlength: [255, 'Document name is too long'],
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: Object.values(FILE_TYPES),
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    department: {
      type: String,
      enum: DEPARTMENTS,
      required: [true, 'Department is required'],
    },
    category: {
      type: String,
      enum: DOCUMENT_CATEGORIES,
      required: [true, 'Category is required'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permissions: {
      type: documentPermissionSchema,
      default: () => ({ accessType: ACCESS_TYPES.PUBLIC }),
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
    },
    processingError: {
      type: String,
      default: null,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    hasSummary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

documentSchema.index({ name: 'text', category: 'text' });
documentSchema.index({ department: 1, category: 1 });
documentSchema.index({ 'permissions.accessType': 1 });
documentSchema.index({ uploadedBy: 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
