import { useEffect, useMemo, useState } from 'react';
import { Rv } from '../../lib/reveal';

export type ArchiveItem = {
  ref: string;
  cat: string;
  title: string;
  tags: string;
  year: string;
  cite: string;
  abstract: string;
};

export const ARCHIVE: ArchiveItem[] = [
  { ref: 'RESEARCH / 0241', cat: 'Research Papers', title: 'Artificial Intelligence & Higher Education', tags: 'Education · AI · Learning Sciences', year: '2026', cite: 'Okafor, L. & Marsh, D. (2026). IARS Journal of Education Research, 12(1).', abstract: 'A multi-site study of generative AI adoption across fourteen universities. Finds that explicit citation policies raise student disclosure and that faculty reading groups predict sustained use better than any infrastructure metric.' },
  { ref: 'RESEARCH / 0238', cat: 'Research Papers', title: 'What Teachers Need Before They Need Tools', tags: 'Teacher Training · Policy', year: '2025', cite: 'Ellery, P. et al. (2025). IARS Working Papers, 08.', abstract: 'Survey of 1,204 practitioners: pedagogical confidence explains three times more variance in classroom AI use than device ratios. Recommends funded time over funded hardware.' },
  { ref: 'BOOK / 0117', cat: 'Books', title: 'The Reading University', tags: 'History · Institutions', year: '2024', cite: 'Vance, H. (2024). IARS Press.', abstract: 'A history of how universities absorbed earlier media revolutions — print, broadcast, the web — and what each episode suggests about the present one.' },
  { ref: 'BOOK / 0109', cat: 'Books', title: 'Evidence, Properly Cited', tags: 'Methods · Scholarship', year: '2023', cite: 'Adeyemi, S. (2023). IARS Press.', abstract: 'A short manual on building arguments that survive contact with a seminar: sources, warrants, and the graceful concession.' },
  { ref: 'DATASET / 0084', cat: 'Datasets', title: '8,400 Anonymised Reading Lists', tags: 'Syllabi · Disclosure', year: '2026', cite: 'IARS Data Papers. doi:10.iars/084', abstract: 'Syllabi that mention AI explicitly correlate with higher student disclosure of AI assistance. Includes discipline, level, and policy-text coding.' },
  { ref: 'DATASET / 0079', cat: 'Datasets', title: 'Faculty Readiness Survey, n=1,204', tags: 'Survey · Training', year: '2025', cite: 'IARS Field Notes, spring term.', abstract: 'Raw responses and codebook from the readiness survey behind Study 02. Training, collegial culture, and clear policy dominate.' },
  { ref: 'DATASET / T-001', cat: 'Datasets', title: 'Teacher Questionnaire — AI in Education (Responses)', tags: 'Survey · Teacher training · n=50', year: '2026', cite: 'IARS field collection · teacher questionnaire · 50 responses', abstract: 'Institutional field questionnaire on artificial intelligence in education. Captures teacher awareness, adoption behaviour, perceived support needs, ethical stance and willingness to integrate AI into formal teaching.' },
  { ref: 'REPORT / 0152', cat: 'Reports', title: 'Campus Infrastructure Audit', tags: 'Systems · Access', year: '2026', cite: 'IARS Archive, shelf 0241-B.', abstract: 'Bandwidth is rarely the binding constraint. Identity management, licensing clarity, and help-desk guidance decide whether tools reach classrooms.' },
  { ref: 'REPORT / 0148', cat: 'Reports', title: 'The One-Page Policy Compact', tags: 'Governance · Practice', year: '2025', cite: 'Deanery oral history collection.', abstract: 'How one faculty replaced a prohibition with a one-page citation compact — and what happened to misconduct referrals afterward.' },
  { ref: 'ARTICLE / 0311', cat: 'Articles', title: 'Seminars That Cite Their Machines', tags: 'Pedagogy · Norms', year: '2026', cite: 'IARS Review of Teaching, 4(2).', abstract: 'Classroom protocols for treating AI contributions the way footnotes treat archives: visibly, specifically, without fuss.' },
  { ref: 'ARTICLE / 0305', cat: 'Articles', title: 'Against the Ban', tags: 'Opinion · Policy', year: '2025', cite: 'IARS Review of Teaching, 3(4).', abstract: 'A polemical case that prohibition teaches evasion while guidance teaches judgement — with three cautionary counter-examples.' },
  { ref: 'NOTE / 0042', cat: 'Notes', title: 'Margin Notes on Machine Grading', tags: 'Assessment · Field note', year: '2026', cite: 'Researcher notebook, anonymised.', abstract: 'Six weeks of trying to grade with machine assistance: where it helped (rubric drift) and where it quietly harmed (edge-case students).' },
  { ref: 'NOTE / 0037', cat: 'Notes', title: 'A Librarian’s Defence of Friction', tags: 'Library · Discovery', year: '2025', cite: 'Researcher notebook, anonymised.', abstract: 'In praise of slow discovery: why the catalogue’s productive friction may be a feature worth preserving in instant-answer systems.' },
];

