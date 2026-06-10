import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FileSearch, ArrowRightLeft, FileText, Loader2, AlertTriangle } from 'lucide-react';

export default function Compare() {
  const [documents, setDocuments] = useState([]);
  const [doc1Id, setDoc1Id] = useState('');
  const [doc2Id, setDoc2Id] = useState('');
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

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!doc1Id || !doc2Id) {
      setError('Please select two documents to compare.');
      return;
    }
    if (doc1Id === doc2Id) {
      setError('Cannot compare a document with itself.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await api.post('/plagiarism/check', { doc1Id, doc2Id });
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
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileSearch size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Run Plagiarism Check</h2>
        <p className="text-slate-500 max-w-xl mx-auto">
          Select two documents from your library to analyze their similarity using the Divide and Conquer algorithm.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <form onSubmit={handleCompare} className="relative z-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 flex items-center gap-3 border border-red-100">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            {/* Document 1 Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" /> Source Document
              </label>
              <div className="relative">
                <select 
                  value={doc1Id} 
                  onChange={(e) => setDoc1Id(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                >
                  <option value="">-- Select Document --</option>
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.original_name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* VS Icon */}
            <div className="hidden md:flex flex-col items-center justify-center pt-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-white shadow-sm z-10">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
            </div>

            {/* Document 2 Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Target Document
              </label>
              <div className="relative">
                <select 
                  value={doc2Id} 
                  onChange={(e) => setDoc2Id(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                >
                  <option value="">-- Select Document --</option>
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.original_name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <button
              type="submit"
              disabled={loading || documents.length < 2}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-lg"
            >
              {loading && <Loader2 className="animate-spin w-6 h-6" />}
              {loading ? 'Analyzing Complexity...' : 'Start D&C Algorithm'}
            </button>
          </div>
          
          {documents.length < 2 && (
            <p className="text-center text-sm text-slate-500 mt-4">
              You need to upload at least two documents first.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
