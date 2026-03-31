'use client';

import { animate, motion, useAnimationFrame, useMotionValue } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Config ──────────────────────────────────────────────────────────
const CONFIG = {
  rows: 7,                     // number of text rows
  fontWeight: 900,             // text thickness (100–900)
  letterSpacing: '0.08em',

  // How many seconds one full scroll cycle takes (lower = faster)
  scrollSpeed: 150,

  // Mouse at top of screen = fast, bottom = slow
  speedAtTop: 1.0,
  speedAtBottom: 0.3,
  speedSmoothing: 0.03,        // how gradually speed changes (lower = smoother)

  // Timing after click/scroll (ms) — controls the lock → highlight → fade sequence
  lockDuration: 1200,          // slide animation
  highlightAt: 1300,           // when the name highlights
  fadeAt: 2100,                // when intro starts fading
  doneAt: 2900,                // when main page appears
};

// ── Derived constants (don't edit) ──────────────────────────────────
const MIDDLE_ROW = Math.floor(CONFIG.rows / 2);
const COPIES = 20;

const LOCK_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Phase = 'scrolling' | 'locking' | 'highlighted' | 'fading';

interface TextIntroProps {
  onComplete: () => void;
}

// ── Name with data-eck span for future glow effects ──
function NameText() {
  return <>Jakob <span data-eck>Eck</span> Friberg </>;
}

// ── Web Animations API marquee with playbackRate control ──
function useMarqueeAnimation(
  elRef: React.RefObject<HTMLDivElement | null>,
  duration: number,
  reverse: boolean,
  speedRef: React.RefObject<number>,
  enabled: boolean,
) {
  const animRef = useRef<Animation | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const anim = el.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-50%)' },
      ],
      {
        duration: duration * 1000,
        iterations: Infinity,
        easing: 'linear',
        direction: reverse ? 'reverse' : 'normal',
      },
    );

    animRef.current = anim;
    return () => { anim.cancel(); animRef.current = null; };
  }, [elRef, duration, reverse]);

  useAnimationFrame(() => {
    const anim = animRef.current;
    if (!anim || !enabled) return;
    anim.playbackRate = speedRef.current;
  });

  return animRef;
}

