'use client';

import { useEffect, useRef, useState } from 'react';

import MainContent from '@/app/(components)/MainContent';
import SignShape from '@/app/(components)/sign/SignShape';

// ── Sign config (shared dimensions) ─────────────────────────────────
const SIGN_FONT_SIZE = 52;
const SIGN_PADDING_Y = 40;
const SIGN_WIDTH = 720;
const SIGN_HEIGHT = SIGN_FONT_SIZE + SIGN_PADDING_Y * 2;

const INTRO_SCALE = 1.8;
const FINAL_SCALE = 1.0;
const FINAL_TOP = 16; // px from top on main page

// How much wheel delta maps to 0→1 progress
const SCROLL_SENSITIVITY = 0.0008;
// Lerp factor for smooth progress
const SMOOTH_FACTOR = 0.08;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function HomePage() {
  const [progress, setProgress] = useState(0);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const lockedRef = useRef(false);
  const rafRef = useRef<number>(0);
  const touchYRef = useRef<number | null>(null);

  // Smooth animation loop
  useEffect(() => {
    const step = () => {
      const prev = currentRef.current;
      const next = lerp(prev, targetRef.current, SMOOTH_FACTOR);

      // Snap to target when close enough
      const snapped = Math.abs(next - targetRef.current) < 0.001
        ? targetRef.current
        : next;

      if (snapped !== prev) {
        currentRef.current = snapped;
        setProgress(snapped);
      }

      // Lock when we've fully arrived at 1
      if (snapped >= 1 && !lockedRef.current) {
        lockedRef.current = true;
      }

      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Wheel handler
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (lockedRef.current) return;
      e.preventDefault();
      targetRef.current = clamp(
        targetRef.current + e.deltaY * SCROLL_SENSITIVITY,
        0, 1,
      );
    };
    window.addEventListener('wheel', handler, { passive: false });
    return () => window.removeEventListener('wheel', handler);
  }, []);

  // Touch handlers for mobile
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      touchYRef.current = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (lockedRef.current || touchYRef.current === null) return;
      e.preventDefault();
      const deltaY = touchYRef.current - e.touches[0].clientY;
      touchYRef.current = e.touches[0].clientY;
      targetRef.current = clamp(
        targetRef.current + deltaY * SCROLL_SENSITIVITY * 2,
        0, 1,
      );
    };
    const onEnd = () => { touchYRef.current = null; };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);

  const scale = lerp(INTRO_SCALE, FINAL_SCALE, progress);
  // At progress 0: vertically centered (top:50% + translateY(-50%))
  // At progress 1: top: FINAL_TOP, translateY: 0
  const topPercent = lerp(50, 0, progress);
  const topPx = lerp(0, FINAL_TOP, progress);
  const translateYPercent = lerp(-50, 0, progress);
  const vignetteOpacity = clamp(1 - progress * 2.5, 0, 1);
  const contentOpacity = clamp((progress - 0.5) / 0.5, 0, 1);
  const cueOpacity = clamp(1 - progress * 5, 0, 1);

  return (
    <div className="fixed inset-0 bg-main-grid">
      {/* Main content — fades in */}
      <div style={{ opacity: contentOpacity }}>
        <MainContent />
      </div>

      {/* Intro vignette — fades out */}
      {vignetteOpacity > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-40"
          style={{
            opacity: vignetteOpacity,
            background: [
              'linear-gradient(to right, #35383B, transparent 20%, transparent 80%, #35383B)',
              'linear-gradient(to bottom, #35383B, transparent 20%, transparent 80%, #35383B)',
            ].join(', '),
          }}
        />
      )}

      {/* Sign — always on top, transforms from center to top */}
      <div
        className="fixed left-0 right-0 z-50 flex flex-col items-center pointer-events-none"
        style={{
          top: `calc(${topPercent}% + ${topPx}px)`,
          transform: `translateY(${translateYPercent}%)`,
        }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
          <SignShape
            width={SIGN_WIDTH}
            height={SIGN_HEIGHT}
            fontSize={SIGN_FONT_SIZE}
          />
        </div>

        {/* Scroll cue — fades out quickly */}
        {cueOpacity > 0 && (
          <div
            className="mt-20 flex flex-col items-center gap-2 text-white/40"
            style={{ opacity: cueOpacity }}
          >
            <span
              className="text-xs tracking-[0.2em] uppercase"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              scroll down
            </span>
            <svg
              width="20" height="12" viewBox="0 0 20 12"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              className="animate-bounce"
            >
              <polyline points="2,2 10,10 18,2" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
