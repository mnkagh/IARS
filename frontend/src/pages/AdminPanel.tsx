import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Rv } from '../lib/reveal';

export default function AdminPanel() {
  const [tab, setTab] = useState<'users' | 'institutions'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [insts, setInsts] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ t: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({ name: '', type: '', country: '' });
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    try {
      const u = await api.get('/users');
      setUsers(u.data.data || []);
    } catch (e: unknown) {
      if ((e as { response?: { status?: number } }).response?.status === 403) setDenied(true);
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

  const patch = async (id: string, body: object, label: string) => {
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
      <Rv className="sheet-flat py-20 text-center">
        <p className="metaa" style={{ color: '#7d3b47' }}>403 — restricted</p>
        <p className="serif text-3xl text-navy mt-3">The registrar requires an administrator.</p>
        <p className="metaa mt-3">sign in as admin@iars.local to proceed</p>
      </Rv>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <p className="metaa">role-gated — every action is entered in the audit ledger</p>
        <div className="tabs" role="tablist" aria-label="Admin sections">
          {(['users', 'institutions'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t} ({t === 'users' ? users.length : insts.length})
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <p
          className="font-mono text-[11px] px-4 py-3 mb-6"
          style={{
            border: '1px solid',
            borderColor: notice.ok ? 'var(--line)' : 'rgba(125,59,71,.5)',
            color: notice.ok ? '#2c3542' : '#7d3b47',
            background: notice.ok ? '#fdfaf1' : 'transparent',
          }}
          role="status"
        >
          {notice.t}
        </p>
      )}

      {tab === 'users' ? (
        <Rv className="sheet-flat">
          {users.map((u) => (
            <div
              key={u.id}
              className="arch-row flex flex-wrap items-center gap-4 px-5 py-4 rule-soft"
            >
              <span
                className="w-10 h-10 grid place-items-center font-mono text-[12px] shrink-0 text-navy"
                style={{ border: '1px solid var(--line)' }}
                aria-hidden="true"
              >
                {(u.name || u.email).slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-[160px] flex-1">
                <p className="text-sm text-navy">{u.name}</p>
                <p className="font-mono text-[11px] text-[#75705f]">{u.email}</p>
              </div>
              <span className="font-mono text-[10px] hidden sm:block text-[#a39c88]">
                {new Date(u.createdAt).toLocaleDateString()}
              </span>
              <span className="metaa" style={{ color: u.role === 'ADMIN' ? '#7d3b47' : '#75705f' }}>
                {u.role}
              </span>
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: u.isActive ? '#5c7350' : '#7d3b47' }}
                title={u.isActive ? 'active' : 'disabled'}
              />
              <div className="flex gap-4">
                <button
                  onClick={() => patch(u.id, { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' }, 'Role')}
                  className="metaa hover:text-navy transition-colors"
                >
                  role
                </button>
                <button
                  onClick={() => patch(u.id, { isActive: !u.isActive }, 'Status')}
                  className="metaa hover:text-navy transition-colors"
                >
                  {u.isActive ? 'disable' : 'enable'}
                </button>
              </div>
            </div>
          ))}
          {!users.length && <p className="py-14 text-center metaa">No readers on record</p>}
        </Rv>
      ) : (
        <div className="space-y-5">
          <Rv className="sheet-flat p-6">
            <p className="metaa">register institution</p>
            <div className="grid sm:grid-cols-4 gap-3 mt-4">
              <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" aria-label="Institution name" />
              <input placeholder="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="field" aria-label="Institution type" />
              <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="field" aria-label="Country" />
              <button onClick={addInst} className="btn btn-navy">
                Add
              </button>
            </div>
          </Rv>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {insts.map((i, n) => (
              <Rv key={i.id} delay={Math.min(n, 5) * 50} className="sheet-flat p-6">
                <p className="serif text-[17px] text-navy">{i.name}</p>
                <p className="text-[12px] mt-1 text-inkbl">
                  {[i.type, i.country].filter(Boolean).join(' · ') || 'Unspecified'}
                </p>
                <p className="mt-4 pt-4 font-mono text-[11px] rule text-[#75705f]">
                  {i._count?.users ?? 0} linked reader{(i._count?.users ?? 0) === 1 ? '' : 's'}
                </p>
              </Rv>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
