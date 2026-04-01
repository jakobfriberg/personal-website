'use client';

import { animate, motion, useAnimationFrame, useMotionValue } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Config ──────────────────────────────────────────────────────────
const CONFIG = {
  rows: 7,
  fontWeight: 900,
  letterSpacing: '0.08em',
  scrollSpeed: 150,             // seconds per full scroll cycle (lower = faster)
  speedVariation: 0.3,          // max speed difference between rows (0.3 = ±30%)

  speedAtTop: 1.0,
  speedAtBottom: 0.3,
  speedSmoothing: 0.03,         // lower = more inertia

  // ms after interaction — controls the lock → fade sequence
  lockDuration: 1200,
  highlightAt: 1300,
  fadeAt: 2100,
  doneAt: 2900,
};

// ── Derived ─────────────────────────────────────────────────────────
const MIDDLE_ROW = Math.floor(CONFIG.rows / 2);
const COPIES = 20;
const LOCK_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Per-row duration using golden ratio spacing to avoid sync
function rowDuration(index: number) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const t = ((index * phi) % 1);  // 0–1, evenly distributed but non-repeating
  const offset = (t - 0.5) * 2 * CONFIG.speedVariation; // map to ±speedVariation
  return CONFIG.scrollSpeed * (1 + offset);
}

const TEXT_STYLE = {
  fontSize: `calc(100vh / ${CONFIG.rows})`,
  lineHeight: '1.1' as const,
  letterSpacing: CONFIG.letterSpacing,
  fontWeight: CONFIG.fontWeight,
};

type Phase = 'scrolling' | 'locking' | 'highlighted' | 'fading';

// ── Utilities ───────────────────────────────────────────────────────

function NameText() {
  return <>Jakob <span data-eck>Eck</span> Friberg </>;
}

function findClosestSpan(container: HTMLElement) {
  const center = window.innerWidth / 2;
  const spans = container.querySelectorAll<HTMLSpanElement>('[data-name]');
  let closest: HTMLSpanElement | undefined;
  let minDist = Infinity;

  spans.forEach((span) => {
    const rect = span.getBoundingClientRect();
    const dist = Math.abs(rect.left + rect.width / 2 - center);
    if (dist < minDist) { minDist = dist; closest = span; }
  });

  if (!closest) return null;

  const r = closest.getBoundingClientRect();
  return { span: closest, offset: center - (r.left + r.width / 2), allSpans: spans };
}

// ── Hooks ───────────────────────────────────────────────────────────

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

function useMouseSpeed() {
  const speedRef = useRef(1);
  const targetRef = useRef(1);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = Math.max(0, Math.min(1, e.clientY / window.innerHeight));
      targetRef.current = CONFIG.speedAtTop + t * (CONFIG.speedAtBottom - CONFIG.speedAtTop);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useAnimationFrame(() => {
    speedRef.current += (targetRef.current - speedRef.current) * CONFIG.speedSmoothing;
  });

  return speedRef;
}

function useInteractionTrigger(callback: () => void) {
  useEffect(() => {
    const handler = () => callback();
    const events = ['click', 'wheel', 'keydown', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, handler));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, [callback]);
}

// ── Row components ──────────────────────────────────────────────────

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
  const duration = rowDuration(index);

  useMarqueeAnimation(rowRef, duration, isReverse, speedRef, !isPostScroll);

  const content = Array(COPIES).fill(null).map((_, i) => (
    <span key={i}><NameText /></span>
  ));

  return (
    <div className="overflow-hidden whitespace-nowrap w-full flex-1 flex items-center">
      <motion.div
        ref={rowRef}
        className="inline-flex whitespace-nowrap select-none font-display"
        style={TEXT_STYLE}
        animate={{ opacity: isPostScroll ? 0.08 : 1 }}
        transition={{ opacity: { duration: 0.6 } }}
      >
        <span className="marquee-half">{content}</span>{'\u00A0'}
        <span className="marquee-half" aria-hidden="true">{content}</span>
      </motion.div>
    </div>
  );
}

function MiddleRow({
  phase, speedRef,
}: {
  phase: Phase;
  speedRef: React.RefObject<number>;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isReverse = MIDDLE_ROW % 2 !== 0;
  const duration = rowDuration(MIDDLE_ROW);
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

    // Capture position before canceling — Web Animations API removes
    // the transform on cancel, so we must read it first and reapply
    anim.pause();
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    const currentX = matrix.m41;
    anim.cancel();
    el.style.transform = `translateX(${currentX}px)`;

    const result = findClosestSpan(el);
    if (!result) return;

    const { span: closest, offset, allSpans } = result;

    allSpans.forEach((span) => {
      if (span === closest) {
        span.style.opacity = '1';
      } else {
        span.style.transition = 'opacity 0.6s ease';
        span.style.opacity = '0.08';
      }
    });

    // Switch from Web Animation to framer-motion so we can animate
    // to the computed center position with easing
    const targetX = currentX + offset;
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
        style={{ ...(locked ? { x } : {}), ...TEXT_STYLE }}
      >
        <span className="marquee-half">{content}</span>{'\u00A0'}
        <span className="marquee-half" aria-hidden="true">{content}</span>
      </motion.div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────

interface TextIntroProps {
  onComplete: () => void;
}

export default function TextIntro({ onComplete }: TextIntroProps) {
  const [phase, setPhase] = useState<Phase>('scrolling');
  const hasInteracted = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const speedRef = useMouseSpeed();

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

  useInteractionTrigger(triggerLock);

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
