import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useTilt } from '../lib/hooks3d';

export default function Login() {
  const [email, setEmail] = useState('demo@iars.local');
  const [password, setPassword] = useState('Demo@12345');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const tilt = useTilt<HTMLFormElement>(9);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  const field =
    'w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/30 transition';

  return (
    <div className="grid place-items-center py-8">
      <div className="scene-3d w-full max-w-[420px]">
        <form
          onSubmit={submit}
          ref={tilt.ref}
          onPointerMove={tilt.onPointerMove}
          onPointerLeave={tilt.onPointerLeave}
          className="card-3d t3d t3d--lift relative p-8"
        >
          <div className="t3d-edge" />
          <div className="t3d-glare" />

          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto grid place-items-center rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] text-2xl shadow-lg shadow-[#667eea]/30 float">
              🔐
            </div>
            <h1 className="mt-4 text-2xl font-black text-white">Welcome back</h1>
            <p className="text-xs text-slate-400 mt-1">Sign in to save assessments and view analytics</p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${field} mt-1.5`}
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${field} mt-1.5`}
                autoComplete="current-password"
              />
            </label>
          </div>

          {err && (
            <p className="mt-4 text-xs text-red-300 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-2.5">
              {err}
            </p>
          )}

          <button type="submit" className="btn-3d w-full mt-6" disabled={busy}>
            {busy ? '⏳ Verifying…' : '→ Sign in'}
          </button>

          <p className="mt-5 text-center text-xs text-slate-400">
            No account?{' '}
            <Link to="/register" className="text-[#a5b4fc] font-bold hover:text-[#c7d2fe]">
              Create one
            </Link>
          </p>

          <div className="mt-6 rounded-xl bg-black/30 border border-white/5 p-4 font-mono text-[10px] text-slate-500 space-y-1">
            <p><span className="text-slate-400">demo</span> · demo@iars.local / Demo@12345</p>
            <p><span className="text-slate-400">admin</span> · admin@iars.local / Admin@12345</p>
          </div>
        </form>
      </div>
    </div>
  );
}