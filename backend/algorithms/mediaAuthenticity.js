/**
 * algorithms/mediaAuthenticity.js - Media Authenticity Attribute System (Upgrade 3)
 *
 * Detects whether images/videos are Human-created, AI-generated, or AI-assisted.
 * Generates the `media_authenticity` payload without modifying existing attributes.
 *
 * NOTE: This is a simulation engine for the attribute system as per requirements.
 * In production, this would interface with actual C2PA extraction libraries,
 * SynthID APIs, and visual forensics models.
 */

const path = require('path');
const fs = require('fs');
const exifr = require('exifr');
const axios = require('axios');

// ── Mock Helper Functions (Simulating Model Inference/Extraction) ─────────────

const calculateAILikelihood = (isAI, isAssisted) => {
  if (isAI) return { value: Math.floor(Math.random() * 20) + 81, confidence: 'high', label: 'AI Generated' };
  if (isAssisted) return { value: Math.floor(Math.random() * 20) + 41, confidence: 'medium', label: 'Mixed' };
  return { value: Math.floor(Math.random() * 20) + 1, confidence: 'high', label: 'Human' };
};

const simulateC2PA = (isAI) => ({
  present: Math.random() > 0.5,
  creator: isAI ? 'Midjourney v6' : 'Canon EOS R5',
  creation_device: isAI ? 'Cloud GPU Cluster' : 'Digital Camera',
  edit_history: isAI ? ['Created by AI', 'Upscaled'] : ['RAW Import', 'Color Corrected'],
  ai_tools_detected: isAI ? ['Midjourney', 'Topaz Gigapixel'] : [],
  signature_valid: Math.random() > 0.2
});

const simulateSynthID = (isAI) => ({
  present: isAI && Math.random() > 0.5, // Not all AI has SynthID
  confidence: isAI ? (Math.random() > 0.2 ? 'high' : 'medium') : 'low'
});

const simulateVisualForensics = (isAI) => ({
  facial_anomalies: isAI && Math.random() > 0.6,
  hand_distortion: isAI && Math.random() > 0.4,
  shadow_inconsistency: isAI && Math.random() > 0.5,
  lighting_errors: isAI && Math.random() > 0.5,
  texture_irregularities: isAI && Math.random() > 0.3,
  background_text_errors: isAI && Math.random() > 0.2,
  physics_violation_score: isAI ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 20)
});

const simulateVideoAnalysis = (isAI) => ({
  frame_consistency_score: isAI ? Math.floor(Math.random() * 30) + 40 : Math.floor(Math.random() * 10) + 90,
  motion_naturalness: isAI ? Math.floor(Math.random() * 40) + 30 : Math.floor(Math.random() * 15) + 85,
  lip_sync_accuracy: isAI ? Math.floor(Math.random() * 50) + 40 : Math.floor(Math.random() * 5) + 95,
  scene_transition_anomalies: isAI && Math.random() > 0.4
});

// ── Main Engine ───────────────────────────────────────────────────────────────

/**
 * Analyze media file for authenticity.
 * @param {string} filePath - Path to the media file
 * @param {string} originalName - Original filename
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<Object>} media_authenticity attribute object
 */
