/**
 * algorithms/divideAndConquer.js - Core DAA Plagiarism Detection Algorithm
 *
 * Algorithm: Divide and Conquer Plagiarism Detection
 *
 * Time Complexity:
 *   - Best Case:    O(n log n) — balanced splits, low similarity
 *   - Average Case: O(n log n) — typical document sizes
 *   - Worst Case:   O(n²)     — highly similar documents, max chunk comparisons
 *
 * Space Complexity: O(n log n) — recursion stack + chunk storage
 *
 * Phases:
 *   1. DIVIDE  — Recursively split token arrays into halves until chunk <= CHUNK_SIZE
 *   2. CONQUER — Compare leaf chunks using Jaccard Similarity
 *   3. COMBINE — Merge similarity scores up the tree, compute overall plagiarism %
 */

const { jaccardSimilarity } = require('../utils/textPreprocessor');

// ── Configuration ─────────────────────────────────────────────────────────────
const CHUNK_SIZE = 100; // Base case: stop dividing when chunk <= 100 words

/**
 * Main entry point for Divide and Conquer plagiarism detection
 *
 * @param {string[]} tokensA - Preprocessed tokens from Document A
 * @param {string[]} tokensB - Preprocessed tokens from Document B
 * @returns {Object} Full algorithm result with similarity, visualization data, metrics
 */
const divideAndConquerCheck = (tokensA, tokensB) => {
  const startTime = process.hrtime.bigint();

  // Algorithm state tracker
  const state = {
    recursiveCalls: 0,
    treeDepth: 0,
    totalChunks: 0,
    matchedChunks: 0,
    tree: null,
    chunkComparisons: [],
  };

  // Run the recursive D&C algorithm
  const result = divideAndConquer(tokensA, tokensB, 0, state);

  const endTime = process.hrtime.bigint();
  const executionTimeMs = Number(endTime - startTime) / 1_000_000;

  // Calculate final plagiarism percentage
  const plagiarismPercent = result.similarity * 100;

  return {
    similarityScore: parseFloat(result.similarity.toFixed(4)),
    plagiarismPercent: parseFloat(plagiarismPercent.toFixed(2)),
    matchedChunks: state.matchedChunks,
    totalChunks: state.totalChunks,
    executionTimeMs: parseFloat(executionTimeMs.toFixed(4)),
    recursiveCalls: state.recursiveCalls,
    treeDepth: state.treeDepth,
    algorithmTree: state.tree,
    chunkComparisons: state.chunkComparisons.slice(0, 50), // Cap for storage
    chunkSize: CHUNK_SIZE,
  };
};

/**
 * Recursive Divide and Conquer function
 *
 * @param {string[]} tokensA - Tokens from doc A (current chunk)
 * @param {string[]} tokensB - Tokens from doc B (current chunk)
 * @param {number} depth - Current recursion depth
 * @param {Object} state - Shared mutable state for metrics
 * @returns {{ similarity: number, node: Object }}
 */
const divideAndConquer = (tokensA, tokensB, depth, state) => {
  state.recursiveCalls++;
  state.treeDepth = Math.max(state.treeDepth, depth);

  const node = {
    id: state.recursiveCalls,
    depth,
    sizeA: tokensA.length,
    sizeB: tokensB.length,
    similarity: 0,
    isLeaf: false,
    children: [],
    phase: '',
  };

  // ── BASE CASE (CONQUER Phase) ─────────────────────────────────────────────
  // Stop dividing when chunk is small enough to compare directly
  if (tokensA.length <= CHUNK_SIZE || tokensB.length <= CHUNK_SIZE) {
    node.isLeaf = true;
    node.phase = 'CONQUER';

    const similarity = jaccardSimilarity(tokensA, tokensB);
    node.similarity = similarity;

    state.totalChunks++;
    if (similarity > 0.3) {
      state.matchedChunks++;
    }

    // Record chunk comparison for visualization
    state.chunkComparisons.push({
      depth,
      nodeId: node.id,
      sizeA: tokensA.length,
      sizeB: tokensB.length,
      similarity: parseFloat(similarity.toFixed(4)),
      sampleA: tokensA.slice(0, 10).join(' '),
      sampleB: tokensB.slice(0, 10).join(' '),
      isMatch: similarity > 0.3,
    });

    if (depth === 0) state.tree = node;
    return { similarity, node };
  }

  // ── DIVIDE Phase ──────────────────────────────────────────────────────────
  node.phase = 'DIVIDE';

  const midA = Math.floor(tokensA.length / 2);
  const midB = Math.floor(tokensB.length / 2);

  const leftA = tokensA.slice(0, midA);
  const rightA = tokensA.slice(midA);
  const leftB = tokensB.slice(0, midB);
  const rightB = tokensB.slice(midB);

  // Recursive calls — Left halves and Right halves
  const leftResult = divideAndConquer(leftA, leftB, depth + 1, state);
  const rightResult = divideAndConquer(rightA, rightB, depth + 1, state);

  node.children = [leftResult.node, rightResult.node];

  // ── COMBINE Phase ─────────────────────────────────────────────────────────
  // Weighted average by chunk size
  const totalSize = tokensA.length + tokensB.length;
  const leftWeight = (leftA.length + leftB.length) / totalSize;
  const rightWeight = (rightA.length + rightB.length) / totalSize;

  const combinedSimilarity = leftResult.similarity * leftWeight + rightResult.similarity * rightWeight;
  node.similarity = parseFloat(combinedSimilarity.toFixed(4));
  node.phase = 'COMBINE';

  // Store root node
  if (depth === 0) state.tree = node;

  return { similarity: combinedSimilarity, node };
};

/**
 * Get complexity analysis for given input sizes
 * @param {number} nA - Word count of document A
 * @param {number} nB - Word count of document B
 * @returns {Object} Complexity analysis object
 */
const getComplexityAnalysis = (nA, nB) => {
  const n = Math.max(nA, nB);
  const logN = Math.log2(n) || 1;
  const chunks = Math.ceil(n / CHUNK_SIZE);
  const treeDepth = Math.ceil(logN);

  return {
    inputSizeA: nA,
    inputSizeB: nB,
    chunkSize: CHUNK_SIZE,
    estimatedChunks: chunks,
    estimatedDepth: treeDepth,
    bestCase: {
      notation: 'O(n log n)',
      description: 'Balanced splits, early termination on low similarity',
      operations: Math.round(n * logN),
    },
    averageCase: {
      notation: 'O(n log n)',
      description: 'Typical document size with uniform split distribution',
      operations: Math.round(n * logN * 1.2),
    },
    worstCase: {
      notation: 'O(n²)',
      description: 'Highly similar documents requiring exhaustive chunk comparison',
      operations: Math.round(n * n),
    },
    spaceComplexity: {
      recursionStack: `O(log n) = O(${treeDepth})`,
      chunkStorage: `O(n log n) = O(${Math.round(n * logN)})`,
      total: `O(n log n)`,
    },
    recurrenceRelation: 'T(n) = 2T(n/2) + O(n)',
    masterTheoremCase: 'Case II — θ(n log n)',
  };
};

module.exports = { divideAndConquerCheck, getComplexityAnalysis, CHUNK_SIZE };
