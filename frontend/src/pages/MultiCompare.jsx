import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Layers, FileText, Loader2, AlertTriangle, Plus, X } from 'lucide-react';

export default function MultiCompare() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState(['', '']); // Start with 2 empty slots
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get('/documents');
        setDocuments(res.data.documents);
      } catch (err) {
        console.error('Failed to load documents');
      }
    };
    fetchDocs();
  }, []);

  const handleDocChange = (index, value) => {
    const newSelected = [...selectedDocs];
    newSelected[index] = value;
    setSelectedDocs(newSelected);
  };

  const addDocSlot = () => {
    if (selectedDocs.length < 10) {
      setSelectedDocs([...selectedDocs, '']);
    }
  };

  const removeDocSlot = (index) => {
    if (selectedDocs.length > 2) {
      const newSelected = selectedDocs.filter((_, i) => i !== index);
      setSelectedDocs(newSelected);
    }
  };

  const handleCompare = async (e) => {
    e.preventDefault();
    const validDocs = selectedDocs.filter(id => id.trim() !== '');
    
    if (validDocs.length < 2) {
      setError('Please select at least two documents.');
      return;
    }
    const uniqueDocs = [...new Set(validDocs)];
    if (uniqueDocs.length !== validDocs.length) {
      setError('Cannot select the same document multiple times.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await api.post('/plagiarism/multi-check', { docIds: uniqueDocs });
      // Redirect to results page
      navigate(`/results/${res.data.reportId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4 mb-12">
        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Layers size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Multi-Document Comparison</h2>
        <p className="text-slate-500 max-w-xl mx-auto">
          Select between 2 and 10 documents for simultaneous clustering, similarity detection, and common insight extraction.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8 relative overflow-hidden">
        <form onSubmit={handleCompare} className="relative z-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 flex items-center gap-3 border border-red-100">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {selectedDocs.map((docId, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Document {index + 1}
                  </label>
                  <div className="relative">
                    <select 
                      value={docId} 
                      onChange={(e) => handleDocChange(index, e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm font-medium"
                    >
                      <option value="">-- Select Document --</option>
                      {documents.map(doc => (
                        <option key={doc.id} value={doc.id} disabled={selectedDocs.includes(String(doc.id)) && docId !== String(doc.id)}>
                          {doc.original_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedDocs.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeDocSlot(index)}
                    className="mt-5 p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                    title="Remove document"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {selectedDocs.length < 10 && (
            <button
              type="button"
              onClick={addDocSlot}
              className="mt-6 flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} /> Add another document
            </button>
          )}

          <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading || selectedDocs.filter(Boolean).length < 2}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {loading && <Loader2 className="animate-spin w-5 h-5" />}
              {loading ? 'Processing Cluster...' : 'Analyze Documents'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
