import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function History() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/assessments?page=${page}&limit=10`);
      setData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [page]);

  const del = async (id: string) => {
    if (!confirm('Delete assessment?')) return;
    await api.delete(`/assessments/${id}`);
    load();
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (!data) return <div className="text-center p-10">Login required or no data.</div>;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-[#667eea] mb-4">Assessment History</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#f8f9ff] text-[#667eea]">
            <tr><th className="p-3 text-left">Date</th><th className="p-3">Score</th><th className="p-3">Status</th><th className="p-3">Institution</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {data.items?.map((a: any) => (
              <tr key={a.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="p-3 text-center font-bold">{a.weightedScore}</td>
                <td className="p-3 text-center"><span className="px-3 py-1 rounded-full bg-[#667eea] text-white text-xs">{a.status}</span></td>
                <td className="p-3">{a.institution?.name || '-'}</td>
                <td className="p-3 text-center"><button onClick={() => del(a.id)} className="text-red-600 text-xs border px-2 py-1 rounded hover:bg-red-50">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data.items || data.items.length === 0) && <p className="text-center p-6 text-gray-400">No assessments yet. Create one on the Assessment tab.</p>}
      </div>
      <div className="flex justify-between mt-4">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50">Prev</button>
        <span className="text-sm">Page {data.page} / {data.totalPages} — Total {data.total}</span>
        <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