// ── ScrollingRow ──
function ScrollingRow({
  index, phase, speedRef,
}: {
  index: number;
  phase: Phase;
  speedRef: React.RefObject<number>;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isReverse = index % 2 !== 0;
  const isPostScroll = phase !== 'scrolling';
  const duration = CONFIG.scrollSpeed + index * 5;

  useMarqueeAnimation(rowRef, duration, isReverse, speedRef, !isPostScroll);

  const content = Array(COPIES).fill(null).map((_, i) => (
    <span key={i}><NameText /></span>
  ));

  return (
    <div className="overflow-hidden whitespace-nowrap w-full flex-1 flex items-center">
      <motion.div
        ref={rowRef}
        className="inline-flex whitespace-nowrap select-none font-display"
        style={{
          fontSize: `calc(100vh / ${CONFIG.rows})`,
          lineHeight: '1.1',
          letterSpacing: CONFIG.letterSpacing,
          fontWeight: CONFIG.fontWeight,
        }}
        animate={{ opacity: isPostScroll ? 0.08 : 1 }}
        transition={{ opacity: { duration: 0.6 } }}
      >
        <span className="marquee-half">{content}</span>{'\u00A0'}
        <span className="marquee-half" aria-hidden="true">{content}</span>
      </motion.div>
    </div>
  );
}

// ── MiddleRow ──
function MiddleRow({
  phase, speedRef,
}: {
  phase: Phase;
  speedRef: React.RefObject<number>;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isReverse = MIDDLE_ROW % 2 !== 0;
  const duration = CONFIG.scrollSpeed + MIDDLE_ROW * 5;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const x = useMotionValue(0);
  const [locked, setLocked] = useState(false);

  const animRef = useMarqueeAnimation(
    rowRef, duration, isReverse, speedRef, phase === 'scrolling',
  );

  useEffect(() => {
    if (phase !== 'locking') return;

    const el = rowRef.current;
    const anim = animRef.current;
    if (!el || !anim) return;

    // Freeze at current position
    anim.pause();
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    const currentX = matrix.m41;
    anim.cancel();

    // Apply position directly to DOM so we can measure immediately
    el.style.transform = `translateX(${currentX}px)`;

    // Find closest name span to viewport center
    const center = window.innerWidth / 2;
    const spans = el.querySelectorAll<HTMLSpanElement>('[data-name]');
    let closest: HTMLSpanElement | undefined;
    let minDist = Infinity;

    spans.forEach((span) => {
      const rect = span.getBoundingClientRect();
      const dist = Math.abs(rect.left + rect.width / 2 - center);
      if (dist < minDist) { minDist = dist; closest = span; }
    });

    if (!closest) return;
    const r = closest.getBoundingClientRect();
    const targetX = currentX + (center - (r.left + r.width / 2));

    // Fade out all names except the closest one
    spans.forEach((span) => {
      if (span === closest) {
        span.style.opacity = '1';
      } else {
        span.style.transition = 'opacity 0.6s ease';
        span.style.opacity = '0.08';
      }
    });

    // Hand off to framer-motion and animate
    x.set(currentX);
    setLocked(true);

    requestAnimationFrame(() => {
      animate(x, targetX, {
        duration: CONFIG.lockDuration / 1000,
        ease: LOCK_EASE,
      });
    });
  }, [phase, x, animRef]);

  const content = Array(COPIES).fill(null).map((_, i) => (
    <span key={i}><span data-name><NameText /></span></span>
  ));

  return (
    <div className="overflow-hidden whitespace-nowrap w-full flex-1 flex items-center">
      <motion.div
        ref={rowRef}
        className="inline-flex whitespace-nowrap select-none font-display"
        style={{
          ...(locked ? { x } : {}),
          fontSize: `calc(100vh / ${CONFIG.rows})`,
          lineHeight: '1.1',
          letterSpacing: CONFIG.letterSpacing,
          fontWeight: CONFIG.fontWeight,
        }}
      >
        <span className="marquee-half">{content}</span>{'\u00A0'}
        <span className="marquee-half" aria-hidden="true">{content}</span>
      </motion.div>
    </div>
  );
}

// ── Main component ──
export default function TextIntro({ onComplete }: TextIntroProps) {
  const [phase, setPhase] = useState<Phase>('scrolling');
  const hasInteracted = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const speedRef = useRef(1);
  const targetSpeedRef = useRef(1);

  // Mouse Y → speed: top = fast, bottom = slow
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = Math.max(0, Math.min(1, e.clientY / window.innerHeight));
      targetSpeedRef.current = CONFIG.speedAtTop + t * (CONFIG.speedAtBottom - CONFIG.speedAtTop);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  // Smooth speed toward target
  useAnimationFrame(() => {
    speedRef.current += (targetSpeedRef.current - speedRef.current) * CONFIG.speedSmoothing;
  });

  // Any interaction triggers the lock → highlight → fade → done sequence
  const triggerLock = useCallback(() => {
    if (hasInteracted.current) return;
    hasInteracted.current = true;
    setPhase('locking');

    timersRef.current = [
      setTimeout(() => setPhase('highlighted'), CONFIG.highlightAt),
      setTimeout(() => setPhase('fading'), CONFIG.fadeAt),
      setTimeout(() => onComplete(), CONFIG.doneAt),
    ];
  }, [onComplete]);

  useEffect(() => {
    const handler = () => triggerLock();
    const events = ['click', 'wheel', 'keydown', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, handler));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, [triggerLock]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--background)' }}
      animate={{ opacity: phase === 'fading' ? 0 : 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      {Array.from({ length: CONFIG.rows }).map((_, i) =>
        i === MIDDLE_ROW ? (
          <MiddleRow key={i} phase={phase} speedRef={speedRef} />
        ) : (
          <ScrollingRow key={i} index={i} phase={phase} speedRef={speedRef} />
        )
      )}
    </motion.div>
  );
}
