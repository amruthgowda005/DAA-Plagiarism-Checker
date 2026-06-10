import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  FileText, 
  Activity, 
  Percent, 
  Clock, 
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data.stats);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Generate chart data from recent reports
  const chartData = stats?.recentReports?.map((report, idx) => ({
    name: `Check ${stats.recentReports.length - idx}`,
    similarity: report.plagiarism_percent
  })).reverse() || [];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 transition-transform hover:scale-[1.02]">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Documents</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats?.totalDocuments || 0}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 transition-transform hover:scale-[1.02]">
          <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Plagiarism Checks</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats?.totalChecks || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 transition-transform hover:scale-[1.02]">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <Percent size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Avg. Similarity</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats?.averagePlagiarism || 0}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Recent Trend</h3>
              <p className="text-sm text-slate-500">Similarity percentage over recent checks</p>
            </div>
            <TrendingUp className="text-slate-400" />
          </div>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="similarity" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSim)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <AlertTriangle size={48} className="mb-4 text-slate-300" />
                <p>No checks performed yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Reports List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Recent Reports</h3>
            <Clock className="text-slate-400 w-5 h-5" />
          </div>
          
          <div className="space-y-4">
            {stats?.recentReports?.length > 0 ? (
              stats.recentReports.map(report => (
                <Link 
                  key={report.id} 
                  to={`/results/${report.id}`}
                  className="block p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 truncate pr-4">
                      <p className="text-sm font-semibold text-slate-800 truncate">{report.doc1_name}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">vs {report.doc2_name}</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      report.plagiarism_percent > 40 ? 'bg-red-100 text-red-700' :
                      report.plagiarism_percent > 15 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {report.plagiarism_percent.toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details <ArrowRight size={14} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center text-sm text-slate-500 py-8">
                No recent reports available.
              </div>
            )}
          </div>
          
          <Link 
            to="/compare" 
            className="mt-6 w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-slate-200"
          >
            Start New Check <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
