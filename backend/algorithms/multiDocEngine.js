/**
 * algorithms/multiDocEngine.js - Multi-Document Comparison Engine (Upgrade 1 + 2)
 *
 * Strategy: Anchor-Based + Embedding Clustering
 *   1. Build TF-IDF vectors for all documents (lightweight, no external lib)
 *   2. Select an anchor (largest doc) and compare anchor vs all others
 *   3. Cluster remaining docs by cosine similarity to the anchor
 *   4. Run intra-cluster pairwise comparisons only
 *   5. Extract common_insights via MinHash (exact) + cosine (semantic)
 *
 * Time Complexity: O(n * D) where D = avg doc length, n = doc count (≤10)
 * Space Complexity: O(n * V) where V = vocabulary size
 *
 * BACKWARD COMPATIBLE: Does NOT modify existing divideAndConquer.js outputs.
 * Appends new fields: comparison_result, common_insights
 */

const { jaccardSimilarity, preprocessText } = require('../utils/textPreprocessor');
const { divideAndConquerCheck, getComplexityAnalysis } = require('./divideAndConquer');

// ── MinHash Configuration ──────────────────────────────────────────────────────
const MINHASH_PERMUTATIONS = 128;
const SHINGLING_SIZE = 3;         // trigram shingles
const EXACT_MATCH_THRESHOLD = 0.82;  // Jaccard ≥ 82% → exact match
const SEMANTIC_THRESHOLD = 0.35;     // cosine ≥ 35% → semantic match
const CLUSTER_THRESHOLD = 0.25;      // cosine ≥ 25% → same cluster

// ── TF-IDF Vector Builder ──────────────────────────────────────────────────────
/**
 * Build a TF-IDF vector for a token array against a global vocabulary.
 * @param {string[]} tokens
 * @param {Map<string,number>} idfMap - precomputed IDF for all terms
 * @returns {Map<string,number>}
 */
const buildTFIDF = (tokens, idfMap) => {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  const maxTF = Math.max(...tf.values(), 1);
  const tfidf = new Map();
  for (const [term, freq] of tf) {
    const normTF = freq / maxTF;
    const idf = idfMap.get(term) || 0;
    tfidf.set(term, normTF * idf);
  }
  return tfidf;
};

/**
 * Compute IDF map over all documents.
 * @param {string[][]} allTokenArrays
 * @returns {Map<string,number>}
 */
const buildIDF = (allTokenArrays) => {
  const N = allTokenArrays.length;
  const df = new Map();
  for (const tokens of allTokenArrays) {
    const seen = new Set(tokens);
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }
  const idf = new Map();
  for (const [term, count] of df) {
    idf.set(term, Math.log((N + 1) / (count + 1)) + 1); // smoothed IDF
  }
  return idf;
};

/**
 * Cosine similarity between two TF-IDF maps.
 * @param {Map<string,number>} vecA
 * @param {Map<string,number>} vecB
 * @returns {number} 0–1
 */
