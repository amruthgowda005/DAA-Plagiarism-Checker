/**
 * utils/fileParser.js - Document Text Extraction
 * Supports TXT, PDF, and DOCX file formats
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract plain text from a file based on its extension
 *
 * @param {string} filePath - Absolute path to the uploaded file
 * @param {string} originalName - Original filename (to determine type)
 * @returns {Promise<string>} Extracted text content
 */
const extractText = async (filePath, originalName) => {
  const ext = path.extname(originalName).toLowerCase();

  try {
    switch (ext) {
      case '.txt':
        return extractFromTxt(filePath);
      case '.pdf':
        return await extractFromPdf(filePath);
      case '.docx':
      case '.doc':
        return await extractFromDocx(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    throw new Error(`Failed to extract text from ${originalName}: ${error.message}`);
  }
};

/**
 * Extract text from a plain text file
 * @param {string} filePath
 * @returns {string}
 */
const extractFromTxt = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content;
};

/**
 * Extract text from a PDF file using pdf-parse
 * @param {string} filePath
 * @returns {Promise<string>}
 */
const extractFromPdf = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

/**
 * Extract text from a DOCX file using mammoth
 * @param {string} filePath
 * @returns {Promise<string>}
 */
const extractFromDocx = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

module.exports = { extractText };
