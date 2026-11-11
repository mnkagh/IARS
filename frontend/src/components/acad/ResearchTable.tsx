import { useEffect, useState } from 'react';

export type DeskSource = {
  id: string;
  kind: string;
  title: string;
  ref: string;
  note: string;
  x: number;
  y: number;
};

export const DESK_SOURCES: DeskSource[] = [
  {
    id: 'paper',
    kind: 'Paper 01',
    title: 'Generative AI in the Seminar Room',
    ref: 'IARS j. educ. res. · vol. 12 · 2026',
    note: 'A twelve-week study across four departments finds discussion quality rises when AI use is cited like any other source.',
    x: 16,
    y: 20,
  },
  {
    id: 'study',
    kind: 'Study 02',
    title: 'Faculty Readiness Survey, n=1,204',
    ref: 'IARS field notes · spring term',
    note: 'Training — not hardware — predicts adoption. Departments with reading groups adopt twice as fast.',
    x: 78,
    y: 14,
  },
  {
    id: 'report',
    kind: 'Report 03',
    title: 'Campus Infrastructure Audit',
    ref: 'IARS archive · shelf 0241-B',
    note: 'Network capacity is rarely the constraint. Identity, licensing and guidance are.',
    x: 12,
    y: 66,
  },
  {
    id: 'interview',
    kind: 'Interview 04',
    title: '“We needed a policy, not a ban”',
    ref: 'oral history collection · deanery',
    note: 'A department head on replacing prohibition with a one-page citation compact.',
    x: 84,
    y: 62,
  },
  {
    id: 'dataset',
    kind: 'Dataset 05',
    title: '8,400 anonymised reading lists',
    ref: 'IARS data papers · doi:10.iars/084',
    note: 'Syllabi mentioning AI explicitly correlate with higher student disclosure of AI use.',
    x: 50,
    y: 84,
  },
];

/**
 * The research desk: a central question with sources that appear
 * one by one. Hover reveals an annotation; click opens the preview.
 */
export function ResearchTable({ onOpen }: { onOpen: (s: DeskSource) => void }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(DESK_SOURCES.length);
      return;
    }
    if (shown >= DESK_SOURCES.length) return;
    const t = setTimeout(() => setShown((s) => s + 1), 650 + shown * 250);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <figure className="sheet-flat relative" style={{ background: '#f8f3e6' }}>
      <div className="flex items-center justify-between px-5 py-3 rule-soft" style={{ borderTop: 0 }}>
        <span className="metaa">the research table — fig. 01</span>
        <span className="metaa">
          {shown}/{DESK_SOURCES.length} sources
        </span>
      </div>

      <div className="relative mx-4 mb-4 plate" style={{ aspectRatio: '4 / 3.4' }}>
        {/* ruled backdrop */}
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent 0 27px, rgba(30,44,70,.07) 27px 28px)',
          }}
        />
        <svg viewBox="0 0 100 85" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {DESK_SOURCES.slice(0, shown).map((s) => (
            <line key={s.id} x1={50} y1={42} x2={s.x} y2={s.y} stroke="rgba(61,90,128,.45)" strokeWidth={0.35} />
          ))}
          <circle cx={50} cy={42} r={1.1} fill="#b2663f" />
        </svg>

        {/* central question */}
        <div className="absolute" style={{ left: '50%', top: '49%', transform: 'translate(-50%,-50%)', width: '46%' }}>
          <div className="sheet px-4 py-3 text-center">
            <p className="metaa" style={{ color: '#b2663f' }}>
              research question
            </p>
            <p className="serif italic text-navy leading-snug mt-1" style={{ fontSize: 'clamp(13px, 1.6vw, 17px)' }}>
              “How is artificial intelligence changing education?”
            </p>
          </div>
        </div>

        {DESK_SOURCES.slice(0, shown).map((s) => (
          <button
            key={s.id}
            type="button"
            className="desk-node"
            style={{ left: `${s.x}%`, top: `${s.y}%`, opacity: 1 }}
            onClick={() => onOpen(s)}
            aria-label={`Open ${s.kind}: ${s.title}`}
          >
            <span className="metaa block" style={{ color: '#3d5a80' }}>
              {s.kind}
            </span>
            <span className="block text-[12px] font-medium text-navy leading-snug mt-0.5">{s.title}</span>
            <span className="tip">{s.note}</span>
          </button>
        ))}
      </div>

      <figcaption className="px-5 py-3 caption rule">hover a source for its annotation — click to open the record</figcaption>
    </figure>
  );
}
