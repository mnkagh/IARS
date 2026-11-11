import { useMemo, useState } from 'react';
import { Rv } from '../../lib/reveal';

type Group = 'concept' | 'paper' | 'researcher' | 'topic' | 'evidence';

type Node = {
  id: string;
  label: string;
  group: Group;
  x: number;
  y: number;
  detail: string;
  links: string[];
};

const GROUP_COLOR: Record<Group, string> = {
  concept: '#1e2c46',
  paper: '#3d5a80',
  researcher: '#7d3b47',
  topic: '#7e9070',
  evidence: '#b2663f',
};

const NODES: Node[] = [
  { id: 'q', label: 'AI & Education', group: 'concept', x: 400, y: 250, detail: 'The central inquiry. Everything on this wall relates to how artificial intelligence meets teaching, learning, and the institutions that hold them.', links: ['cite', 'training', 'okafor', 'policy', 'syllabi', 'ban'] },
  { id: 'cite', label: 'Citation norms', group: 'concept', x: 210, y: 120, detail: 'Treating machine contributions the way footnotes treat archives — visibly and specifically. See Seminars That Cite Their Machines.', links: ['q', 'seminar', 'ban'] },
  { id: 'training', label: 'Faculty training', group: 'topic', x: 590, y: 110, detail: 'Pedagogical confidence explains 3× more adoption variance than device ratios. Training is the highest-weight dimension in the IARS model.', links: ['q', 'ellery', 'survey'] },
  { id: 'okafor', label: 'Okafor & Marsh (2026)', group: 'paper', x: 150, y: 300, detail: 'Multi-site study across fourteen universities: explicit policies raise disclosure; reading groups predict sustained use.', links: ['q', 'cite', 'syllabi'] },
  { id: 'seminar', label: 'Seminar protocols', group: 'evidence', x: 300, y: 420, detail: 'Classroom evidence: discussion quality rises when AI use is cited like any other source.', links: ['cite', 'q'] },
  { id: 'ellery', label: 'P. Ellery', group: 'researcher', x: 620, y: 300, detail: 'Researcher behind the readiness survey. Argues for funded time over funded hardware.', links: ['training', 'survey'] },
  { id: 'survey', label: 'Readiness survey n=1,204', group: 'evidence', x: 700, y: 180, detail: 'Raw responses show training, collegial culture, and clear policy dominating adoption.', links: ['training', 'ellery'] },
  { id: 'policy', label: 'The one-page compact', group: 'topic', x: 470, y: 420, detail: 'A faculty replaced prohibition with a one-page citation compact. Misconduct referrals fell.', links: ['q', 'ban', 'seminar'] },
  { id: 'syllabi', label: '8,400 syllabi', group: 'evidence', x: 230, y: 180, detail: 'Syllabi mentioning AI explicitly correlate with higher student disclosure.', links: ['q', 'okafor'] },
  { id: 'ban', label: 'Against the Ban', group: 'paper', x: 560, y: 430, detail: 'Polemic: prohibition teaches evasion while guidance teaches judgement — with cautionary counter-examples.', links: ['policy', 'cite'] },
  { id: 'vance', label: 'H. Vance', group: 'researcher', x: 120, y: 420, detail: 'Historian of universities and media revolutions. Argues the present moment rhymes with print, broadcast, and the web.', links: ['okafor'] },
  { id: 'friction', label: 'Defence of friction', group: 'topic', x: 700, y: 380, detail: 'A librarian’s case that slow discovery has virtues worth preserving in instant-answer systems.', links: ['ban', 'survey'] },
];

export function KnowledgeMapSection() {
  const [sel, setSel] = useState<string>('q');
  const byId = useMemo(() => Object.fromEntries(NODES.map((n) => [n.id, n])), []);
  const active = byId[sel];
  const neighbour = useMemo(() => new Set([sel, ...active.links]), [sel, active.links]);

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
      <Rv className="sheet-flat p-2">
        <svg viewBox="0 0 800 520" className="w-full h-auto" role="group" aria-label="Knowledge map: ideas rarely exist alone">
          {NODES.flatMap((n) =>
            n.links
              .filter((t) => byId[t] && n.id < t)
              .map((t) => {
                const m = byId[t];
                const on = neighbour.has(n.id) && neighbour.has(t);
                return (
                  <line
                    key={`${n.id}-${t}`}
                    x1={n.x}
                    y1={n.y}
                    x2={m.x}
                    y2={m.y}
                    stroke={on ? '#1e2c46' : 'rgba(30,44,70,.14)'}
                    strokeWidth={on ? 1.2 : 0.8}
                  />
                );
              })
          )}
          {NODES.map((n) => {
            const dim = !neighbour.has(n.id);
            return (
              <g
                key={n.id}
                role="button"
                tabIndex={0}
                aria-label={`${n.label} — ${n.group}`}
                onClick={() => setSel(n.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSel(n.id);
                  }
                }}
                style={{ cursor: 'pointer', opacity: dim ? 0.35 : 1, transition: 'opacity .3s ease' }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.id === 'q' ? 10 : 7}
                  fill={sel === n.id ? GROUP_COLOR[n.group] : '#fdfaf1'}
                  stroke={GROUP_COLOR[n.group]}
                  strokeWidth={n.id === 'q' ? 3 : 1.8}
                />
                <text
                  x={n.x}
                  y={n.y + (n.id === 'q' ? 26 : 22)}
                  textAnchor="middle"
                  fontSize={11}
                  fontFamily="IBM Plex Mono, monospace"
                  letterSpacing={1}
                  fill={dim ? '#a39c88' : '#1e2c46'}
                >
                  {n.label.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="flex flex-wrap gap-x-5 gap-y-2 px-4 py-3 rule">
          {(Object.keys(GROUP_COLOR) as Group[]).map((g) => (
            <span key={g} className="caption flex items-center gap-2">
              <i className="inline-block w-2 h-2 rounded-full" style={{ background: GROUP_COLOR[g] }} />
              {g}
            </span>
          ))}
        </div>
      </Rv>

      <div className="sheet p-6 md:p-7 lg:sticky lg:top-32" aria-live="polite">
        <p className="metaa">{active.group} — selected</p>
        <h3 className="serif text-2xl text-navy leading-snug mt-2">{active.label}</h3>
        <div className="rule my-4" />
        <p className="text-[13.5px] leading-relaxed text-inkbl">{active.detail}</p>
        <p className="metaa mt-5">connected to</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {active.links.map((l) => (
            <button key={l} onClick={() => setSel(l)} className="kmap-chip px-3 py-1.5 ref">
              {byId[l].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
