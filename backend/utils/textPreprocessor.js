/**
 * utils/textPreprocessor.js - Text Preprocessing Pipeline
 * Cleans and tokenizes extracted text before DAA algorithm processing
 */

/**
 * Full preprocessing pipeline:
 * 1. Lowercase
 * 2. Remove punctuation & special characters
 * 3. Remove extra whitespace
 * 4. Tokenize into words
 *
 * @param {string} text - Raw extracted text
 * @returns {{ tokens: string[], cleanText: string, wordCount: number }}
 */
const preprocessText = (text) => {
  if (!text || typeof text !== 'string') {
    return { tokens: [], cleanText: '', wordCount: 0 };
  }

  // Step 1: Lowercase
  let cleaned = text.toLowerCase();

  // Step 2: Remove punctuation and special characters (keep only letters, digits, spaces)
  cleaned = cleaned.replace(/[^a-z0-9\s]/g, ' ');

  // Step 3: Remove extra whitespace / newlines
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Step 4: Tokenize
  const tokens = cleaned.split(' ').filter((word) => word.length > 0);

  return {
    tokens,
    cleanText: cleaned,
    wordCount: tokens.length,
  };
};

/**
 * Compute unique vocabulary set from tokens
 * @param {string[]} tokens
 * @returns {Set<string>}
 */
const buildVocabulary = (tokens) => new Set(tokens);

/**
 * Compute Jaccard Similarity between two token arrays
 * Jaccard(A, B) = |A ∩ B| / |A ∪ B|
 *
 * @param {string[]} tokensA
 * @param {string[]} tokensB
 * @returns {number} Similarity score between 0 and 1
 */
const jaccardSimilarity = (tokensA, tokensB) => {
  if (tokensA.length === 0 && tokensB.length === 0) return 1;
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
};

module.exports = { preprocessText, buildVocabulary, jaccardSimilarity };
