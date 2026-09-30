import { useEffect, useRef } from 'react';

const FACES = [
  { cls: 'fx', icon: '🎯' },
  { cls: 'fz', icon: '📊' },
  { cls: 'bx', icon: '🏫' },
  { cls: 'bz', icon: '🧠' },
  { cls: 'fty', icon: '🔐' },
  { cls: 'bty', icon: '🌍' },
];

export function CubeScene({ size = 132 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const on = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      el.style.transform = `rotateX(${-22 + ny * 46}deg) rotateY(${nx * 66}deg)`;
    };
    window.addEventListener('pointermove', on);
    return () => window.removeEventListener('pointermove', on);
  }, []);

  return (
    <div className="scene-3d grid place-items-center select-none" aria-hidden="true">
      <div ref={ref} className="cube cube--spin preserve" style={{ width: size, height: size }}>
        {FACES.map((f) => (
          <div key={f.cls} className={`cube-face ${f.cls}`}>
            <span>{f.icon}</span>
          </div>
        ))}
      </div>
      <div
        className="cube preserve"
        style={{
          width: size * 0.42,
          height: size * 0.42,
          marginTop: 26,
          position: 'absolute',
          transform: 'rotateX(60deg) translateZ(46px)',
          opacity: 0.5,
        }}
      >
        <div className="cube-face" style={{ transform: 'translateZ(28px)' }}>
          <span style={{ fontSize: 16 }}>✨</span>
        </div>
      </div>
    </div>
  );
}