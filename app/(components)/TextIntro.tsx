'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

import SignShape from './sign/SignShape';

// ── Config ──────────────────────────────────────────────────────────
const CONFIG = {
  fadeAt: 800,
  doneAt: 1600,
};

const SIGN_FONT_SIZE = 52;
const SIGN_PADDING_Y = 40;
const SIGN_WIDTH = 720;
const SIGN_HEIGHT = SIGN_FONT_SIZE + SIGN_PADDING_Y * 2;

type Phase = 'idle' | 'fading';

// ── Main component ──────────────────────────────────────────────────

interface TextIntroProps {
  onComplete: () => void;
}

export default function TextIntro({ onComplete }: TextIntroProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const hasInteracted = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const triggerFade = useCallback(() => {
    if (hasInteracted.current) return;
    hasInteracted.current = true;

    timersRef.current = [
      setTimeout(() => setPhase('fading'), CONFIG.fadeAt),
      setTimeout(() => onComplete(), CONFIG.doneAt),
    ];
  }, [onComplete]);

  useEffect(() => {
    const handler = () => triggerFade();
    const events = ['click', 'wheel', 'keydown', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, handler));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, [triggerFade]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-main-grid flex items-center justify-center"
      animate={{ opacity: phase === 'fading' ? 0 : 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      {/* Gradient fade vignette — edges only */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: [
            'linear-gradient(to right, #35383B, transparent 20%, transparent 80%, #35383B)',
            'linear-gradient(to bottom, #35383B, transparent 20%, transparent 80%, #35383B)',
          ].join(', '),
        }}
      />

      {/* Centered sign — scaled up */}
      <div className="relative z-10" style={{ transform: 'scale(1.8)' }}>
        <SignShape
          width={SIGN_WIDTH}
          height={SIGN_HEIGHT}
          fontSize={SIGN_FONT_SIZE}
        />
      </div>
    </motion.div>
  );
}