const CATS = ['All', 'Research Papers', 'Books', 'Datasets', 'Reports', 'Articles', 'Notes'];
const LIST_KEY = 'iars-reading-list';

function loadList(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LIST_KEY) || '[]');
  } catch {
    return [];
  }
}

export function Library() {
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState<ArchiveItem | null>(ARCHIVE[0]);
  const [list, setList] = useState<string[]>(loadList);

  useEffect(() => {
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
  }, [list]);

  const items = useMemo(() => (cat === 'All' ? ARCHIVE : ARCHIVE.filter((a) => a.cat === cat)), [cat]);
  const toggle = (ref: string) =>
    setList((l) => (l.includes(ref) ? l.filter((x) => x !== ref) : [...l, ref]));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="tabs" role="tablist" aria-label="Archive categories">
          {CATS.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)}>
              {c === 'All' ? 'All' : c.replace(/s$/, '')}
            </button>
          ))}
        </div>
        <p className="metaa">
          your reading list — {list.length} {list.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 mt-6 items-start">
        <Rv className="sheet-flat">
          {items.map((a) => {
            const saved = list.includes(a.ref);
            return (
              <button
                key={a.ref}
                onClick={() => setOpen(a)}
                aria-selected={open?.ref === a.ref}
                className="arch-row w-full text-left grid grid-cols-[auto_1fr_auto] gap-4 items-baseline px-5 py-4 rule-soft first:border-t-0"
                style={{ borderTop: 0 }}
              >
                <span className="ref whitespace-nowrap">{a.ref}</span>
                <span>
                  <span className="serif block text-[17px] text-navy leading-snug">{a.title}</span>
                  <span className="caption block mt-1">
                    {a.tags} · {a.year}
                    {saved ? ' · ◆ in your list' : ''}
                  </span>
                </span>
                <span className="metaa" aria-hidden="true">
                  →
                </span>
              </button>
            );
          })}
        </Rv>

        <div className="sheet p-6 md:p-7 lg:sticky lg:top-32" aria-live="polite">
          {open ? (
            <>
              <p className="ref">{open.ref}</p>
              <h3 className="serif text-2xl text-navy leading-snug mt-2">{open.title}</h3>
              <p className="caption mt-2">
                {open.tags} · {open.year}
              </p>
              <div className="rule my-5" />
              <p className="text-[13.5px] leading-relaxed text-inkbl">{open.abstract}</p>
              <p className="mt-4 pl-3 text-[12px] italic serif text-inkbl" style={{ borderLeft: '2px solid var(--mustard)' }}>
                {open.cite}
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <button className="btn btn-navy flex-1" onClick={() => toggle(open.ref)}>
                  {list.includes(open.ref) ? 'Saved ◆' : 'Add to reading list'}
                </button>
              </div>
              <div className="rule my-5" />
              <p className="metaa">recently discovered</p>
              <ul className="mt-2 space-y-1.5">
                {ARCHIVE.filter((a) => a.ref !== open.ref)
                  .slice(0, 3)
                  .map((a) => (
                    <li key={a.ref}>
                      <button onClick={() => setOpen(a)} className="text-left text-[12.5px] text-acad underline underline-offset-4 decoration-acad/30 hover:decoration-acad">
                        {a.title}
                      </button>
                    </li>
                  ))}
              </ul>
            </>
          ) : (
            <p className="metaa">select a record to open it</p>
          )}
        </div>
      </div>
    </div>
  );
}
