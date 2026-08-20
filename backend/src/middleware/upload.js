const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ApiError } = require('../utils/ApiError');
const { getUploadDirectory } = require('../services/documentService');

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const dir = getUploadDirectory();
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${unique}-${safeName}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  const okExt = ['.pdf', '.docx', '.txt'].includes(ext);

  if (allowed.includes(file.mimetype) || okExt) {
    cb(null, true);
    return;
  }

  cb(new ApiError(400, 'Only PDF, DOCX, and TXT files are allowed.'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

module.exports = { upload };
