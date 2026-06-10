/**
 * middleware/upload.js - Multer File Upload Configuration
 * Handles TXT, PDF, DOCX uploads with validation
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Storage Engine ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp_userid_original
    const uniqueSuffix = `${Date.now()}_${req.user?.id || 'unknown'}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const basename = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 30);
    cb(null, `${uniqueSuffix}_${basename}${ext}`);
  },
});

// ── File Filter ───────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    // Media types
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
  ];
  const allowedExts = ['.txt', '.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Supported: TXT, PDF, DOCX, JPG, PNG, WEBP, MP4, MOV. Got: ${ext}`), false);
  }
};

// ── Multer Instance ───────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file (increased for videos)
    files: 10, // Increased from 2 to 10 for multi-doc
  },
});

// ── Error Handler for Multer ──────────────────────────────────────────────────
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum 10MB allowed.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Too many files. Maximum 10 files at once.' });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

module.exports = { upload, handleUploadError };
