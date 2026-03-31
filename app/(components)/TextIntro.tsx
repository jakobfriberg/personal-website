'use client';

import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
} from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Config ──────────────────────────────────────────────────────────
const CONFIG = {
  name: 'Jakob Eck Friberg',
  rowCount: 7,
  middleRow: 3,               // 0-indexed (row 4 of 7)
  repeatCount: 30,

  // Typography
  letterSpacing: '0.08em',
  fontWeight: 900,             // 100–900, controls text fatness

  // Scroll speed (pixels per frame at ~60fps)
  scrollBaseSpeed: 1.5,        // base px/frame
  scrollSpeedVariation: 0.3,   // multiplied by row index for variety

  // Mouse Y-axis speed scaling (top = fast, bottom = slow)
  mouseSpeedMin: 0.2,          // speed multiplier at bottom of screen
  mouseSpeedMax: 1.5,          // speed multiplier at top of screen
  mouseYMin: 0.1,              // fraction of viewport height — above this = max speed
  mouseYMax: 0.9,              // fraction of viewport height — below this = min speed

  // Speed inertia (smooth lerp toward target speed)
  speedInertia: 0.03,          // 0 = no change, 1 = instant snap. Lower = more inertia

  // Lock-on animation
  lockDuration: 1.2,
  lockEase: [0.16, 1, 0.3, 1] as [number, number, number, number],

  // Phase timing (ms after interaction)
  highlightDelay: 1300,
  fadeDelay: 2100,
  completeDelay: 2900,

  // Fade durations (seconds)
  otherRowsFadeDuration: 0.6,
  introFadeDuration: 0.8,
};

const SEPARATOR = ' ';

type Phase = 'scrolling' | 'locking' | 'highlighted' | 'fading';

interface TextIntroProps {
  onComplete: () => void;
}

type SpeedRef = React.RefObject<number>;

// ── ScrollingRow (non-middle rows) ──
function ScrollingRow({
  index,
  phase,
  speedRef,
}: {
  index: number;
  phase: Phase;
  speedRef: SpeedRef;
}) {
  const direction = index % 2 === 0 ? 1 : -1;
  const isPostScroll = phase !== 'scrolling';
  const rowSpeed = CONFIG.scrollBaseSpeed * (1 + index * CONFIG.scrollSpeedVariation);
  const x = useMotionValue(direction === 1 ? -2000 : -8000);
  const elRef = useRef<HTMLDivElement>(null);
  const halfWidthRef = useRef(0);

  const repeatedText = Array(CONFIG.repeatCount)
    .fill(CONFIG.name)
    .join(SEPARATOR);

  // Measure half the total scroll width for wrapping
  useEffect(() => {
    if (elRef.current) {
      halfWidthRef.current = elRef.current.scrollWidth / 2;
    }
  }, []);

  useAnimationFrame((_, delta) => {
    if (isPostScroll) return;
    const pxPerMs = rowSpeed / 16.67;
    let newX = x.get() + direction * pxPerMs * speedRef.current * delta;

    // Wrap to create infinite scroll
    const hw = halfWidthRef.current;
    if (hw > 0) {
      if (newX > 0) newX -= hw;
      if (newX < -hw) newX += hw;
    }

    x.set(newX);
  });

  return (
    <div className="overflow-hidden whitespace-nowrap w-full flex-1 flex items-center">
      <motion.div
        ref={elRef}
        className="inline-block whitespace-nowrap select-none font-display"
        style={{
          x,
          fontSize: 'calc(100vh / 7)',
          lineHeight: '1.1',
          letterSpacing: CONFIG.letterSpacing,
          fontWeight: CONFIG.fontWeight,
        }}
        animate={{
          opacity: isPostScroll ? 0.08 : 1,
        }}
        transition={{
          opacity: { duration: CONFIG.otherRowsFadeDuration },
        }}
      >
        {repeatedText}
      </motion.div>
    </div>
  );
}

