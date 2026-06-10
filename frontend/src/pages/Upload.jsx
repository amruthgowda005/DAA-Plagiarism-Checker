import { useState, useEffect } from 'react';
import api from '../services/api';
import { UploadCloud, File, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus({ type: '', message: '' });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);

    try {
      setLoading(true);
      setStatus({ type: '', message: '' });
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus({ type: 'success', message: 'Document uploaded successfully!' });
      setFile(null);
      fetchDocuments();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Upload failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Upload Section */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Upload New Document</h3>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors relative">
              <input 
                type="file" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".txt,.pdf,.doc,.docx"
              />
              <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-700">
                {file ? file.name : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-slate-400 mt-2">Supported: PDF, DOCX, TXT (Max 10MB)</p>
            </div>

            {status.message && (
              <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {status.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin w-5 h-5" />}
              {loading ? 'Processing...' : 'Upload Document'}
            </button>
          </form>
        </div>
      </div>

      {/* Document Library */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[500px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
            Document Library
            <span className="bg-slate-100 text-slate-600 text-sm py-1 px-3 rounded-full font-medium">
              {documents.length} Files
            </span>
          </h3>

          {fetchLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
            </div>
          ) : documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map(doc => (
                <div key={doc.id} className="p-4 border border-slate-200 rounded-xl flex items-start gap-4 hover:border-blue-300 transition-colors bg-slate-50/50">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <File className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate" title={doc.original_name}>
                      {doc.original_name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{doc.word_count} words</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <File className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No documents uploaded yet.</p>
              <p className="text-sm text-slate-400 mt-1">Upload files to start checking for plagiarism.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
