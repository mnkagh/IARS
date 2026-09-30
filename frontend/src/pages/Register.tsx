import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useTilt } from '../lib/hooks3d';

function scoreStrength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[a-z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

const RULES: [string, (p: string) => boolean][] = [
  ['8+ characters', (p) => p.length >= 8],
  ['Uppercase', (p) => /[A-Z]/.test(p)],
  ['Lowercase', (p) => /[a-z]/.test(p)],
  ['Number', (p) => /[0-9]/.test(p)],
  ['Symbol', (p) => /[^A-Za-z0-9]/.test(p)],
];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', institutionName: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const tilt = useTilt<HTMLFormElement>(8);

  const strength = useMemo(() => scoreStrength(form.password), [form.password]);
  const match = form.password === form.confirmPassword;
  const canSubmit = strength === 5 && match && form.name.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await register(form);
      navigate('/login');
    } catch (e: any) {
      const d = e.response?.data;
      setErr(d?.error || d?.details?.[0]?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  const field =
    'w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/30 transition';

  return (
    <div className="grid place-items-center py-8">
      <div className="scene-3d w-full max-w-[460px]">
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
            <div className="w-14 h-14 mx-auto grid place-items-center rounded-2xl bg-gradient-to-br from-[#764ba2] to-[#667eea] text-2xl shadow-lg shadow-[#764ba2]/30 float">
              ✍️
            </div>
            <h1 className="mt-4 text-2xl font-black text-white">Create your account</h1>
            <p className="text-xs text-slate-400 mt-1">Password rules are enforced server-side with bcrypt cost 12</p>
          </div>

          <div className="space-y-3">
            <input {...set('name')} placeholder="Full name" required className={field} />
            <input {...set('email')} type="email" placeholder="Email address" required className={field} />
            <input {...set('institutionName')} placeholder="Institution (optional)" className={field} />
            <input {...set('password')} type="password" placeholder="Password" required className={field} />
            <input {...set('confirmPassword')} type="password" placeholder="Confirm password" required className={field} />
          </div>

          <div className="mt-4 rounded-xl bg-black/25 border border-white/5 p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Strength</span>
              <span className="text-[10px] font-mono text-slate-400">{strength}/5</span>
            </div>
            <div className="bar3d mb-3">
              <i style={{ width: `${(strength / 5) * 100}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {RULES.map(([label, ok]) => (
                <span
                  key={label}
                  className="text-[10px] flex items-center gap-1.5"
                  style={{ color: ok(form.password) ? '#86efac' : '#64748b' }}
                >
                  <b>{ok(form.password) ? '✓' : '○'}</b> {label}
                </span>
              ))}
            </div>
            {form.confirmPassword && !match && (
              <p className="mt-2.5 text-[10px] text-red-300">Passwords do not match</p>
            )}
          </div>

          {err && (
            <p className="mt-4 text-xs text-red-300 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-2.5">
              {err}
            </p>
          )}

          <button type="submit" className="btn-3d w-full mt-6" disabled={!canSubmit || busy}>
            {busy ? '⏳ Creating…' : '→ Create account'}
          </button>

          <p className="mt-5 text-center text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="text-[#a5b4fc] font-bold hover:text-[#c7d2fe]">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}