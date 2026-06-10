/**
 * routes/plagiarism.js - Plagiarism Detection Routes
 * Handles check requests, report generation, and history
 */

const express = require('express');
const { getDB } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { preprocessText } = require('../utils/textPreprocessor');
const { divideAndConquerCheck, getComplexityAnalysis } = require('../algorithms/divideAndConquer');
const { multiDocCheck } = require('../algorithms/multiDocEngine');

const router = express.Router();

// ── Perform Multi-Document Plagiarism Check ──────────────────────────────────
router.post('/multi-check', authenticateToken, async (req, res, next) => {
  try {
    const { docIds } = req.body; // Expect array of 2-10 doc IDs

    if (!docIds || !Array.isArray(docIds) || docIds.length < 2 || docIds.length > 10) {
      return res.status(400).json({ success: false, message: 'Please provide between 2 and 10 document IDs.' });
    }

    const uniqueIds = [...new Set(docIds)];
    if (uniqueIds.length !== docIds.length) {
      return res.status(400).json({ success: false, message: 'Duplicate document IDs are not allowed.' });
    }

    const db = getDB();
    
    // Fetch all documents
    const placeholders = uniqueIds.map(() => '?').join(',');
    const query = `SELECT id, original_name, extracted_text FROM documents WHERE user_id = ? AND id IN (${placeholders})`;
    const docs = db.prepare(query).all(req.user.id, ...uniqueIds);

    if (docs.length !== uniqueIds.length) {
      return res.status(404).json({ success: false, message: 'One or more documents not found or unauthorized.' });
    }

    // Format for engine
    const engineInput = docs.map(doc => ({
      id: String(doc.id),
      name: doc.original_name,
      text: doc.extracted_text
    }));

    // Run multi-doc engine (Upgrades 1 & 2)
    const result = multiDocCheck(engineInput);

    // Save report (Adapt for existing reports schema - we'll save it as a meta-report)
    const algorithmData = JSON.stringify({
      type: 'multi_document',
      ...result
    });

    // To maintain backward compatibility with `reports` table (which expects doc1 and doc2),
    // we use the anchor as doc1 and a dummy or the first member as doc2, or 
    // better, just use the first two docs from the input for the mandatory columns
    // while storing the full result in algorithmData.
    const stmt = db.prepare(`
      INSERT INTO reports 
      (user_id, doc1_id, doc2_id, doc1_name, doc2_name, similarity_score, plagiarism_percent, matched_chunks, total_chunks, execution_time_ms, recursive_calls, tree_depth, algorithm_data) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      req.user.id, 
      uniqueIds[0], 
      uniqueIds[1], 
      docs.find(d => d.id == uniqueIds[0]).original_name, 
      docs.find(d => d.id == uniqueIds[1]).original_name,
      result.comparison_result.global_similarity_score / 100, // similarity_score
      result.comparison_result.global_similarity_score, // plagiarism_percent
      result.common_insights.summary.total_exact_matches, // matched_chunks (repurposed for metrics)
      result.comparison_result.comparisons_performed, // total_chunks (repurposed)
      result.existing_attributes.total_execution_time_ms, 
      0, // recursive_calls
      0, // tree_depth
      algorithmData
    );

    res.json({
      success: true,
      message: 'Multi-document comparison completed',
      reportId: info.lastInsertRowid,
      summary: result.comparison_result,
      insights: result.common_insights
    });

  } catch (error) {
    next(error);
  }
});

// ── Perform Plagiarism Check ─────────────────────────────────────────────────
router.post('/check', authenticateToken, async (req, res, next) => {
  try {
    const { doc1Id, doc2Id } = req.body;

    if (!doc1Id || !doc2Id) {
      return res.status(400).json({ success: false, message: 'Two document IDs are required.' });
    }

    if (doc1Id === doc2Id) {
      return res.status(400).json({ success: false, message: 'Cannot compare a document with itself.' });
    }

    const db = getDB();

    // Fetch documents
    const doc1 = db.prepare('SELECT id, original_name, extracted_text FROM documents WHERE id = ? AND user_id = ?').get(doc1Id, req.user.id);
    const doc2 = db.prepare('SELECT id, original_name, extracted_text FROM documents WHERE id = ? AND user_id = ?').get(doc2Id, req.user.id);

    if (!doc1 || !doc2) {
      return res.status(404).json({ success: false, message: 'One or both documents not found.' });
    }

    // 1. Preprocess
    const { tokens: tokensA } = preprocessText(doc1.extracted_text);
    const { tokens: tokensB } = preprocessText(doc2.extracted_text);

    // 2. Run Divide & Conquer
    const result = divideAndConquerCheck(tokensA, tokensB);

    // 3. Complexity Analysis
    const complexity = getComplexityAnalysis(tokensA.length, tokensB.length);

    // 4. Save Report
    const algorithmData = JSON.stringify({
      tree: result.algorithmTree,
      comparisons: result.chunkComparisons,
      complexity,
    });

    const stmt = db.prepare(`
      INSERT INTO reports 
      (user_id, doc1_id, doc2_id, doc1_name, doc2_name, similarity_score, plagiarism_percent, matched_chunks, total_chunks, execution_time_ms, recursive_calls, tree_depth, algorithm_data) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      req.user.id, doc1.id, doc2.id, doc1.original_name, doc2.original_name,
      result.similarityScore, result.plagiarismPercent, result.matchedChunks,
      result.totalChunks, result.executionTimeMs, result.recursiveCalls,
      result.treeDepth, algorithmData
    );

    res.json({
      success: true,
      message: 'Plagiarism check completed',
      reportId: info.lastInsertRowid,
      summary: {
        plagiarismPercent: result.plagiarismPercent,
        executionTimeMs: result.executionTimeMs,
      }
    });

  } catch (error) {
    next(error);
  }
});

// ── Get Single Report ────────────────────────────────────────────────────────
router.get('/report/:id', authenticateToken, (req, res, next) => {
  try {
    const db = getDB();
    const report = db.prepare('SELECT * FROM reports WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    // Parse JSON string back to object
    report.algorithm_data = JSON.parse(report.algorithm_data);

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
});

// ── Get User's Plagiarism History ────────────────────────────────────────────
router.get('/history', authenticateToken, (req, res, next) => {
  try {
    const db = getDB();
    const history = db.prepare(`
      SELECT id, doc1_name, doc2_name, plagiarism_percent, execution_time_ms, created_at 
      FROM reports 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({ success: true, history });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
