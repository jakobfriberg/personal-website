'use client';

import { motion } from 'framer-motion';

import { GEAR_CONFIG } from '@/app/config/gear';

// ── Config ──────────────────────────────────────────────────────────

const CARD_SPREAD = 20;        // px between stacked cards
const SCALE_STEP = 0.03;       // scale reduction per stack level

interface CardData {
  id: number;
  title: string;
  content: string;
}

const CARDS: CardData[] = Array.from({ length: 9 }, (_, i) => ({
  id: i,
  title: `Card ${i + 1}`,
  content:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do ' +
    'eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad ' +
    'minim veniam, quis nostrud exercitation ullamco laboris nisi ut ' +
    'aliquip ex ea commodo consequat.\n\n' +
    'Duis aute irure dolor in reprehenderit in voluptate velit esse ' +
    'cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat ' +
    'cupidatat non proident, sunt in culpa qui officia deserunt mollit ' +
    'anim id est laborum.',
}));

// ── Card positioning ────────────────────────────────────────────────

function getCardTransform(index: number, activeIndex: number) {
  const offset = index - activeIndex;
  const absOffset = Math.abs(offset);

  return {
    x: offset * CARD_SPREAD,
    scale: 1 - absOffset * SCALE_STEP,
    zIndex: 10 - absOffset,
  };
}

// ── Components ──────────────────────────────────────────────────────

function Card({ card, isActive }: { card: CardData; isActive: boolean }) {
  return (
    <div
      className="w-[420px] rounded-xl border border-white/20 p-8"
      style={{
        backgroundColor: '#2E3134',
        minHeight: 480,
      }}
    >
      {isActive && (
        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line">
          {card.content}
        </p>
      )}
    </div>
  );
}

export default function CardCarousel({
  activeIndex,
  onPrev,
  onNext,
}: {
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
}) {

  return (
    <div className="relative z-10 flex flex-col items-center gap-8">
      {/* Navigation — placeholder for future mechanical counter */}
      <div className="flex items-center gap-4">
        <button
          onClick={onPrev}
          disabled={activeIndex === 0}
          className="rounded-lg border border-white/20 px-4 py-2 text-white/80
                     hover:bg-white/10 disabled:opacity-30 transition-colors"
        >
          &larr;
        </button>
        <span className="text-white/60 font-mono text-sm tabular-nums">
          {activeIndex + 1} / {CARDS.length}
        </span>
        <button
          onClick={onNext}
          disabled={activeIndex === CARDS.length - 1}
          className="rounded-lg border border-white/20 px-4 py-2 text-white/80
                     hover:bg-white/10 disabled:opacity-30 transition-colors"
        >
          &rarr;
        </button>
      </div>

      {/* Card stack */}
      <div className="relative flex items-center justify-center" style={{ height: 480 }}>
        {CARDS.map((card, i) => {
          const transform = getCardTransform(i, activeIndex);

          return (
            <motion.div
              key={card.id}
              className="absolute origin-top"
              animate={{
                x: transform.x,
                scale: transform.scale,
                zIndex: transform.zIndex,
              }}
              transition={{
                type: 'tween',
                duration: GEAR_CONFIG.transitionDuration,
                ease: GEAR_CONFIG.transitionEasing,
              }}
            >
              <Card card={card} isActive={i === activeIndex} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
