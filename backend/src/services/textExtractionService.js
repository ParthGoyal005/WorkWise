const fs = require('fs/promises');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { ApiError } = require('../utils/ApiError');
const { FILE_TYPES } = require('../config/constants');

/**
 * Reads an uploaded file and returns plain text.
 * Supports PDF, DOCX, and TXT.
 */
async function extractText(filePath, fileType) {
  const absolutePath = path.resolve(filePath);

  switch (fileType) {
    case FILE_TYPES.PDF: {
      const buffer = await fs.readFile(absolutePath);
      const result = await pdfParse(buffer);
      return {
        text: cleanText(result.text),
        pageCount: result.numpages || null,
      };
    }
    case FILE_TYPES.DOCX: {
      const result = await mammoth.extractRawText({ path: absolutePath });
      return {
        text: cleanText(result.value),
        pageCount: null,
      };
    }
    case FILE_TYPES.TXT: {
      const raw = await fs.readFile(absolutePath, 'utf8');
      return {
        text: cleanText(raw),
        pageCount: null,
      };
    }
    default:
      throw new ApiError(400, `Unsupported file type: ${fileType}`);
  }
}

function cleanText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
}

function detectFileType(originalName, mimeType) {
  const ext = path.extname(originalName || '').toLowerCase();

  if (ext === '.pdf' || mimeType === 'application/pdf') {
    return FILE_TYPES.PDF;
  }
  if (
    ext === '.docx' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return FILE_TYPES.DOCX;
  }
  if (ext === '.txt' || mimeType === 'text/plain') {
    return FILE_TYPES.TXT;
  }

  throw new ApiError(400, 'Only PDF, DOCX, and TXT files are supported.');
}

module.exports = {
  extractText,
  cleanText,
  detectFileType,
};
