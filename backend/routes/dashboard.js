/**
 * routes/dashboard.js - Dashboard Stats Routes
 * Aggregates data for the frontend dashboard
 */

const express = require('express');
const { getDB } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticateToken, (req, res, next) => {
  try {
    const db = getDB();
    const userId = req.user.id;

    // Total documents
    const { totalDocs } = db.prepare('SELECT COUNT(*) as totalDocs FROM documents WHERE user_id = ?').get(userId);

    // Total reports & average plagiarism
    const reportStats = db.prepare(`
      SELECT 
        COUNT(*) as totalChecks, 
        AVG(plagiarism_percent) as avgPlagiarism
      FROM reports 
      WHERE user_id = ?
    `).get(userId);

    // Recent reports
    const recentReports = db.prepare(`
      SELECT id, doc1_name, doc2_name, plagiarism_percent, created_at 
      FROM reports 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all(userId);

    res.json({
      success: true,
      stats: {
        totalDocuments: totalDocs || 0,
        totalChecks: reportStats.totalChecks || 0,
        averagePlagiarism: reportStats.avgPlagiarism ? parseFloat(reportStats.avgPlagiarism.toFixed(2)) : 0,
        recentReports
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
