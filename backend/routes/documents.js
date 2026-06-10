/**
 * routes/documents.js - Document Management Routes
 * Handles uploading, listing, fetching, and deleting user documents
 */

const express = require('express');
const fs = require('fs');
const { getDB } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { extractText } = require('../utils/fileParser');
const { preprocessText } = require('../utils/textPreprocessor');

const router = express.Router();

// ── Upload Document ──────────────────────────────────────────────────────────
router.post('/upload', authenticateToken, upload.single('document'), handleUploadError, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { originalname, filename, path: filePath, size, mimetype } = req.file;

    // Extract text
    const extractedRawText = await extractText(filePath, originalname);

    // Preprocess to get word count
    const { wordCount, cleanText } = preprocessText(extractedRawText);

    if (wordCount === 0) {
      // Cleanup empty file
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'Could not extract any readable text from the document.' });
    }

    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO documents 
      (user_id, filename, original_name, file_type, file_size, extracted_text, word_count, upload_path) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(req.user.id, filename, originalname, mimetype, size, cleanText, wordCount, filePath);

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      documentId: info.lastInsertRowid,
    });
  } catch (error) {
    // Cleanup on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// ── Get User's Documents ─────────────────────────────────────────────────────
router.get('/', authenticateToken, (req, res, next) => {
  try {
    const db = getDB();
    // Do not send extracted_text to save bandwidth
    const documents = db.prepare(`
      SELECT id, original_name, file_type, file_size, word_count, created_at 
      FROM documents 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({ success: true, documents });
  } catch (error) {
    next(error);
  }
});

// ── Get Single Document ──────────────────────────────────────────────────────
router.get('/:id', authenticateToken, (req, res, next) => {
  try {
    const db = getDB();
    const document = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    res.json({ success: true, document });
  } catch (error) {
    next(error);
  }
});

// ── Delete Document ──────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, (req, res, next) => {
  try {
    const db = getDB();
    const document = db.prepare('SELECT id, upload_path FROM documents WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Delete file from disk
    if (fs.existsSync(document.upload_path)) {
      fs.unlinkSync(document.upload_path);
    }

    // Delete from DB (associated reports will be cascade deleted)
    db.prepare('DELETE FROM documents WHERE id = ?').run(document.id);

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