// ── MiddleRow ──
function MiddleRow({
  phase,
  speedRef,
}: {
  phase: Phase;
  speedRef: SpeedRef;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const direction = CONFIG.middleRow % 2 === 0 ? 1 : -1;
  const rowSpeed = CONFIG.scrollBaseSpeed * (1 + CONFIG.middleRow * CONFIG.scrollSpeedVariation);
  const x = useMotionValue(direction === 1 ? -2000 : -8000);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const halfWidthRef = useRef(0);

  // Measure half width for wrapping
  useEffect(() => {
    if (containerRef.current) {
      halfWidthRef.current = containerRef.current.scrollWidth / 2;
    }
  }, []);

  // Scroll loop — only runs during 'scrolling' phase
  useAnimationFrame((_, delta) => {
    if (phaseRef.current !== 'scrolling') return;
    const pxPerMs = rowSpeed / 16.67;
    let newX = x.get() + direction * pxPerMs * speedRef.current * delta;

    // Wrap to create infinite scroll
    const hw = halfWidthRef.current;
    if (hw > 0) {
      if (newX > 0) newX -= hw;
      if (newX < -hw) newX += hw;
    }

    x.set(newX);
  });

  // Lock-on: find closest name span and animate to center it
  useEffect(() => {
    if (phase !== 'locking') return;

    const container = containerRef.current;
    if (!container) return;

    const viewportCenter = window.innerWidth / 2;
    const spans = container.querySelectorAll<HTMLSpanElement>('[data-name]');
    let closestSpan: HTMLSpanElement | undefined;
    let closestDist = Infinity;

    spans.forEach((span) => {
      const rect = span.getBoundingClientRect();
      const spanCenter = rect.left + rect.width / 2;
      const dist = Math.abs(spanCenter - viewportCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestSpan = span;
      }
    });

    if (!closestSpan) return;

    const spanRect = (closestSpan as HTMLSpanElement).getBoundingClientRect();
    const spanCenter = spanRect.left + spanRect.width / 2;
    const offset = viewportCenter - spanCenter;

    const targetX = x.get() + offset;
    animate(x, targetX, {
      duration: CONFIG.lockDuration,
      ease: CONFIG.lockEase,
    });
  }, [phase, x]);

  return (
    <div className="overflow-hidden whitespace-nowrap w-full flex-1 flex items-center">
      <motion.div
        ref={containerRef}
        className="inline-block whitespace-nowrap select-none font-display"
        style={{
          x,
          fontSize: 'calc(100vh / 7)',
          lineHeight: '1.1',
          letterSpacing: CONFIG.letterSpacing,
          fontWeight: CONFIG.fontWeight,
        }}
      >
        {Array(CONFIG.repeatCount).fill(null).map((_, i) => (
          <span key={i}>
            {i > 0 && SEPARATOR}
            <span data-name>{CONFIG.name}</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── HighlightedName overlay ──
function HighlightedName({ phase }: { phase: Phase }) {
  const show = phase === 'highlighted' || phase === 'fading';

  return (
    <motion.div
      className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.4 }}
    >
      <span
        className="select-none font-display"
        style={{
          fontSize: 'calc(100vh / 7)',
          lineHeight: '1.1',
          letterSpacing: CONFIG.letterSpacing,
          fontWeight: CONFIG.fontWeight,
          color: 'var(--foreground)',
        }}
      >
        {CONFIG.name}
      </span>
    </motion.div>
  );
}

// ── Main component ──
export default function TextIntro({ onComplete }: TextIntroProps) {
  const [phase, setPhase] = useState<Phase>('scrolling');
  const hasInteracted = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const speedMultiplierRef = useRef(1);
  const targetSpeedRef = useRef(1);

  // Mouse Y-axis speed: top = fast, bottom = slow
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const yFraction = e.clientY / window.innerHeight;
      // Map: top (0) → max speed, bottom (1) → min speed
      const t = Math.max(0, Math.min(1,
        (yFraction - CONFIG.mouseYMin) / (CONFIG.mouseYMax - CONFIG.mouseYMin)
      ));
      targetSpeedRef.current = CONFIG.mouseSpeedMax + t * (CONFIG.mouseSpeedMin - CONFIG.mouseSpeedMax);
    };

    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  // Lerp the actual speed toward the target each frame (inertia)
  useAnimationFrame(() => {
    speedMultiplierRef.current +=
      (targetSpeedRef.current - speedMultiplierRef.current) * CONFIG.speedInertia;
  });

  // Interaction triggers lock sequence
  const triggerLock = useCallback(() => {
    if (hasInteracted.current) return;
    hasInteracted.current = true;
    setPhase('locking');

    timersRef.current = [
      setTimeout(() => setPhase('highlighted'), CONFIG.highlightDelay),
      setTimeout(() => setPhase('fading'), CONFIG.fadeDelay),
      setTimeout(() => onComplete(), CONFIG.completeDelay),
    ];
  }, [onComplete]);

  useEffect(() => {
    const handler = () => triggerLock();

    window.addEventListener('click', handler);
    window.addEventListener('wheel', handler);
    window.addEventListener('keydown', handler);
    window.addEventListener('touchstart', handler);

    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('wheel', handler);
      window.removeEventListener('keydown', handler);
      window.removeEventListener('touchstart', handler);
    };
  }, [triggerLock]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--background)' }}
      animate={{ opacity: phase === 'fading' ? 0 : 1 }}
      transition={{ duration: CONFIG.introFadeDuration, ease: 'easeInOut' }}
    >
      {Array.from({ length: CONFIG.rowCount }).map((_, i) =>
        i === CONFIG.middleRow ? (
          <MiddleRow
            key={i}
            phase={phase}
            speedRef={speedMultiplierRef}
          />
        ) : (
          <ScrollingRow
            key={i}
            index={i}
            phase={phase}
            speedRef={speedMultiplierRef}
          />
        )
      )}

      <HighlightedName phase={phase} />
    </motion.div>
  );
}
