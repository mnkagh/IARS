import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Rv } from '../lib/reveal';

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
    } catch (e: unknown) {
      const d = (e as { response?: { data?: { error?: string; details?: { message?: string }[] } } }).response?.data;
      setErr(d?.error || d?.details?.[0]?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Rv className="max-w-[480px] mx-auto sheet p-8 md:p-10">
      <p className="metaa">matriculation</p>
      <h2 className="serif text-3xl text-navy mt-3">Join the institute.</h2>
      <p className="text-[13px] mt-2 text-inkbl">Password rules are enforced server-side before bcrypt cost 12.</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <input value={form.name} onChange={set('name')} placeholder="Full name" required className="field" aria-label="Full name" />
        <input value={form.email} onChange={set('email')} type="email" placeholder="Email address" required className="field" aria-label="Email address" />
        <input value={form.institutionName} onChange={set('institutionName')} placeholder="Institution (optional)" className="field" aria-label="Institution" />
        <input value={form.password} onChange={set('password')} type="password" placeholder="Password" required className="field" aria-label="Password" />
        <input value={form.confirmPassword} onChange={set('confirmPassword')} type="password" placeholder="Confirm password" required className="field" aria-label="Confirm password" />

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="metaa">Strength</span>
            <span className="font-mono text-[11px] text-[#75705f]">{strength}/5</span>
          </div>
          <div className="meter mb-3">
            <i style={{ width: `${(strength / 5) * 100}%` }} className={strength === 5 ? 'sage' : ''} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {RULES.map(([label, ok]) => (
              <span key={label} className="font-mono text-[10px] flex items-center gap-2" style={{ color: ok(form.password) ? '#1e2c46' : '#a39c88' }}>
                <span className={ok(form.password) ? 'tick' : 'tick-hollow'} style={ok(form.password) ? undefined : { borderColor: '#a39c88' }} />
                {label}
              </span>
            ))}
          </div>
          {form.confirmPassword && !match && (
            <p className="mt-2 font-mono text-[10px] text-wine">Passwords do not match</p>
          )}
        </div>

        {err && (
          <p className="font-mono text-[11px] px-4 py-3" style={{ border: '1px solid rgba(125,59,71,.5)', color: '#7d3b47' }} role="alert">
            {err}
          </p>
        )}

        <button type="submit" className="btn btn-navy w-full" disabled={!canSubmit || busy}>
          {busy ? 'Enrolling…' : 'Create account'} <span className="arr">→</span>
        </button>
      </form>

      <p className="text-[12px] mt-6 text-center text-inkbl">
        Already matriculated?{' '}
        <Link to="/login" className="underline underline-offset-4 text-navy">
          Sign in
        </Link>
      </p>
    </Rv>
  );
}
