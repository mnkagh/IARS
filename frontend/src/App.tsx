import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Assessment from './pages/Assessment';
import Login from './pages/Login';
import Register from './pages/Register';
import History from './pages/History';
import Dashboard from './pages/Dashboard';

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore();
  if (loading) return <div className="text-center p-10 text-white">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Nav() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const onLogout = async () => { await logout(); navigate('/login'); };
  return (
    <nav className="bg-white/95 backdrop-blur shadow sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="font-bold text-xl text-[#667eea]">🎯 IARS</Link>
        <div className="flex gap-4 items-center text-sm font-medium">
          <Link to="/" className="hover:text-[#667eea]">Assessment</Link>
          <Link to="/dashboard" className="hover:text-[#667eea]">Dashboard</Link>
          <Link to="/history" className="hover:text-[#667eea]">History</Link>
          {isAuthenticated ? (
            <>
              <span className="text-gray-500 hidden sm:inline">{user?.email} ({user?.role})</span>
              <button onClick={onLogout} className="px-4 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-1.5 bg-[#667eea] text-white rounded-lg">Login</Link>
              <Link to="/register" className="px-4 py-1.5 border border-[#667eea] text-[#667eea] rounded-lg">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  useEffect(() => { fetchMe(); }, [fetchMe]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex flex-col">
        <Nav />
        <header className="text-center text-white py-8">
          <h1 className="text-3xl font-bold">🎯 IARS</h1>
          <p className="opacity-90">Institutional AI Adoption Readiness Scale</p>
          <p className="text-sm opacity-70">Machine Learning-Based Assessment Tool • SDG 4 Aligned</p>
        </header>
        <main className="max-w-6xl mx-auto px-4 pb-10 w-full flex-1">
          <Routes>
            <Route path="/" element={<Assessment />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/history" element={<Protected><History /></Protected>} />
          </Routes>
        </main>
        <footer className="text-center text-white/80 py-4 text-sm">✨ IARS • Secure • PostgreSQL/MongoDB • Helmet, JWT httpOnly, Rate-limit, Zod validation</footer>
      </div>
    </BrowserRouter>
  );
}
