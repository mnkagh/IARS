import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    api.get('/assessments/stats').then((r) => setStats(r.data.data)).catch(() => setStats(null));
  }, []);
  if (!stats) return <div className="bg-white p-6 rounded-2xl shadow">Login to view dashboard. Your readiness trends and institution comparisons will appear here.</div>;
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow text-center"><div className="text-3xl font-bold text-[#667eea]">{stats.count}</div><div className="text-sm text-gray-500">Total Assessments</div></div>
        <div className="bg-white p-6 rounded-2xl shadow text-center"><div className="text-3xl font-bold text-[#764ba2]">{stats.avg._avg.weightedScore ? Math.round(stats.avg._avg.weightedScore) : '-'}</div><div className="text-sm text-gray-500">Avg Weighted Score</div></div>
        <div className="bg-white p-6 rounded-2xl shadow text-center"><div className="text-sm text-gray-600">{stats.byStatus.map((s: any) => `${s.status}: ${s._count.status}`).join(' | ') || 'No data'}</div><div className="text-sm text-gray-500">By Status</div></div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="font-bold text-[#667eea] mb-3">Recent Trend (last 6)</h3>
        <div className="flex items-end gap-2 h-32">
          {stats.recent?.map((r: any, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-gradient-to-t from-[#667eea] to-[#764ba2] rounded-t" style={{ height: `${r.weightedScore}%` }} title={`${r.weightedScore}`}></div>
              <span className="text-xs">{r.weightedScore}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
