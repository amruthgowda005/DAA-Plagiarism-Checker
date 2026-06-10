/**
 * routes/media.js - Media Authenticity Routes (Upgrade 3)
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { analyzeMediaAuthenticity } = require('../algorithms/mediaAuthenticity');

const router = express.Router();

// ── Analyze Media Authenticity ───────────────────────────────────────────────
router.post('/analyze', authenticateToken, upload.single('media'), handleUploadError, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No media file uploaded' });
    }

    const { originalname, path: filePath, mimetype } = req.file;

    // Check if it's an image or video
    const isVideo = mimetype.startsWith('video/') || ['.mp4', '.mov', '.avi'].includes(path.extname(originalname).toLowerCase());
    const isImage = mimetype.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(originalname).toLowerCase());

    if (!isVideo && !isImage) {
      fs.unlinkSync(filePath); // Cleanup
      return res.status(400).json({ success: false, message: 'Invalid file type. Only images and videos are supported for authenticity analysis.' });
    }

    // Run authenticity analysis (Upgrade 3)
    const authenticityResult = await analyzeMediaAuthenticity(filePath, originalname, mimetype);

    // Provide the expected output format
    res.json({
      success: true,
      message: 'Media authenticity analysis complete.',
      media_authenticity: authenticityResult
    });

  } catch (error) {
    // Cleanup on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

module.exports = router;
