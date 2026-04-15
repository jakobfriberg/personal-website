'use client';

import { useRef, useState } from 'react';

import { motion } from 'framer-motion';

import { ArrowUpRight } from 'lucide-react';

import { GEAR_CONFIG } from '@/app/config/gear';
import { CARDS, type CardData } from '@/app/data/cards';
import Button from '@/app/(components)/ui/Button';

export { CARDS, type CardData };

// ── Config ──────────────────────────────────────────────────────────

const CARD_SPREAD = 20;        // px between stacked cards
const SCALE_STEP = 0.03;       // scale reduction per stack level
const SWIPE_THRESHOLD = 50;    // min raw finger px to register a swipe
// Asymptotic drag limit — visual drag approaches this value but never
// reaches it: dragX = MAX_DRAG * (raw / (|raw| + MAX_DRAG)).
// Note: SWIPE_THRESHOLD is checked against the raw finger offset,
// not the damped visual offset, so it remains reachable.
const MAX_DRAG = CARD_SPREAD;

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
      className="w-full max-w-[420px] rounded-xl border-2 border-white p-10 md:p-12 flex flex-col h-[380px]"
      style={{ backgroundColor: '#2E3134' }}
    >
      {isActive && (
        <>
          <p className="text-white/90 text-lg md:text-xl leading-relaxed whitespace-pre-line overflow-y-auto min-h-0">
            {card.content}
          </p>
          {card.link && (
            <Button
              href={card.link.url}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              size="md"
              className="mt-auto shrink-0 self-start"
            >
              {card.link.label}
              <ArrowUpRight size={18} />
            </Button>
          )}
        </>
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
  onPrev?: () => void;
  onNext?: () => void;
}) {
  // Ref so the transition switches before React re-renders
  const isDraggingRef = useRef(false);
  const [dragX, setDragX] = useState(0);

  return (
    <motion.div
      className="relative flex items-center justify-center h-[380px] touch-pan-y"
      onPan={(_e, info) => {
        isDraggingRef.current = true;
        const raw = info.offset.x;
        setDragX(MAX_DRAG * (raw / (Math.abs(raw) + MAX_DRAG)));
      }}
      onPanEnd={(_e, info) => {
        // Switch to animated transition BEFORE the state update triggers a render
        isDraggingRef.current = false;
        setDragX(0);
        if (Math.abs(info.offset.x) >= SWIPE_THRESHOLD) {
          if (info.offset.x > 0) onPrev?.();
          else onNext?.();
        }
      }}
    >
      {CARDS.map((card, i) => {
        const transform = getCardTransform(i, activeIndex);

        return (
          <motion.div
            key={card.id}
            className="absolute origin-top w-full max-w-[420px]"
            animate={{
              x: transform.x + dragX,
              scale: transform.scale,
              zIndex: transform.zIndex,
            }}
            transition={isDraggingRef.current
              ? { type: 'tween', duration: 0 }
              : {
                type: 'tween',
                duration: GEAR_CONFIG.transitionDuration,
                ease: GEAR_CONFIG.transitionEasing,
              }
            }
          >
            <Card card={card} isActive={i === activeIndex} />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
