import { useState } from 'react';
import api from '../services/api';
import { Image as ImageIcon, UploadCloud, Loader2, AlertTriangle, ShieldCheck, Video, RefreshCw } from 'lucide-react';

export default function MediaAnalysis() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError('');
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image or video file.');
      return;
    }

    const formData = new FormData();
    formData.append('media', file);

    try {
      setError('');
      setLoading(true);
      const res = await api.post('/media/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data.media_authenticity);
    } catch (err) {
      setError(err.response?.data?.message || 'Media analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4 mb-10">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Media Authenticity Engine</h2>
        <p className="text-slate-500 max-w-xl mx-auto">
          Detect AI-generated and modified media using C2PA credentials, SynthID watermark detection, and visual forensic models.
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

            <div 
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                file ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 hover:border-emerald-400 bg-slate-50'
              }`}
            >
              <input
                type="file"
                id="media-upload"
                accept="image/*,video/mp4,video/quicktime"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="media-upload" className="cursor-pointer flex flex-col items-center">
                {file ? (
                  <>
                    {file.type.startsWith('video') ? <Video size={48} className="text-emerald-500 mb-4" /> : <ImageIcon size={48} className="text-emerald-500 mb-4" />}
                    <p className="text-emerald-700 font-semibold text-lg">{file.name}</p>
                    <p className="text-emerald-600/70 text-sm mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <UploadCloud size={48} className="text-slate-400 mb-4" />
                    <p className="text-slate-700 font-semibold text-lg">Click to upload media</p>
                    <p className="text-slate-500 text-sm mt-1">Supports JPG, PNG, WEBP, MP4, MOV up to 50MB</p>
                  </>
                )}
              </label>
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={!file || loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-lg"
              >
                {loading && <Loader2 className="animate-spin w-6 h-6" />}
                {loading ? 'Running Forensics...' : 'Verify Authenticity'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                {result.media_type === 'video' ? <Video size={20} /> : <ImageIcon size={20} />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">Analysis complete</p>
              </div>
            </div>
            <button onClick={resetAnalysis} className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-2">
              <RefreshCw size={16} /> Analyze Another
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 w-full">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Final Verdict</h3>
              <div className="flex items-center gap-4 mb-4">
                <span className={`text-2xl font-bold px-4 py-2 rounded-xl ${
                  result.authenticity_verdict.final_label === 'Human' ? 'bg-green-100 text-green-700' :
                  result.authenticity_verdict.final_label === 'AI Assisted' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {result.authenticity_verdict.final_label}
                </span>
                <span className="text-slate-400 font-medium">{result.authenticity_verdict.confidence_score}% Confidence</span>
              </div>
              <p className="text-slate-600 border-l-4 border-slate-200 pl-4 italic">
                "{result.authenticity_verdict.explanation}"
              </p>
            </div>
            
            <div className="w-full md:w-64 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1 text-slate-600">
                  <span>AI Likelihood</span>
                  <span>{result.ai_likelihood_score.value}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${result.ai_likelihood_score.value > 60 ? 'bg-red-500' : result.ai_likelihood_score.value > 20 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                    style={{ width: `${result.ai_likelihood_score.value}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 pb-4 border-b border-slate-100 flex items-center gap-2">
                <ShieldCheck className="text-blue-500" /> Content Credentials (C2PA)
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-500">Metadata Present:</span>
                  <span className="font-semibold text-slate-800">{result.content_credentials.present ? 'Yes' : 'No'}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Creator/Camera:</span>
                  <span className="font-semibold text-slate-800">{result.content_credentials.creator}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Valid Signature:</span>
                  <span className={`font-semibold ${result.content_credentials.signature_valid ? 'text-green-600' : 'text-red-500'}`}>
                    {result.content_credentials.signature_valid ? 'Verified' : 'Invalid/Missing'}
                  </span>
                </li>
                {result.content_credentials.ai_tools_detected.length > 0 && (
                  <li className="flex justify-between">
                    <span className="text-slate-500">AI Tools:</span>
                    <span className="font-semibold text-red-600">{result.content_credentials.ai_tools_detected.join(', ')}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 pb-4 border-b border-slate-100 flex items-center gap-2">
                <ImageIcon className="text-purple-500" /> Visual Forensics
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between items-center">
                  <span className="text-slate-500">Facial/Hand Anomalies:</span>
                  {result.visual_forensics.facial_anomalies || result.visual_forensics.hand_distortion ? 
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-bold">Detected</span> : 
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold">None</span>
                  }
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-500">Lighting/Shadow Errors:</span>
                  {result.visual_forensics.shadow_inconsistency || result.visual_forensics.lighting_errors ? 
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-bold">Detected</span> : 
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold">None</span>
                  }
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-500">Physics Violations:</span>
                  <span className="font-semibold text-slate-800">{result.visual_forensics.physics_violation_score}% probability</span>
                </li>
              </ul>
            </div>
            
            {result.media_type === 'video' && result.video_analysis && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-4 border-b border-slate-100 flex items-center gap-2">
                  <Video className="text-rose-500" /> Temporal Video Analysis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl text-center">
                    <p className="text-xs text-slate-500 mb-1">Frame Consistency</p>
                    <p className="text-xl font-bold text-slate-800">{result.video_analysis.frame_consistency_score}%</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl text-center">
                    <p className="text-xs text-slate-500 mb-1">Motion Naturalness</p>
                    <p className="text-xl font-bold text-slate-800">{result.video_analysis.motion_naturalness}%</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl text-center">
                    <p className="text-xs text-slate-500 mb-1">Lip Sync</p>
                    <p className="text-xl font-bold text-slate-800">{result.video_analysis.lip_sync_accuracy}%</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl text-center">
                    <p className="text-xs text-slate-500 mb-1">Transitions</p>
                    <p className={`text-sm mt-1 font-bold ${result.video_analysis.scene_transition_anomalies ? 'text-red-600' : 'text-green-600'}`}>
                      {result.video_analysis.scene_transition_anomalies ? 'Anomalous' : 'Natural'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
