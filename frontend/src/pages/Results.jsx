import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Code2, 
  Network,
  ChevronRight,
  ArrowLeft,
  Users,
  Lightbulb,
  Fingerprint
} from 'lucide-react';

export default function Results() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/plagiarism/report/${id}`);
        setReport(res.data.report);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Loading algorithm results...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Report Not Found</h3>
        <p className="text-slate-500 mt-2 mb-6">The requested analysis report could not be located.</p>
        <Link to="/dashboard" className="text-blue-600 hover:underline font-medium">Return to Dashboard</Link>
      </div>
    );
  }

  const { algorithm_data, plagiarism_percent, doc1_name, doc2_name, execution_time_ms, recursive_calls, tree_depth, total_chunks, matched_chunks } = report;
  
  const isMultiDoc = algorithm_data.type === 'multi_document';
  const { complexity, comparisons, tree } = isMultiDoc ? {} : algorithm_data;
  const multiSummary = isMultiDoc ? algorithm_data.comparison_result : null;
  const insights = isMultiDoc ? algorithm_data.common_insights : null;

  const isHighRisk = plagiarism_percent > 40;
  const isMediumRisk = plagiarism_percent > 15 && !isHighRisk;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Analysis Results</h2>
          <p className="text-sm text-slate-500">Report #{id} • Generated {new Date(report.created_at).toLocaleString()}</p>
        </div>
      </div>

      {/* Main Score Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 w-full text-center md:text-left">
          {isMultiDoc ? (
            <div className="flex flex-col mb-4 items-center md:items-start">
              <div className="flex items-center gap-2 mb-2 text-purple-600">
                <Layers size={20} />
                <span className="font-bold">Multi-Document Analysis</span>
              </div>
              <p className="text-lg font-medium text-slate-700">
                Analyzed {algorithm_data.existing_attributes.total_documents} documents
              </p>
              <p className="text-slate-500 text-sm max-w-md mt-2">
                Clustering strategy: Anchor-based with TF-IDF and MinHash. 
                Performed {multiSummary.comparisons_performed} pairwise checks.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row items-center gap-3 text-lg font-medium text-slate-700 mb-4 justify-center md:justify-start">
                <span className="truncate max-w-[200px] bg-slate-100 px-3 py-1 rounded-lg" title={doc1_name}>{doc1_name}</span>
                <span className="text-slate-400">vs</span>
                <span className="truncate max-w-[200px] bg-slate-100 px-3 py-1 rounded-lg" title={doc2_name}>{doc2_name}</span>
              </div>
              <p className="text-slate-500 text-sm max-w-md">
                The Divide and Conquer algorithm split the documents into chunks, compared them at the leaves, and merged the similarities up the recursion tree.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 flex items-center justify-center mb-2">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="56" fill="none" stroke="#e2e8f0" strokeWidth="12" />
              <circle 
                cx="64" cy="64" r="56" fill="none" 
                stroke={isHighRisk ? '#ef4444' : isMediumRisk ? '#f59e0b' : '#10b981'} 
                strokeWidth="12" 
                strokeDasharray={`${2 * Math.PI * 56}`} 
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - plagiarism_percent / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-800">{plagiarism_percent.toFixed(1)}%</span>
            </div>
          </div>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
            isHighRisk ? 'bg-red-100 text-red-700' : 
            isMediumRisk ? 'bg-yellow-100 text-yellow-700' : 
            'bg-green-100 text-green-700'
          }`}>
            {isMultiDoc 
              ? (isHighRisk ? 'High Global Overlap' : isMediumRisk ? 'Moderate Overlap' : 'Low Overlap') 
              : (isHighRisk ? 'High Plagiarism' : isMediumRisk ? 'Moderate Similarity' : 'Original Content')}
          </span>
        </div>
      </div>

      {isMultiDoc ? (
        <>
          {/* Smart Similarity Highlight Engine (Upgrade 2) */}
          <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10"></div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-amber-100">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Lightbulb size={20} /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Common Insights & Similarities</h3>
                <p className="text-xs text-slate-500">Cross-document extracted patterns and semantic overlaps</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Exact Matches */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-emerald-500" /> Exact Phrase Matches
                </h4>
                {insights.exact_matches.length > 0 ? (
                  <ul className="space-y-3">
                    {insights.exact_matches.slice(0, 5).map((match, idx) => (
                      <li key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                        <p className="font-mono text-slate-800 mb-2">"{match.text}"</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Found in {match.present_in_docs.length} docs</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold ${match.coverage === 100 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {match.coverage === 100 ? 'All Docs' : `${match.coverage}% Coverage`}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">No significant exact phrase overlaps found.</p>
                )}
              </div>

              {/* Semantic Matches */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Network className="w-4 h-4 text-purple-500" /> Semantic / Topic Overlaps
                </h4>
                {insights.semantic_matches.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {insights.semantic_matches.map((match, idx) => (
                      <div key={idx} className="px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg flex flex-col gap-1 text-sm group cursor-pointer hover:bg-purple-100 transition-colors">
                        <span className="font-bold text-purple-900">{match.text}</span>
                        <span className="text-xs text-purple-600">Sim: {match.similarity_score}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No significant semantic similarities found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Cluster Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
              <h3 className="text-lg font-bold text-slate-800">Document Clusters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {multiSummary.cluster_summary.map((cluster, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <h4 className="font-semibold text-slate-700 capitalize mb-1">{cluster.cluster.replace('_', ' ')}</h4>
                  <p className="text-xs text-slate-500 mb-3">Threshold: {cluster.threshold_used}</p>
                  <p className="text-2xl font-bold text-slate-800">{cluster.members.length} <span className="text-sm font-normal text-slate-500">docs</span></p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Complexity Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Execution Metrics */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800">Execution Metrics</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-1">Execution Time</p>
                  <p className="text-xl font-bold text-slate-800">{execution_time_ms.toFixed(2)} <span className="text-sm font-normal text-slate-500">ms</span></p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-1">Recursive Calls</p>
                  <p className="text-xl font-bold text-slate-800">{recursive_calls}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-1">Tree Depth</p>
                  <p className="text-xl font-bold text-slate-800">{tree_depth}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-1">Chunks Compared</p>
                  <p className="text-xl font-bold text-slate-800">{total_chunks}</p>
                </div>
              </div>
            </div>

            {/* Complexity Analysis */}
            <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 text-slate-300">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700 text-white">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><Code2 size={20} /></div>
                <h3 className="text-lg font-bold">Complexity Analysis</h3>
              </div>
              
              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Recurrence</span>
                  <span className="text-green-400">{complexity.recurrenceRelation}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Master Theorem</span>
                  <span className="text-blue-400">{complexity.masterTheoremCase}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Time (Average)</span>
                  <span className="text-yellow-400">{complexity.averageCase.notation}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-slate-500">Space (Total)</span>
                  <span className="text-purple-400">{complexity.spaceComplexity.total}</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-slate-800 rounded-lg text-xs leading-relaxed border border-slate-700">
                <span className="text-white font-semibold block mb-1">Analysis:</span>
                {complexity.averageCase.description}. Space complexity bounded by recursion stack {complexity.spaceComplexity.recursionStack} and chunks storage.
              </div>
            </div>
          </div>

          {/* Conquer Phase: Chunk Comparisons */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Layers size={20} /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Conquer Phase (Base Cases)</h3>
                <p className="text-xs text-slate-500">Showing first {comparisons.length} chunk comparisons at leaf nodes.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Depth</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Similarity</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider w-2/5">Doc 1 Chunk (Sample)</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider w-2/5">Doc 2 Chunk (Sample)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisons.map((comp, idx) => (
                    <tr key={idx} className={`hover:bg-slate-50 ${comp.isMatch ? 'bg-red-50/30' : ''}`}>
                      <td className="py-3 px-4 text-sm text-slate-500">Lvl {comp.depth}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          comp.similarity > 0.5 ? 'bg-red-100 text-red-700' :
                          comp.similarity > 0.2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {(comp.similarity * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600 truncate max-w-xs" title={comp.sampleA}>
                        {comp.sampleA}...
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600 truncate max-w-xs" title={comp.sampleB}>
                        {comp.sampleB}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
