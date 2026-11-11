import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { Rv } from './lib/reveal';
import { SectionHead, Seal, Folio } from './components/acad/ui';
import { ResearchTable, type DeskSource } from './components/acad/ResearchTable';
import { Library } from './components/acad/Library';
import { KnowledgeMapSection } from './components/acad/KnowledgeMap';
import { Timeline } from './components/acad/Timeline';
import Assessment from './pages/Assessment';
import Login from './pages/Login';
import Register from './pages/Register';
import History from './pages/History';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Comparison from './pages/Comparison';

/* ================= navigation ================= */

const NAV: [string, string][] = [
  ['#research', 'Research'],
  ['#explore', 'Explore'],
  ['#library', 'Library'],
  ['#workspace', 'Workspace'],
  ['#about', 'About'],
];

function useAnchor() {
  const navigate = useNavigate();
  const loc = useLocation();
  return (hash: string) => {
    if (loc.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 150);
    } else {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
    }
  };
}

function Masthead() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const go = useAnchor();
  const loc = useLocation();
  const home = loc.pathname === '/';

  return (
    <header className="sticky top-0 z-40" style={{ background: 'rgba(245,239,225,0.95)', backdropFilter: 'blur(8px)' }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between h-[72px]">
          <Link to="/" className="leading-none">
            <span className="serif block text-[26px] font-semibold text-navy tracking-tight">IARS</span>
            <span className="metaa block mt-1">institute for ai & research systems</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            {NAV.map(([hash, label]) => (
              <button key={hash} onClick={() => go(hash)} className="metaa hover:text-navy transition-colors" style={{ color: home ? undefined : '#a39c88' }}>
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            {isAuthenticated ? (
              <>
                <span className="metaa hidden lg:inline max-w-[150px] truncate">{user?.email}</span>
                <button className="metaa hover:text-navy transition-colors" onClick={() => logout()}>
                  Sign out
                </button>
              </>
            ) : (
              <button onClick={() => go('#workspace')} className="btn btn-navy !py-3">
                Enter IARS <span className="arr">→</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="rule" />
    </header>
  );
}

/* ================= home sections ================= */

function Hero({ onOpen }: { onOpen: (s: DeskSource) => void }) {
  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 pt-14 md:pt-20 pb-14">
      <div className="grid md:grid-cols-12 gap-10 items-start">
        <div className="md:col-span-6">
          <Rv>
            <p className="metaa">est. mmxxvi — a research environment</p>
          </Rv>
          <Rv delay={90}>
            <h1 className="serif font-medium text-navy leading-[1.04] tracking-tight mt-6" style={{ fontSize: 'clamp(44px, 6.4vw, 88px)' }}>
              Questions worth asking deserve <em>better tools.</em>
            </h1>
          </Rv>
          <Rv delay={160}>
            <p className="text-[15px] leading-relaxed mt-7 max-w-md text-inkbl">
              IARS is a research environment for exploring ideas, evidence, sources and
              connections — built for students and researchers who are still curious.
            </p>
          </Rv>
          <Rv delay={220}>
            <div className="flex flex-wrap gap-3 mt-8">
              <a href="#workspace" className="btn btn-navy">
                Open the workspace <span className="arr">→</span>
              </a>
              <a href="#library" className="btn btn-line">
                Browse the library
              </a>
            </div>
          </Rv>
          <Rv delay={260}>
            <p className="caption mt-8">fig. — the reading room · classification 001–999 · open stacks</p>
          </Rv>
        </div>
        <div className="md:col-span-6">
          <Rv delay={140}>
            <ResearchTable onOpen={onOpen} />
          </Rv>
        </div>
      </div>
    </section>
  );
}

function SourcePreview({ source, onClose }: { source: DeskSource | null; onClose: () => void }) {
  if (!source) return null;
  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 pb-14">
      <div className="sheet p-6 md:p-8 grid md:grid-cols-[auto_1fr_auto] gap-6 items-start" role="dialog" aria-label={`Source preview: ${source.title}`}>
        <Seal size={84} />
        <div>
          <p className="ref">{source.kind} — {source.ref}</p>
          <h3 className="serif text-2xl md:text-3xl text-navy mt-2">{source.title}</h3>
          <p className="text-[13.5px] leading-relaxed mt-3 max-w-2xl text-inkbl">{source.note}</p>
        </div>
        <div className="flex md:flex-col gap-3">
          <a href="#library" className="btn btn-line" onClick={onClose}>
            Find in library
          </a>
          <button className="btn btn-quiet" onClick={onClose}>
            Close ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function Institution() {
  return (
    <section id="research" className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24 scroll-mt-24">
      <div className="rule-double pt-10 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-7">
          <SectionHead
            no="01"
            label="why iars"
            title={<>We built IARS for people who are <em>still curious.</em></>}
            intro={
              <>
                <p>
                  Most research tools treat knowledge as <span className="hl-mustard px-1">content to be retrieved</span>.
                  We treat it as <span className="hl-sage px-1">material to be worked with</span> — questioned,
                  connected, annotated, and argued over, the way it happens in the best seminar rooms.
                </p>
                <p className="mt-4">
                  IARS began as an <span className="hl-blue px-1">institutional readiness instrument</span> and grew
                  into a reading room: a library, a wall of connected ideas, and a desk where evidence becomes
                  understanding. It is designed for undergraduates opening their first archive box and for
                  researchers defending their fiftieth claim.
                </p>
              </>
            }
          />
          <Rv delay={180}>
            <div className="flex items-center gap-6 mt-8">
              <Seal />
              <p className="caption max-w-[220px]">the institute seal — awarded to readings that survive the seminar</p>
            </div>
          </Rv>
        </div>
        <div className="md:col-span-5">
          <Rv delay={120}>
            <figure className="plate p-6 md:p-7">
              <p className="metaa">archival plate — the reading room</p>
              <div className="mt-4 sheet-flat p-5">
                <div className="flex justify-between items-baseline">
                  <span className="ref">CALL Nº 001.42</span>
                  <span className="caption">hall b · north light</span>
                </div>
                <div className="my-4" style={{ height: 150, background: 'repeating-linear-gradient(0deg, transparent 0 22px, rgba(30,44,70,.10) 22px 23px), linear-gradient(160deg, #ece2cb, #e0d4b8)' }} aria-hidden="true" />
                <div className="rule-soft pt-3 flex justify-between">
                  <span className="caption">shelves 001–999 · open stacks</span>
                  <Folio n="04" />
                </div>
              </div>
              <figcaption className="caption mt-4">plate i. — where the collection lives; no two visits alike</figcaption>
            </figure>
          </Rv>
        </div>
      </div>
    </section>
  );
}

function LibrarySection() {
  return (
    <section id="library" className="py-16 md:py-24 scroll-mt-24" style={{ background: '#efe7d2' }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <SectionHead
          no="02"
          label="the research library"
          title={<>An archive that reads <em>back.</em></>}
          intro="Catalogued like a university collection — every record carries its shelfmark, its subjects, and its year. Open anything; keep what matters in your reading list."
        />
        <div className="mt-10">
          <Library />
        </div>
      </div>
    </section>
  );
}

function MapSection() {
  return (
    <section id="explore" className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24 scroll-mt-24">
      <SectionHead
        no="03"
        label="knowledge map"
        title={<>Ideas rarely <em>exist alone.</em></>}
        intro="A wall of concepts, papers, researchers, topics and evidence. Select any node to read it and follow its relationships — the map dims everything else so you can think."
      />
      <div className="mt-10">
        <KnowledgeMapSection />
      </div>
    </section>
  );
}

function WorkspaceSection() {
  return (
    <section id="workspace" className="py-16 md:py-24 scroll-mt-24" style={{ background: '#e9dfc6' }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <SectionHead
          no="04"
          label="the workspace"
          title={<>Your desk at <em>the institute.</em></>}
          intro="Eight dimensions, one defensible reading. Calibrate the field notes, compute the analysis, file it to your archive — or export the folio for your supervisor."
        />
        <div className="mt-10">
          <Assessment />
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
      <SectionHead
        no="05"
        label="the research process"
        title={<>Five stations, <em>one thread.</em></>}
        intro="The way investigations actually unfold — from the first curious question to a perspective you can defend."
      />
      <Timeline />
    </section>
  );
}

function About() {
  return (
    <section id="about" className="py-16 md:py-24 scroll-mt-24" style={{ background: '#1e2c46' }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-7">
          <Rv>
            <p className="metaa" style={{ color: '#b9c2d4' }}>06 — about the institute</p>
          </Rv>
          <Rv delay={80}>
            <h2 className="serif font-medium leading-[1.08] mt-5" style={{ color: '#fdfaf1', fontSize: 'clamp(32px, 4.2vw, 54px)' }}>
              Curiosity is where <em>research begins.</em>
            </h2>
          </Rv>
          <Rv delay={140}>
            <p className="text-[15px] leading-relaxed mt-6 max-w-xl" style={{ color: '#c3cbdb' }}>
              IARS is open to undergraduates, postgraduates, and the merely interested alike.
              Continue your investigation anytime — your reading list, margin notes and filed
              readings wait exactly where you left them.
            </p>
          </Rv>
          <Rv delay={200}>
            <div className="flex flex-wrap gap-3 mt-8">
              <a href="#workspace" className="btn" style={{ background: '#fdfaf1', color: '#1e2c46' }}>
                Continue your investigation <span className="arr">→</span>
              </a>
              <a href="#library" className="btn" style={{ borderColor: 'rgba(253,250,241,.35)', color: '#fdfaf1' }}>
                Explore related questions
              </a>
            </div>
          </Rv>
        </div>
        <div className="md:col-span-4 md:col-start-9">
          <Rv delay={120}>
            <div className="p-6" style={{ border: '1px solid rgba(253,250,241,.25)' }}>
              <p className="metaa" style={{ color: '#b9c2d4' }}>the compact</p>
              <ul className="mt-4 space-y-3 text-[13.5px]" style={{ color: '#e4e9f2' }}>
                <li>— Cite your machines like your archives.</li>
                <li>— Disagreement is a source, not a problem.</li>
                <li>— Friction in discovery is a feature.</li>
                <li>— Every claim should survive a seminar.</li>
              </ul>
              <div className="mt-6 flex items-center gap-4">
                <Seal size={72} tone="#c39a2b" />
                <p className="caption" style={{ color: '#8b96ad' }}>seal of the institute · mmxxvi</p>
              </div>
            </div>
          </Rv>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const [source, setSource] = useState<DeskSource | null>(null);
  return (
    <>
      <Hero onOpen={setSource} />
      <SourcePreview source={source} onClose={() => setSource(null)} />
      <Institution />
      <LibrarySection />
      <MapSection />
      <WorkspaceSection />
      <ProcessSection />
      <About />
    </>
  );
}

/* ================= app routes ================= */

function PageHead({ index, title, note }: { index: string; title: string; note: string }) {
  return (
    <div className="mb-10">
      <p className="metaa">{index}</p>
      <h1 className="serif font-medium text-navy mt-3" style={{ fontSize: 'clamp(34px, 4.6vw, 56px)' }}>{title}</h1>
      <p className="metaa mt-3">{note}</p>
      <div className="rule mt-6" />
    </div>
  );
}

function pageHeadProps(path: string): { index: string; title: string; note: string } {
  switch (path) {
    case '/login':
      return { index: 'admissions — i', title: 'Sign in', note: 'credentials verified server-side · bcrypt cost 12' };
    case '/register':
      return { index: 'admissions — ii', title: 'Join the institute', note: 'password policy enforced before hashing' };
    case '/dashboard':
      return { index: 'reading room — analysis', title: 'Commonplace book', note: 'aggregate readings · trajectory & bands' };
    case '/history':
      return { index: 'the archive', title: 'Filed readings', note: 'owner-scoped records · RBAC enforced' };
    case '/compare':
      return { index: 'reading room — analysis', title: 'Comparative shelf', note: 'up to four readings side by side' };
    case '/admin':
      return { index: 'registrar — restricted', title: 'Registrar', note: 'role-gated · every action audited' };
    default:
      return { index: '', title: '', note: '' };
  }
}

function Shell() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const loc = useLocation();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!loc.hash) window.scrollTo({ top: 0 });
  }, [loc.pathname, loc.hash]);

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="grain" aria-hidden="true" />
      <Masthead />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16">
                <PageHead {...pageHeadProps('/login')} />
                <Login />
              </div>
            }
          />
          <Route
            path="/register"
            element={
              <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16">
                <PageHead {...pageHeadProps('/register')} />
                <Register />
              </div>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16">
                  <PageHead {...pageHeadProps('/dashboard')} />
                  <Dashboard />
                </div>
              </Protected>
            }
          />
          <Route
            path="/history"
            element={
              <Protected>
                <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16">
                  <PageHead {...pageHeadProps('/history')} />
                  <History />
                </div>
              </Protected>
            }
          />
          <Route
            path="/compare"
            element={
              <Protected>
                <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16">
                  <PageHead {...pageHeadProps('/compare')} />
                  <Comparison />
                </div>
              </Protected>
            }
          />
          <Route
            path="/admin"
            element={
              <Protected>
                <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16">
                  <PageHead {...pageHeadProps('/admin')} />
                  <AdminPanel />
                </div>
              </Protected>
            }
          />
        </Routes>
      </main>
      <footer style={{ background: '#e9dfc6' }}>
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-12">
          <div className="rule-double pt-8 grid sm:grid-cols-3 gap-8 items-start">
            <div>
              <p className="serif text-2xl font-semibold text-navy">IARS</p>
              <p className="metaa mt-2">institute for ai & research systems</p>
            </div>
            <div className="font-mono text-[10.5px] leading-loose text-[#75705f]">
              HELMET CSP · JWT HTTPONLY
              <br />
              ZOD VALIDATION · RATE LIMIT
              <br />
              RBAC · PRISMA ORM · AUDIT LOG
            </div>
            <div className="flex sm:justify-end items-start gap-5">
              <Folio n="99" />
              <Seal size={76} />
            </div>
          </div>
          <p className="caption mt-8">secure reference implementation · postgresql / mongodb · mit · mmxxvi</p>
        </div>
      </footer>
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore();
  const loc = useLocation();
  if (loading)
    return (
      <div className="grid place-items-center py-24">
        <p className="metaa">verifying your reader’s ticket…</p>
      </div>
    );
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
