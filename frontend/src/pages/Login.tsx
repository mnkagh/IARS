import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Rv } from '../lib/reveal';

const FROM_NAMES: Record<string, string> = {
  '/compare': 'the comparative shelf',
  '/dashboard': 'the commonplace book',
  '/history': 'the archive',
  '/admin': 'the registrar',
};

export default function Login() {
  const [email, setEmail] = useState('demo@iars.local');
  const [password, setPassword] = useState('Demo@12345');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from;
  const dest = from && from !== '/login' ? from : '/';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(email, password);
      navigate(dest);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error;
      setErr(msg || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Rv className="max-w-[440px] mx-auto sheet p-8 md:p-10">
      <p className="metaa">reader’s ticket</p>
      <h2 className="serif text-3xl text-navy mt-3">Welcome back.</h2>
      <p className="text-[13px] mt-2 text-inkbl">Sign in to file readings and open the analysis rooms.</p>

      {from && from !== '/login' && (
        <p className="font-mono text-[11px] px-4 py-3 mt-5" style={{ border: '1px solid var(--line)', color: '#3d5a80' }} role="note">
          ◆ {FROM_NAMES[from] ?? 'that room'} requires a reader’s ticket — sign in to continue.
        </p>
      )}

      <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block">
          <span className="metaa block mb-2">Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" autoComplete="email" />
        </label>
        <label className="block">
          <span className="metaa block mb-2">Password</span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="field" autoComplete="current-password" />
        </label>

        {err && (
          <p className="font-mono text-[11px] px-4 py-3" style={{ border: '1px solid rgba(125,59,71,.5)', color: '#7d3b47' }} role="alert">
            {err}
          </p>
        )}

        <button type="submit" className="btn btn-navy w-full" disabled={busy}>
          {busy ? 'Verifying…' : 'Sign in'} <span className="arr">→</span>
        </button>
      </form>

      <p className="text-[12px] mt-6 text-center text-inkbl">
        No ticket?{' '}
        <Link to="/register" className="underline underline-offset-4 text-navy">
          Join the institute
        </Link>
      </p>

      <div className="mt-8 pt-5 font-mono text-[10px] leading-loose rule text-[#75705f]">
        <p>DEMO — DEMO@IARS.LOCAL / DEMO@12345</p>
        <p>ADMIN — ADMIN@IARS.LOCAL / ADMIN@12345</p>
      </div>
    </Rv>
  );
}
