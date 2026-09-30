import { useCallback, useEffect, useRef, useState } from 'react';

export function useTilt<T extends HTMLElement = HTMLDivElement>(depth = 14) {
  const ref = useRef<T>(null);
  const raf = useRef(0);

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    el.style.setProperty('--gx', '50%');
    el.style.setProperty('--gy', '50%');
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!el || e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        el.style.transform = `perspective(1400px) rotateX(${(0.5 - py) * depth * 2}deg) rotateY(${(px - 0.5) * depth * 2}deg) translateZ(14px)`;
        el.style.setProperty('--gx', `${px * 100}%`);
        el.style.setProperty('--gy', `${py * 100}%`);
      });
    },
    [depth]
  );

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return { ref, onPointerMove, onPointerLeave: reset };
}

export function useMagnetic<T extends HTMLElement>(strength = 0.3) {
  const ref = useRef<T>(null);
  const raf = useRef(0);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!el || e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px) scale(1.04)`;
      });
    },
    [strength]
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    el.style.transform = 'translate(0,0) scale(1)';
  }, []);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return { ref, onPointerMove, onPointerLeave };
}

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) return;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);

  return value;
}

export function usePointerParallax(strength = 22) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const on = (e: PointerEvent) => {
      const dx = (e.clientX / window.innerWidth - 0.5) * strength;
      const dy = (e.clientY / window.innerHeight - 0.5) * strength;
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    };
    window.addEventListener('pointermove', on);
    return () => window.removeEventListener('pointermove', on);
  }, [strength]);
  return ref;
}

export function useKeyPress(target: string, cb: () => void) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === target.toLowerCase()) cb();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [target, cb]);
}