const cosineSimilarity = (vecA, vecB) => {
  let dot = 0, magA = 0, magB = 0;
  for (const [term, valA] of vecA) {
    const valB = vecB.get(term) || 0;
    dot += valA * valB;
    magA += valA * valA;
  }
  for (const valB of vecB.values()) magB += valB * valB;
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

// ── MinHash Engine ─────────────────────────────────────────────────────────────
/**
 * Generate trigram shingles from token array.
 * @param {string[]} tokens
 * @returns {Set<string>}
 */
const buildShingles = (tokens) => {
  const shingles = new Set();
  for (let i = 0; i <= tokens.length - SHINGLING_SIZE; i++) {
    shingles.add(tokens.slice(i, i + SHINGLING_SIZE).join(' '));
  }
  // Also add unigrams for short texts
  if (tokens.length < SHINGLING_SIZE * 2) {
    tokens.forEach(t => shingles.add(t));
  }
  return shingles;
};

/**
 * Estimate Jaccard similarity via MinHash signature.
 * Uses deterministic hash functions: h(x) = (a*x + b) mod P
 * @param {Set<string>} shinglesA
 * @param {Set<string>} shinglesB
 * @returns {number} 0–1 estimated Jaccard
 */
const minHashSimilarity = (shinglesA, shinglesB) => {
  if (shinglesA.size === 0 && shinglesB.size === 0) return 1;
  if (shinglesA.size === 0 || shinglesB.size === 0) return 0;

  // For small shingle sets just use exact Jaccard (faster)
  if (shinglesA.size < 50 && shinglesB.size < 50) {
    const intersection = new Set([...shinglesA].filter(s => shinglesB.has(s)));
    const union = shinglesA.size + shinglesB.size - intersection.size;
    return union === 0 ? 0 : intersection.size / union;
  }

  // MinHash approximation
  const allShingles = [...new Set([...shinglesA, ...shinglesB])];
  const n = allShingles.length;
  let matches = 0;
  const LARGE_PRIME = 4294967311; // 2^32 + 15 (prime)

  for (let p = 0; p < MINHASH_PERMUTATIONS; p++) {
    // Deterministic pseudo-random coefficients
    const a = (p * 2654435761 + 1) >>> 0;
    const b = (p * 2246822519 + 17) >>> 0;

    let minA = Infinity, minB = Infinity;
    for (let i = 0; i < allShingles.length; i++) {
      const h = ((BigInt(a) * BigInt(i) + BigInt(b)) % BigInt(LARGE_PRIME));
      const hNum = Number(h);
      if (shinglesA.has(allShingles[i]) && hNum < minA) minA = hNum;
      if (shinglesB.has(allShingles[i]) && hNum < minB) minB = hNum;
    }
    if (minA === minB) matches++;
  }
  return matches / MINHASH_PERMUTATIONS;
};

// ── Sentence-level Exact Match Extractor ──────────────────────────────────────
/**
 * Extract shared text segments across all documents.
 * Uses sliding window of 5-token phrases.
 * @param {Array<{id: string, tokens: string[]}>} docs
 * @returns {{ exact_matches: Array, semantic_matches: Array }}
 */
const extractCommonInsights = (docs, tfidfVectors) => {
  const PHRASE_LEN = 5;
  const MIN_DOCS = 2;

  // Build phrase → docIds map
  const phraseMap = new Map();
  for (const { id, tokens } of docs) {
    const seen = new Set();
    for (let i = 0; i <= tokens.length - PHRASE_LEN; i++) {
      const phrase = tokens.slice(i, i + PHRASE_LEN).join(' ');
      if (!seen.has(phrase)) {
        seen.add(phrase);
        if (!phraseMap.has(phrase)) phraseMap.set(phrase, new Set());
        phraseMap.get(phrase).add(id);
      }
    }
  }

  // Filter phrases that appear in ≥ 2 documents (cap at 20 results)
  const exactMatches = [];
  for (const [phrase, docSet] of phraseMap) {
    if (docSet.size >= MIN_DOCS) {
      exactMatches.push({
        text: phrase,
        present_in_docs: [...docSet],
        coverage: parseFloat((docSet.size / docs.length * 100).toFixed(1)),
      });
    }
    if (exactMatches.length >= 20) break;
  }

  // Sort by coverage (most widespread first)
  exactMatches.sort((a, b) => b.present_in_docs.length - a.present_in_docs.length || b.coverage - a.coverage);

  // Semantic matches: term-level shared high-IDF tokens across ≥2 docs
  const semanticMatches = [];
  const termDocMap = new Map();
  for (const { id, tokens } of docs) {
    const seen = new Set(tokens);
    for (const t of seen) {
      if (t.length < 4) continue; // skip short/stop words
      if (!termDocMap.has(t)) termDocMap.set(t, new Set());
      termDocMap.get(t).add(id);
    }
  }

  // Find semantically important shared terms (IDF-weighted)
  const idfMap = buildIDF(docs.map(d => d.tokens));
  const scored = [];
  for (const [term, docSet] of termDocMap) {
    if (docSet.size >= MIN_DOCS && idfMap.get(term) > 1.0) {
      const cosineScores = [];
      const docArr = [...docSet];
      for (let i = 0; i < docArr.length - 1; i++) {
        for (let j = i + 1; j < docArr.length; j++) {
          const vecA = tfidfVectors.get(docArr[i]);
          const vecB = tfidfVectors.get(docArr[j]);
          if (vecA && vecB) cosineScores.push(cosineSimilarity(vecA, vecB));
        }
      }
      const avgSim = cosineScores.length > 0
        ? cosineScores.reduce((s, v) => s + v, 0) / cosineScores.length
        : 0;
      if (avgSim >= SEMANTIC_THRESHOLD) {
        scored.push({ term, docSet, avgSim });
      }
    }
  }

  scored.sort((a, b) => b.avgSim - a.avgSim);
  // Group top semantic terms into topic clusters (simple: just take top 10 terms)
  const topTerms = scored.slice(0, 10);
  for (const { term, docSet, avgSim } of topTerms) {
    semanticMatches.push({
      text: term,
      similarity_score: parseFloat((avgSim * 100).toFixed(1)),
      present_in_docs: [...docSet],
      coverage: parseFloat((docSet.size / docs.length * 100).toFixed(1)),
    });
  }

  return { exact_matches: exactMatches.slice(0, 15), semantic_matches: semanticMatches };
};

// ── Main Multi-Document Engine ─────────────────────────────────────────────────
/**
 * Main entry point for multi-document comparison.
 *
 * @param {Array<{id: string, text: string}>} documents - 2–10 documents
 * @returns {Object} { existing_attributes, comparison_result, common_insights }
 */
const multiDocCheck = (documents) => {
  const startTime = process.hrtime.bigint();

  // ── Validation ────────────────────────────────────────────────────────────
  if (!Array.isArray(documents) || documents.length < 2) {
    throw new Error('At least 2 documents are required for multi-document comparison.');
  }
  if (documents.length > 10) {
    throw new Error('Maximum 10 documents are allowed per comparison.');
  }

  // ── Preprocess ────────────────────────────────────────────────────────────
  const processed = documents.map(doc => {
    const { tokens } = preprocessText(doc.text || doc.content || '');
    return { id: doc.id, tokens, shingles: buildShingles(tokens) };
  });

  // ── Build TF-IDF Embeddings ───────────────────────────────────────────────
  const idfMap = buildIDF(processed.map(d => d.tokens));
  const tfidfVectors = new Map();
  for (const doc of processed) {
    tfidfVectors.set(doc.id, buildTFIDF(doc.tokens, idfMap));
  }

  // ── Select Anchor (largest document) ─────────────────────────────────────
  const anchor = processed.reduce((prev, cur) =>
    cur.tokens.length > prev.tokens.length ? cur : prev
  );

  // ── Cosine similarity: anchor vs all ─────────────────────────────────────
  const anchorVec = tfidfVectors.get(anchor.id);
  const anchorSimilarities = new Map();
  for (const doc of processed) {
    if (doc.id === anchor.id) { anchorSimilarities.set(doc.id, 1.0); continue; }
    anchorSimilarities.set(doc.id, cosineSimilarity(anchorVec, tfidfVectors.get(doc.id)));
  }

  // ── Clustering: group docs by similarity to anchor ────────────────────────
  const clusters = { high: [], medium: [], low: [] };
  for (const doc of processed) {
    if (doc.id === anchor.id) continue;
    const sim = anchorSimilarities.get(doc.id);
    if (sim >= CLUSTER_THRESHOLD * 2) clusters.high.push(doc);
    else if (sim >= CLUSTER_THRESHOLD) clusters.medium.push(doc);
    else clusters.low.push(doc);
  }

  // ── Pairwise Comparisons (anchor-reduced strategy) ────────────────────────
  const pairwiseSummary = [];
  const comparedPairs = new Set();

  const comparePair = (docA, docB) => {
    const key = [docA.id, docB.id].sort().join('::');
    if (comparedPairs.has(key)) return;
    comparedPairs.add(key);

    const mhSim = minHashSimilarity(docA.shingles, docB.shingles);
    const cosSim = cosineSimilarity(tfidfVectors.get(docA.id), tfidfVectors.get(docB.id));
    const combinedSim = mhSim * 0.6 + cosSim * 0.4;

    // Run D&C for pairs that show significant similarity
    let dcResult = null;
    if (combinedSim > 0.1 && docA.tokens.length > 0 && docB.tokens.length > 0) {
      dcResult = divideAndConquerCheck(docA.tokens, docB.tokens);
    }

    pairwiseSummary.push({
      doc_a: docA.id,
      doc_b: docB.id,
      minhash_similarity: parseFloat((mhSim * 100).toFixed(2)),
      cosine_similarity: parseFloat((cosSim * 100).toFixed(2)),
      combined_similarity: parseFloat((combinedSim * 100).toFixed(2)),
      plagiarism_percent: dcResult ? dcResult.plagiarismPercent : parseFloat((combinedSim * 100).toFixed(2)),
      execution_time_ms: dcResult ? dcResult.executionTimeMs : 0,
      recursive_calls: dcResult ? dcResult.recursiveCalls : 0,
    });
  };

  // Anchor vs all
  for (const doc of processed) {
    if (doc.id !== anchor.id) comparePair(anchor, doc);
  }

  // Intra-cluster pairwise (within high-similarity cluster only)
  const highCluster = clusters.high;
  for (let i = 0; i < highCluster.length; i++) {
    for (let j = i + 1; j < highCluster.length; j++) {
      comparePair(highCluster[i], highCluster[j]);
    }
  }

  // ── Global Similarity Score ───────────────────────────────────────────────
  const allSims = pairwiseSummary.map(p => p.combined_similarity);
  const globalSim = allSims.length > 0
    ? parseFloat((allSims.reduce((s, v) => s + v, 0) / allSims.length).toFixed(2))
    : 0;

  // ── Cluster Summary ───────────────────────────────────────────────────────
  const clusterSummary = [
    {
      cluster: 'high_similarity',
      anchor_id: anchor.id,
      members: clusters.high.map(d => d.id),
      threshold_used: `≥ ${(CLUSTER_THRESHOLD * 200).toFixed(0)}% cosine`,
    },
    {
      cluster: 'medium_similarity',
      anchor_id: anchor.id,
      members: clusters.medium.map(d => d.id),
      threshold_used: `${(CLUSTER_THRESHOLD * 100).toFixed(0)}–${(CLUSTER_THRESHOLD * 200).toFixed(0)}% cosine`,
    },
    {
      cluster: 'low_similarity',
      anchor_id: anchor.id,
      members: clusters.low.map(d => d.id),
      threshold_used: `< ${(CLUSTER_THRESHOLD * 100).toFixed(0)}% cosine`,
    },
  ];

  // ── Common Insights (Upgrade 2) ───────────────────────────────────────────
  const commonInsights = extractCommonInsights(processed, tfidfVectors);

  const endTime = process.hrtime.bigint();
  const totalMs = parseFloat((Number(endTime - startTime) / 1_000_000).toFixed(4));

  return {
    // Preserve backward-compat: existing single-pair D&C result is in pairwise[0]
    existing_attributes: {
      note: 'Multi-document mode active. For single-pair D&C detail, see pairwise_summary[0].',
      total_documents: documents.length,
      anchor_document: anchor.id,
      total_execution_time_ms: totalMs,
    },

    comparison_result: {
      pairwise_summary: pairwiseSummary,
      cluster_summary: clusterSummary,
      global_similarity_score: globalSim,
      comparisons_performed: comparedPairs.size,
      strategy: 'anchor_based_clustering',
    },

    common_insights: {
      exact_matches: commonInsights.exact_matches,
      semantic_matches: commonInsights.semantic_matches,
      summary: {
        total_exact_matches: commonInsights.exact_matches.length,
        total_semantic_matches: commonInsights.semantic_matches.length,
        common_across_all: commonInsights.exact_matches.filter(m => m.present_in_docs.length === documents.length).length,
        common_across_most: commonInsights.exact_matches.filter(m => m.present_in_docs.length >= Math.ceil(documents.length * 0.6)).length,
      },
    },
  };
};

module.exports = { multiDocCheck };
