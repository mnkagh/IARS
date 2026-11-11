import type { ReactNode } from 'react';
import { Rv } from '../../lib/reveal';

/** Numbered section heading: `01 — WHY IARS` + serif statement. */
export function SectionHead({
  no,
  label,
  title,
  intro,
}: {
  no: string;
  label: string;
  title: ReactNode;
  intro?: ReactNode;
}) {
  return (
    <div>
      <Rv>
        <p className="metaa">
          {no} — {label}
        </p>
      </Rv>
      <Rv delay={80}>
        <h2 className="serif font-medium leading-[1.08] tracking-tight mt-5 text-navy" style={{ fontSize: 'clamp(34px, 4.6vw, 58px)' }}>
          {title}
        </h2>
      </Rv>
      {intro && (
        <Rv delay={140}>
          <div className="mt-6 max-w-2xl text-[15px] leading-relaxed text-inkbl">{intro}</div>
        </Rv>
      )}
    </div>
  );
}

/** Circular institutional seal motif (pure CSS/SVG, no imagery). */
export function Seal({ size = 92, tone = '#1e2c46' }: { size?: number; tone?: string }) {
  return (
    <div
      className="stamp"
      style={{ width: size, height: size, color: tone, transform: 'rotate(-8deg)' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" width={size - 14} height={size - 14}>
        <defs>
          <path id="sealArc" d="M 50,50 m -34,0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0" fill="none" />
        </defs>
        <text fontSize="10.5" letterSpacing="2.5" fill="currentColor" fontFamily="IBM Plex Mono, monospace">
          <textPath href="#sealArc">IARS · EST · MMXXVI ·</textPath>
        </text>
        <text x="50" y="58" textAnchor="middle" fontSize="26" fill="currentColor" fontFamily="Fraunces, Georgia, serif" fontStyle="italic">
          Q
        </text>
      </svg>
    </div>
  );
}

/** Corner page number, e.g. `p. 01`. */
export function Folio({ n }: { n: string }) {
  return (
    <span className="caption" aria-hidden="true">
      p. {n}
    </span>
  );
}
