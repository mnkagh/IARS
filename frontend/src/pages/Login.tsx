import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('demo@iars.local');
  const [password, setPassword] = useState('Demo@12345');
  const [err, setErr] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      await login(email, password);
      navigate('/');
    } catch (e: any) { setErr(e.response?.data?.error || 'Login failed'); }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-xl">
      <h2 className="text-2xl font-bold text-[#667eea] mb-2">Welcome back</h2>
      <p className="text-sm text-gray-500 mb-6">Login to save assessments & view history</p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full mt-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#667eea]" />
        </div>
        <div>
          <label className="text-sm font-semibold">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full mt-1 px-4 py-3 rounded-lg border" />
        </div>
        {err && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{err}</p>}
        <Button type="submit" className="w-full">Login</Button>
      </form>
      <p className="text-sm text-center mt-4">No account? <Link to="/register" className="text-[#667eea] font-semibold">Register</Link></p>
      <div className="mt-4 p-3 bg-[#f8f9ff] rounded text-xs">
        <b>Demo:</b> demo@iars.local / Demo@12345<br /><b>Admin:</b> admin@iars.local / Admin@12345
      </div>
    </div>
  );
}
