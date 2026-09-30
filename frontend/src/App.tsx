import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { useTilt } from './lib/hooks3d';
import { ParticleField } from './components/three/ParticleField';
import { CubeScene } from './components/three/CubeScene';
import Assessment from './pages/Assessment';
import Login from './pages/Login';
import Register from './pages/Register';
import History from './pages/History';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Comparison from './pages/Comparison';

function Spinner() {
  return (
    <div className="grid place-items-center min-h-[50vh]">
      <div
        className="w-14 h-14 rounded-full border-4 border-[#667eea] border-t-transparent spin-slow"
        style={{ boxShadow: '0 0 30px rgba(102,126,234,.4)' }}
      />
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore();
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const NAV = [
  { to: '/', label: 'Assess' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/history', label: 'History' },
  { to: '/compare', label: 'Compare' },
];

function Nav() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const loc = useLocation();
  const tilt = useTilt(6);

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="w-9 h-9 grid place-items-center rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] text-lg shadow-lg shadow-[#667eea]/30 transition group-hover:scale-110">
            🎯
          </span>
          <span className="leading-none">
            <span className="block font-black text-white tracking-tight">IARS</span>
            <span className="block text-[9px] text-slate-500 font-mono tracking-widest">READINESS SCALE</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 text-[13px]">
          {NAV.map((n) => {
            const on = loc.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className="px-3.5 py-2 rounded-xl transition font-medium relative"
                style={{
                  background: on ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'transparent',
                  color: on ? '#fff' : '#94a3b8',
                  boxShadow: on ? '0 6px 18px -6px rgba(102,126,234,.8)' : 'none',
                }}
              >
                {n.label}
              </Link>
            );
          })}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="px-3.5 py-2 rounded-xl transition font-medium"
              style={{
                background: loc.pathname === '/admin' ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : 'transparent',
                color: loc.pathname === '/admin' ? '#fff' : '#fbbf24',
              }}
            >
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden sm:block text-[11px] text-slate-400 max-w-[150px] truncate">{user?.email}</span>
              <button
                className="btn-3d btn-3d--danger !py-2 !px-4 !rounded-xl !text-xs"
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-3d !py-2 !px-4 !rounded-xl !text-xs !shadow-[0_6px_0_#3b2a6b]">
                Sign in
              </Link>
              <Link to="/register" className="btn-3d btn-3d--ghost !py-2 !px-4 !rounded-xl !text-xs !shadow-[0_6px_0_rgba(255,255,255,.07)]">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header className="relative max-w-7xl mx-auto px-5 pt-10 pb-4 grid md:grid-cols-[1fr_auto] gap-8 items-center">
      <div>
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-indigo-300 bg-indigo-500/10 border border-indigo-400/25 rounded-full px-3 py-1.5">
          ● SDG 4 · Quality Education
        </span>
        <h1 className="mt-4 text-4xl md:text-5xl font-black leading-[1.05] text-white">
          Institutional AI
          <br />
          <span className="bg-gradient-to-r from-[#a5b4fc] via-[#818cf8] to-[#c084fc] bg-clip-text text-transparent">
            Readiness Scale
          </span>
        </h1>
        <p className="mt-4 text-sm text-slate-400 max-w-xl leading-relaxed">
          A weighted machine-learning instrument measuring eight structural dimensions of AI
          adoption — producing a single defensible readiness score, ranked capability gaps and a
          prioritised action plan.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-mono">
          {['Helmet CSP', 'JWT httpOnly', 'Zod validation', 'Rate limiting', 'RBAC', 'Prisma ORM', 'Audit log'].map((t) => (
            <span key={t} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-400">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="hidden md:block pr-6">
        <CubeScene size={148} />
      </div>
    </header>
  );
}

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const loc = useLocation();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loc.pathname]);

  return (
    <BrowserRouter>
      <ParticleField />
      <div className="grid-bg" />
      <div className="relative z-10 min-h-screen flex flex-col">
        <Nav />
        <Hero />
        <main className="flex-1 max-w-7xl w-full mx-auto px-5 pb-16">
          <Routes>
            <Route path="/" element={<Assessment />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/history" element={<Protected><History /></Protected>} />
            <Route path="/compare" element={<Protected><Comparison /></Protected>} />
            <Route path="/admin" element={<Protected><AdminPanel /></Protected>} />
          </Routes>
        </main>
        <footer className="border-t border-white/10 py-6 text-center text-[11px] text-slate-600">
          IARS · secure reference implementation · PostgreSQL / MongoDB · MIT
        </footer>
      </div>
    </BrowserRouter>
  );
}