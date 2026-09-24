import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', institutionName: '' });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setOk('');
    try {
      await register(form);
      setOk('Registered successfully. Please login.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (e: any) { setErr(e.response?.data?.error || e.response?.data?.details?.[0]?.message || 'Registration failed'); }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-xl">
      <h2 className="text-2xl font-bold text-[#667eea] mb-2">Create account</h2>
      <form onSubmit={submit} className="space-y-3">
        <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-3 rounded-lg border" />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-4 py-3 rounded-lg border" />
        <input placeholder="Institution (optional)" value={form.institutionName} onChange={(e) => setForm({ ...form, institutionName: e.target.value })} className="w-full px-4 py-3 rounded-lg border" />
        <input placeholder="Password (8+ chars, upper/lower/number/special)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="w-full px-4 py-3 rounded-lg border" />
        <input placeholder="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required className="w-full px-4 py-3 rounded-lg border" />
        {err && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{err}</p>}
        {ok && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{ok}</p>}
        <Button type="submit" className="w-full">Register</Button>
      </form>
      <p className="text-sm text-center mt-3"><Link to="/login" className="text-[#667eea]">Back to login</Link></p>
    </div>
  );
}