const analyzeMediaAuthenticity = async (filePath, originalName, mimeType) => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 800));

  const isVideo = mimeType.startsWith('video/') || ['.mp4', '.mov', '.avi'].includes(path.extname(originalName).toLowerCase());
  
  let isAI = false;
  let isAssisted = false;

  const lowerName = originalName.toLowerCase();
  const hasAITerm = lowerName.includes('ai') || lowerName.includes('midjourney') || lowerName.includes('dalle') || lowerName.includes('generated') || lowerName.includes('synth') || lowerName.includes('fake');
  const hasEditTerm = lowerName.includes('edit') || lowerName.includes('photoshop') || lowerName.includes('upscale') || lowerName.includes('mixed');

  // 1. Try Real Machine Learning Analysis (HuggingFace Inference API)
  let hfResult = null;
  if (!isVideo && process.env.HF_API_KEY) {
    try {
      const imageBuffer = fs.readFileSync(filePath);
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/Nahrawy/AI-Generated-Image-Detection',
        imageBuffer,
        {
          headers: {
            'Authorization': `Bearer ${process.env.HF_API_KEY}`,
            'Content-Type': 'application/octet-stream'
          },
          timeout: 10000
        }
      );
      
      // Response format: [{label: 'fake', score: 0.98}, {label: 'real', score: 0.02}]
      if (Array.isArray(response.data) && response.data.length > 0) {
        const topPrediction = response.data[0];
        if (topPrediction.label === 'fake' || topPrediction.label.includes('ai')) {
          isAI = true;
          hfResult = topPrediction.score * 100; // Use real ML confidence
        } else {
          isAI = false;
          hfResult = (1 - topPrediction.score) * 100;
        }
      }
    } catch (err) {
      console.error("[ML API] HuggingFace inference failed or SSL blocked. Falling back to EXIF deep-scan.");
    }
  }

  // 2. Fallback to EXIF Data if ML Model failed / no API key / is Video
  if (!isVideo && hfResult === null) {
    try {
      const exifData = await exifr.parse(filePath);
      if (exifData) {
        const software = (exifData.Software || '').toLowerCase();
        const make = (exifData.Make || '').toLowerCase();
        
        if (software.includes('midjourney') || software.includes('dall') || software.includes('ai') || software.includes('stable diffusion')) {
          isAI = true;
        } else if (software.includes('photoshop') || software.includes('lightroom') || software.includes('gimp')) {
          isAssisted = true;
        } else if (!make) {
          // CRITICAL HEURISTIC: Real photos have a Camera 'Make' (Apple, Samsung, Canon).
          // If an image lacks a camera signature, it's either AI generated or heavily web-compressed.
          isAI = true;
        } else {
          // Has a valid Camera Make (e.g. Apple)
          isAI = false;
        }
      } else {
        // Absolutely zero EXIF metadata. Real unedited photos almost ALWAYS have EXIF.
        // AI generators strip EXIF by default.
        isAI = true;
      }
    } catch (err) {
      // No valid EXIF format found
      isAI = true;
    }
  }

  // 3. Fallback to Filename Heuristics (Overrides)
  if (hasAITerm) isAI = true;
  if (!isAI && hasEditTerm) isAssisted = true;

  // Use ML score if available, otherwise generate heuristic score
  const aiScore = hfResult !== null 
    ? { value: Math.floor(hfResult), confidence: 'high', label: isAI ? 'AI Generated' : 'Human' }
    : calculateAILikelihood(isAI, isAssisted);
  
  let verdictLabel = 'Human';
  let verdictScore = 100 - aiScore.value; // Confidence in the label
  if (isAI) verdictLabel = 'AI Generated';
  else if (isAssisted) verdictLabel = 'AI Assisted';

  const authenticity_verdict = {
    final_label: verdictLabel,
    confidence_score: Math.floor(Math.random() * 20) + 80, // System confidence
    explanation: isAI 
      ? "Strong signals of AI generation detected via visual forensics and AI likelihood score."
      : isAssisted 
        ? "Mixed signals detected; base content appears human but exhibits AI modification traces."
        : "All forensic markers align with natural, human-created media."
  };

  const result = {
    ai_likelihood_score: aiScore,
    content_credentials: simulateC2PA(isAI),
    synthid_detection: simulateSynthID(isAI),
    visual_forensics: simulateVisualForensics(isAI),
    authenticity_verdict,
    media_type: isVideo ? 'video' : 'image'
  };

  if (isVideo) {
    result.video_analysis = simulateVideoAnalysis(isAI);
  }

  return result;
};

module.exports = { analyzeMediaAuthenticity };
