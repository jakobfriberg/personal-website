'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import MainContent from '@/app/(components)/MainContent';
import SignShape from '@/app/(components)/sign/SignShape';
import { unlockAudioContext } from '@/app/hooks/use-sound';

// ── Sign config ─────────────────────────────────────────────────────
const SIGN_FONT_SIZE = 52;
const SIGN_PADDING_Y = 40;
const SIGN_WIDTH = 720;
const SIGN_HEIGHT = SIGN_FONT_SIZE + SIGN_PADDING_Y * 2;

const SIGN_SVG_WIDTH = SIGN_WIDTH + 60;
const DESKTOP_INTRO_SCALE = 1.8;
const DESKTOP_FINAL_SCALE = 1.0;
const FINAL_TOP = 16;
const FINAL_TOP_MOBILE = -16;

const SCROLL_SENSITIVITY = 0.0008;
const SMOOTH_FACTOR = 0.06;
const SNAP_THRESHOLD = 0.3; // once past 30%, snap to full completion

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function HomePage() {
  const [done, setDone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const lockedRef = useRef(false);
  const rafRef = useRef<number>(0);
  const touchYRef = useRef<number | null>(null);

  // DOM refs for direct manipulation (no React re-renders per frame)
  const signContainerRef = useRef<HTMLDivElement>(null);
  const signScaleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const getScales = useCallback(() => {
    const vw = window.innerWidth;
    return {
      intro: Math.min(DESKTOP_INTRO_SCALE, vw * 0.85 / SIGN_SVG_WIDTH),
      final: Math.min(DESKTOP_FINAL_SCALE, vw * 0.92 / SIGN_SVG_WIDTH),
      finalTop: vw < 1024 ? FINAL_TOP_MOBILE : FINAL_TOP,
    };
  }, []);

  // Animation loop — direct DOM updates, no setState
  useEffect(() => {
    let scales = getScales();

    const onResize = () => { scales = getScales(); };
    window.addEventListener('resize', onResize);

    const step = () => {
      const prev = currentRef.current;
      const next = lerp(prev, targetRef.current, SMOOTH_FACTOR);
      const p = Math.abs(next - targetRef.current) < 0.001
        ? targetRef.current
        : next;

      currentRef.current = p;

      // Stop the loop once fully transitioned
      if (p >= 1 && !lockedRef.current) {
        lockedRef.current = true;
        setDone(true);
        return;
      }

      // Apply to DOM directly — only transform + opacity (GPU-composited)
      const scale = lerp(scales.intro, scales.final, p);
      const topPercent = lerp(50, 0, p);
      const topPx = lerp(0, scales.finalTop, p);
      const translateY = lerp(-50, 0, p);
      const contentOpacity = clamp((p - 0.5) / 0.5, 0, 1);
      const vignetteOpacity = clamp(1 - p * 2.5, 0, 1);
      const cueOpacity = clamp(1 - p * 5, 0, 1);

      if (signContainerRef.current) {
        signContainerRef.current.style.top = `calc(${topPercent}% + ${topPx}px)`;
        signContainerRef.current.style.transform = `translateY(${translateY}%)`;
      }
      if (signScaleRef.current) {
        signScaleRef.current.style.transform = `scale(${scale})`;
        signScaleRef.current.style.visibility = 'visible';
      }
      if (contentRef.current) {
        contentRef.current.style.opacity = String(contentOpacity);
      }
      if (vignetteRef.current) {
        vignetteRef.current.style.opacity = String(vignetteOpacity);
      }
      if (cueRef.current) {
        cueRef.current.style.opacity = String(cueOpacity);
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [getScales]);

  // Wheel handler
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (lockedRef.current) return;
      e.preventDefault();
      const next = clamp(
        targetRef.current + e.deltaY * SCROLL_SENSITIVITY,
        0, 1,
      );
      targetRef.current = next >= SNAP_THRESHOLD ? 1 : next;
    };
    window.addEventListener('wheel', handler, { passive: false });
    return () => window.removeEventListener('wheel', handler);
  }, []);

  // Touch handlers — desktop only (on mobile, intro is tap-only
  // so that a click event fires and unlocks AudioContext on iOS Safari)
  useEffect(() => {
    if (isMobile) return;

    const onStart = (e: TouchEvent) => {
      touchYRef.current = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (lockedRef.current || touchYRef.current === null) return;
      e.preventDefault();
      const deltaY = touchYRef.current - e.touches[0].clientY;
      touchYRef.current = e.touches[0].clientY;
      const next = clamp(
        targetRef.current + deltaY * SCROLL_SENSITIVITY * 2,
        0, 1,
      );
      targetRef.current = next >= SNAP_THRESHOLD ? 1 : next;
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
  }, [isMobile]);

  return (
    <div className="fixed inset-0 bg-main-grid">
      {/* Main content */}
      <div ref={contentRef} style={{ opacity: 0 }}>
        <MainContent introComplete={done} />
      </div>

      {/* Click blocker + vignette — full-screen tap target on mobile */}
      {!done && (
        <div
          ref={vignetteRef}
          className="fixed inset-0 z-40 cursor-pointer"
          onClick={() => { unlockAudioContext(); targetRef.current = 1; }}
          style={{
            opacity: 1,
            background: [
              'linear-gradient(to right, #35383B, transparent 20%, transparent 80%, #35383B)',
              'linear-gradient(to bottom, #35383B, transparent 20%, transparent 80%, #35383B)',
            ].join(', '),
          }}
        />
      )}

      {/* Sign */}
      <div
        ref={signContainerRef}
        className="fixed left-0 right-0 z-50 flex flex-col items-center pointer-events-none"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        <div
          ref={signScaleRef}
          className="cursor-pointer pointer-events-auto"
          onClick={() => { unlockAudioContext(); targetRef.current = 1; }}
          style={{
            visibility: 'hidden',
            transformOrigin: 'center center',
          }}
        >
          <SignShape
            width={SIGN_WIDTH}
            height={SIGN_HEIGHT}
            fontSize={SIGN_FONT_SIZE}
          />
        </div>

        {/* Scroll cue */}
        {!done && (
          <div
            ref={cueRef}
            className="mt-12 md:mt-20 flex flex-col items-center gap-2 text-white/40 cursor-pointer pointer-events-auto"
            onClick={() => { unlockAudioContext(); targetRef.current = 1; }}
            style={{ opacity: 1 }}
          >
            <span
              className="text-xs tracking-[0.2em] uppercase lg:hidden"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              {'< tap to continue >'}
            </span>
            <span
              className="text-xs tracking-[0.2em] uppercase hidden lg:inline"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              scroll down
            </span>
            <svg
              width="20" height="12" viewBox="0 0 20 12"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              className="animate-bounce hidden lg:block"
            >
              <polyline points="2,2 10,10 18,2" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
