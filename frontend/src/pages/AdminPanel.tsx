import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useTilt } from '../lib/hooks3d';

export default function AdminPanel() {
  const [tab, setTab] = useState<'users' | 'institutions'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [insts, setInsts] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ t: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({ name: '', type: '', country: '' });
  const [denied, setDenied] = useState(false);
  const tilt = useTilt(5);

  const load = useCallback(async () => {
    try {
      const u = await api.get('/users');
      setUsers(u.data.data || []);
    } catch (e: any) {
      if (e.response?.status === 403) setDenied(true);
    }
    try {
      const i = await api.get('/institutions');
      setInsts(i.data.data || []);
    } catch {
      setInsts([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: string, body: any, label: string) => {
    try {
      await api.patch(`/users/${id}`, body);
      setNotice({ t: `${label} updated`, ok: true });
      load();
    } catch {
      setNotice({ t: 'Update rejected by server policy', ok: false });
    }
  };

  const addInst = async () => {
    if (form.name.trim().length < 2) return;
    try {
      await api.post('/institutions', form);
      setNotice({ t: `Institution "${form.name}" created`, ok: true });
      setForm({ name: '', type: '', country: '' });
      load();
    } catch {
      setNotice({ t: 'Requires ADMIN or REVIEWER role', ok: false });
    }
  };

  if (denied) {
    return (
      <div className="card-3d grid place-items-center py-20 text-center">
        <span className="text-5xl opacity-40">🛑</span>
        <p className="mt-4 text-sm text-slate-300">Administrator role required</p>
        <p className="mt-1 text-[11px] text-slate-500">Sign in as admin@iars.local to manage users</p>
      </div>
    );
  }

  const input =
    'px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-[#667eea] transition';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span>🛡️</span> Administration
          </h1>
          <p className="text-[11px] text-slate-500 mt-1">Role-gated · every action is written to the audit log</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-white/5 border border-white/10 p-1 text-[11px]">
          {(['users', 'institutions'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-lg font-bold transition"
              style={{
                background: tab === t ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : 'transparent',
                color: tab === t ? '#fff' : '#64748b',
              }}
            >
              {t} {t === 'users' ? `(${users.length})` : `(${insts.length})`}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <p
          className="text-xs px-4 py-2.5 rounded-xl border"
          style={{
            borderColor: notice.ok ? '#22c55e55' : '#ef444455',
            background: notice.ok ? '#22c55e12' : '#ef444412',
            color: notice.ok ? '#86efac' : '#fca5a5',
          }}
        >
          {notice.t}
        </p>
      )}

      {tab === 'users' ? (
        <div className="space-y-3">
          {users.map((u, i) => (
            <div
              key={u.id}
              className="card-3d t3d rise relative p-4 flex flex-wrap items-center gap-4"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="t3d-edge" />
              <div
                className="w-11 h-11 rounded-xl grid place-items-center font-black text-sm shrink-0"
                style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}
              >
                {(u.name || u.email).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-[160px] flex-1">
                <p className="text-sm font-bold text-white">{u.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
              </div>
              <div className="text-[11px] text-slate-500 hidden sm:block">
                joined {new Date(u.createdAt).toLocaleDateString()}
              </div>
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide"
                style={{
                  background: u.role === 'ADMIN' ? '#f59e0b22' : u.role === 'REVIEWER' ? '#14b8a622' : '#64748b22',
                  color: u.role === 'ADMIN' ? '#fbbf24' : u.role === 'REVIEWER' ? '#5eead4' : '#94a3b8',
                }}
              >
                {u.role}
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: u.isActive ? '#22c55e' : '#ef4444', boxShadow: `0 0 12px ${u.isActive ? '#22c55e' : '#ef4444'}` }}
                title={u.isActive ? 'active' : 'disabled'}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => patch(u.id, { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' }, 'Role')}
                  className="btn-3d btn-3d--ghost !py-1.5 !px-3 !rounded-lg !text-[10px] !shadow-[0_5px_0_rgba(255,255,255,.07)]"
                >
                  role
                </button>
                <button
                  onClick={() => patch(u.id, { isActive: !u.isActive }, 'Status')}
                  className="btn-3d btn-3d--ghost !py-1.5 !px-3 !rounded-lg !text-[10px] !shadow-[0_5px_0_rgba(255,255,255,.07)]"
                >
                  {u.isActive ? 'disable' : 'enable'}
                </button>
              </div>
            </div>
          ))}
          {!users.length && <div className="card-3d py-14 text-center text-sm text-slate-500">No users visible</div>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card-3d relative p-5">
            <div className="t3d-edge" />
            <h3 className="text-xs font-black uppercase tracking-[.18em] text-slate-400 mb-3">
              Register institution
            </h3>
            <div className="grid sm:grid-cols-4 gap-3">
              <input {...{ placeholder: 'Name', value: form.name }} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
              <input {...{ placeholder: 'Type', value: form.type }} onChange={(e) => setForm({ ...form, type: e.target.value })} className={input} />
              <input {...{ placeholder: 'Country', value: form.country }} onChange={(e) => setForm({ ...form, country: e.target.value })} className={input} />
              <button onClick={addInst} className="btn-3d !py-2.5 !rounded-xl !text-xs">
                Add
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insts.map((i, n) => (
              <div key={i.id} className="card-3d relative p-5 rise" style={{ animationDelay: `${n * 40}ms` }}>
                <div className="t3d-edge" />
                <p className="font-bold text-white text-sm">{i.name}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {[i.type, i.country].filter(Boolean).join(' · ') || 'Unspecified'}
                </p>
                <p className="mt-3 text-[11px] font-mono text-indigo-300">
                  {i._count?.users ?? 0} linked user{(i._count?.users ?? 0) === 1 ? '' : 's'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}