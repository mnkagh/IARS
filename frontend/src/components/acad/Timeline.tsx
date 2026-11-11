import { useEffect, useRef, useState } from 'react';
import { Rv } from '../../lib/reveal';

const STEPS = [
  { n: '01', title: 'Question', text: 'Start with curiosity. Every investigation at IARS opens with a single question, recorded verbatim and kept visible throughout.' },
  { n: '02', title: 'Explore', text: 'Find relevant material. The library gathers papers, books, datasets and reports around your question — catalogued, cited, dated.' },
  { n: '03', title: 'Connect', text: 'Discover relationships. Sources rarely agree; the knowledge map shows where they meet, contradict, and borrow from each other.' },
  { n: '04', title: 'Analyze', text: 'Understand the evidence. The workspace weighs eight structural dimensions into one defensible reading with ranked gaps.' },
  { n: '05', title: 'Synthesize', text: 'Build a clearer perspective. Numbered research notes turn the reading into a plan you can defend in a seminar.' },
];

export function Timeline() {
  const [lit, setLit] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.i);
            setLit((v) => Math.max(v, i));
          }
        }
      },
      { threshold: 0.55 }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <ol className="relative mt-12 pl-10 md:pl-14">
      <div className="absolute top-2 bottom-2 rule" style={{ left: 7, borderTop: 0, borderLeft: '1px solid var(--line)' }} aria-hidden="true" />
      <div
        className="absolute top-2 transition-all duration-700"
        style={{ left: 7, bottom: 8, borderLeft: '2px solid var(--navy)', height: `${(lit / (STEPS.length - 1)) * 96}%` }}
        aria-hidden="true"
      />
      {STEPS.map((s, i) => (
        <li
          key={s.n}
          data-i={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="relative pb-12 last:pb-0"
        >
          <span
            className="absolute grid place-items-center font-mono text-[10px]"
            style={{
              left: '-2.62rem',
              top: 2,
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: '1px solid',
              borderColor: i <= lit ? '#1e2c46' : 'var(--line)',
              background: i <= lit ? '#1e2c46' : '#f5efe1',
              color: i <= lit ? '#fdfaf1' : '#a39c88',
              transition: 'all .4s ease',
            }}
            aria-hidden="true"
          >
            {s.n}
          </span>
          <Rv delay={40}>
            <p className="metaa">{s.n} — station</p>
            <h3 className="serif text-3xl text-navy mt-2">{s.title}</h3>
            <p className="text-[14px] leading-relaxed mt-2 max-w-lg text-inkbl">{s.text}</p>
          </Rv>
        </li>
      ))}
    </ol>
  );
}
