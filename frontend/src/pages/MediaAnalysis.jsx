import { useState } from 'react';
import api from '../services/api';
import {
  Image as ImageIcon,
  UploadCloud, Loader2, AlertTriangle, ShieldCheck,
  Video, RefreshCw, Camera, MapPin, Bot, Cpu, Smartphone,
  CheckCircle2, XCircle, Zap, Eye, Film, Layers, Fingerprint, Cpu as CpuIcon, Info
} from 'lucide-react';

// ── Detect manufacturer type ─────────────────────────────────────────────────
const getMakeCategory = (creator = '') => {
  const c = creator.toLowerCase();
  if (c.includes('apple') || c.includes('iphone') || c.includes('samsung') || c.includes('google pixel') || c.includes('oneplus') || c.includes('xiaomi') || c.includes('oppo') || c.includes('vivo') || c.includes('realme') || c.includes('huawei')) return 'smartphone';
  if (c.includes('canon') || c.includes('nikon') || c.includes('sony') || c.includes('fuji') || c.includes('panasonic') || c.includes('olympus')) return 'dslr';
  return 'camera';
};

const Badge = ({ ok, label }) => (
  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${ok ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
    {ok ? '✓ ' : '✗ '}{label}
  </span>
);

export default function MediaAnalysis() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError('');
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select an image or video file.'); return; }
    const formData = new FormData();
    formData.append('media', file);
    try {
      setError('');
      setLoading(true);
      const res = await api.post('/media/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data.media_authenticity);
    } catch (err) {
      setError(err.response?.data?.message || 'Media analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => { setFile(null); setResult(null); setPreview(null); };

  const isHuman = result?.authenticity_verdict?.final_label === 'Human';
  const isAIGen = result?.authenticity_verdict?.final_label === 'AI Generated';
  const isAssisted = result?.authenticity_verdict?.final_label === 'AI Assisted';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Media Authenticity Engine</h2>
        <p className="text-slate-500 max-w-lg mx-auto text-sm">
          Deep pixel-level AI detection using HuggingFace ML model + EXIF binary forensics + GPS extraction.
        </p>
      </div>

      {!result ? (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
          <form onSubmit={handleAnalyze} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-700 flex items-center gap-3 border border-red-100">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="font-medium text-sm">{error}</p>
              </div>
            )}
            <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${file ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 hover:border-emerald-400 bg-slate-50'}`}>
              <input type="file" id="media-upload" accept="image/*,video/mp4,video/quicktime" onChange={handleFileChange} className="hidden" />
              <label htmlFor="media-upload" className="cursor-pointer flex flex-col items-center gap-3">
                {file ? (
                  <>
                    {preview && !file.type.startsWith('video') && (
                      <img src={preview} alt="Preview" className="w-40 h-40 object-cover rounded-xl mb-2 shadow-md" />
                    )}
                    {file.type.startsWith('video') ? <Video size={48} className="text-emerald-500" /> : null}
                    <p className="text-emerald-700 font-bold text-lg">{file.name}</p>
                    <p className="text-emerald-600/70 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB — Click to change</p>
                  </>
                ) : (
                  <>
                    <UploadCloud size={48} className="text-slate-400" />
                    <p className="text-slate-700 font-semibold text-lg">Drop or click to upload media</p>
                    <p className="text-slate-400 text-sm">JPG, PNG, WEBP, MP4, MOV · Max 50MB</p>
                  </>
                )}
              </label>
            </div>
            <div className="flex justify-center">
              <button type="submit" disabled={!file || loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-base">
                {loading && <Loader2 className="animate-spin w-5 h-5" />}
                {loading ? 'Running Deep Forensics...' : 'Verify Authenticity'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Topbar */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              {preview && !result.media_type.startsWith('video') && (
                <img src={preview} alt="Analyzed" className="w-14 h-14 object-cover rounded-xl border-2 border-slate-200" />
              )}
              <div>
                <p className="text-sm font-bold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB · Analysis complete</p>
              </div>
            </div>
            <button onClick={resetAnalysis} className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
              <RefreshCw size={16} /> Analyze Another
            </button>
          </div>

          {/* Verdict Hero Card */}
          <div className={`rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm border ${
            isHuman ? 'bg-green-50 border-green-200' :
            isAssisted ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Final Verdict</p>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-2xl ${isHuman ? 'bg-green-100 text-green-700' : isAssisted ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {isHuman ? <Camera size={32} /> : isAIGen ? <Bot size={32} /> : <Cpu size={32} />}
                </div>
                <div>
                  <h3 className={`text-3xl font-black ${isHuman ? 'text-green-700' : isAssisted ? 'text-yellow-700' : 'text-red-700'}`}>
                    {result.authenticity_verdict.final_label}
                  </h3>
                  <p className="text-slate-500 text-sm mt-0.5">{result.authenticity_verdict.confidence_score}% Confidence</p>
                </div>
              </div>
              <p className={`text-sm italic border-l-4 pl-4 ${isHuman ? 'border-green-400 text-green-800' : isAssisted ? 'border-yellow-400 text-yellow-800' : 'border-red-400 text-red-800'}`}>
                "{result.authenticity_verdict.explanation}"
              </p>
            </div>
            {/* AI Score Meter */}
            <div className="w-full md:w-52 shrink-0">
              <div className="relative w-40 h-40 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="66" fill="none" stroke="#e2e8f0" strokeWidth="14" />
                  <circle cx="80" cy="80" r="66" fill="none"
                    stroke={isHuman ? '#10b981' : isAssisted ? '#f59e0b' : '#ef4444'}
                    strokeWidth="14"
                    strokeDasharray={`${2 * Math.PI * 66}`}
                    strokeDashoffset={`${2 * Math.PI * 66 * (1 - result.ai_likelihood_score.value / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-800">{result.ai_likelihood_score.value}%</span>
                  <span className="text-xs font-semibold text-slate-500">AI Score</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── HUMAN PHOTO: Camera + Location Details ─────────────── */}
          {isHuman && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Device Info */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
                  {getMakeCategory(result.content_credentials.creator) === 'smartphone' ? <Smartphone size={18} className="text-blue-500" /> : <Camera size={18} className="text-blue-500" />}
                  Camera / Device Info
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-slate-500 shrink-0">Device</span>
                    <span className="text-sm font-bold text-slate-800 text-right">{result.content_credentials.creator}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-slate-500 shrink-0">Type</span>
                    <span className="text-sm font-semibold text-slate-700 capitalize">{getMakeCategory(result.content_credentials.creator)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-slate-500 shrink-0">Edit History</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {result.content_credentials.edit_history.map((h, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{h}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Signature</span>
                    <Badge ok={result.content_credentials.signature_valid} label={result.content_credentials.signature_valid ? 'Verified' : 'Not Found'} />
                  </div>
                </div>
              </div>

              {/* GPS Location */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
                  <MapPin size={18} className="text-emerald-500" /> GPS Location
                </h3>
                {result.content_credentials.location && result.content_credentials.location !== 'Not Available' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Coordinates Extracted</p>
                      <p className="text-base font-mono font-bold text-emerald-900">{result.content_credentials.location}</p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${result.content_credentials.location}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <MapPin size={14} /> Open in Google Maps →
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-28 text-center">
                    <MapPin size={32} className="text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-500">No GPS Data Found</p>
                    <p className="text-xs text-slate-400 mt-1">Location was disabled or stripped during upload.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AI IMAGE: Tool Detection ─────────────────────────────── */}
          {(isAIGen || isAssisted) && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-800 mb-5 pb-3 border-b border-red-100 flex items-center gap-2">
                  <Bot size={18} className="text-red-500" /> AI Generation Source
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 p-5 bg-red-50 rounded-xl border border-red-100 flex flex-col items-center text-center gap-2">
                    <Zap size={28} className="text-red-500" />
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Detected AI Tool</p>
                    <p className="text-lg font-black text-red-900 leading-tight">{result.content_credentials.ai_tools_detected[0] || 'Unknown AI Generator'}</p>
                    {result.content_credentials.ai_tool_fingerprint && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold mt-1 ${
                        result.content_credentials.ai_tool_fingerprint.confidence === 'high' ? 'bg-red-100 text-red-700' :
                        result.content_credentials.ai_tool_fingerprint.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{result.content_credentials.ai_tool_fingerprint.confidence} confidence</span>
                    )}
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-500 shrink-0">Generation Platform</span>
                      <span className="text-sm font-bold text-slate-800 text-right">{result.content_credentials.creator}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-500 shrink-0">Processing</span>
                      <span className="text-sm font-bold text-slate-800">{result.content_credentials.creation_device}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-500 shrink-0">Workflow</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {result.content_credentials.edit_history.map((h, i) => (
                          <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">{h}</span>
                        ))}
                      </div>
                    </div>
                    {result.content_credentials.ai_tool_fingerprint?.dimensions && (
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-sm text-slate-500">Image Dimensions</span>
                        <span className="font-mono text-sm font-bold text-slate-800">{result.content_credentials.ai_tool_fingerprint.dimensions}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fingerprint Signals */}
                {result.content_credentials.ai_tool_fingerprint?.signals?.length > 0 && (
                  <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Fingerprint size={14} /> Visual Fingerprint Signals
                    </p>
                    <ul className="space-y-2">
                      {result.content_credentials.ai_tool_fingerprint.signals.map((sig, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                          <span className="text-amber-500 mt-0.5 shrink-0">→</span>
                          {sig}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Visual Forensics */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Eye size={18} className="text-purple-500" /> Visual Forensics Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Facial Anomalies', val: result.visual_forensics.facial_anomalies },
                { label: 'Hand Distortion', val: result.visual_forensics.hand_distortion },
                { label: 'Shadow Inconsistency', val: result.visual_forensics.shadow_inconsistency },
                { label: 'Lighting Errors', val: result.visual_forensics.lighting_errors },
                { label: 'Texture Irregularities', val: result.visual_forensics.texture_irregularities },
                { label: 'Background Text Errors', val: result.visual_forensics.background_text_errors },
              ].map(({ label, val }) => (
                <div key={label} className={`p-3 rounded-xl border flex items-center gap-3 ${val ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                  {val ? <XCircle size={18} className="text-red-500 shrink-0" /> : <CheckCircle2 size={18} className="text-green-500 shrink-0" />}
                  <span className={`text-xs font-semibold ${val ? 'text-red-700' : 'text-green-700'}`}>{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">Physics Violation Probability</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-slate-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${result.visual_forensics.physics_violation_score > 50 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${result.visual_forensics.physics_violation_score}%` }}></div>
                </div>
                <span className={`text-sm font-bold ${result.visual_forensics.physics_violation_score > 50 ? 'text-red-600' : 'text-green-600'}`}>
                  {result.visual_forensics.physics_violation_score}%
                </span>
              </div>
            </div>
          </div>

          {/* Video Analysis */}
          {result.media_type === 'video' && result.video_analysis && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Film size={18} className="text-rose-500" /> Temporal Video Analysis
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Frame Consistency', val: result.video_analysis.frame_consistency_score },
                  { label: 'Motion Naturalness', val: result.video_analysis.motion_naturalness },
                  { label: 'Lip Sync Accuracy', val: result.video_analysis.lip_sync_accuracy },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className={`text-2xl font-black ${val > 70 ? 'text-green-600' : val > 40 ? 'text-yellow-600' : 'text-red-600'}`}>{val}%</p>
                  </div>
                ))}
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Scene Transitions</p>
                  <p className={`text-sm font-black mt-2 ${result.video_analysis.scene_transition_anomalies ? 'text-red-600' : 'text-green-600'}`}>
                    {result.video_analysis.scene_transition_anomalies ? '⚠ Anomalous' : '✓ Natural'}
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Detection Layers */}
          {result.detection_layers && (
            <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-sm p-6">
              <h3 className="text-base font-bold text-white mb-5 pb-3 border-b border-slate-700 flex items-center gap-2">
                <Layers size={18} className="text-indigo-400" /> Detection Pipeline Breakdown
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Layer 1 — Pixel Variance Analysis', val: result.detection_layers.huggingface_ml, color: 'text-purple-400' },
                  { label: 'Layer 2 — EXIF Binary Scan', val: result.detection_layers.exif_scan, color: 'text-blue-400' },
                  { label: 'Layer 3 — Visual Fingerprint', val: result.detection_layers.visual_fingerprint, color: 'text-amber-400' },
                  { label: 'Layer 4 — Filename Heuristic', val: result.detection_layers.filename_heuristic, color: 'text-green-400' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-slate-800 last:border-0">
                    <span className="text-xs font-mono text-slate-400 shrink-0">{label}</span>
                    <span className={`text-xs font-mono font-bold text-right ${color}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
