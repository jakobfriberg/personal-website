'use client';

import { motion } from 'framer-motion';

import { ArrowUpRight } from 'lucide-react';

import { GEAR_CONFIG } from '@/app/config/gear';
import { CARDS, type CardData } from '@/app/data/cards';
import Button from '@/app/(components)/ui/Button';

export { CARDS, type CardData };

// ── Config ──────────────────────────────────────────────────────────

const CARD_SPREAD = 20;        // px between stacked cards
const SCALE_STEP = 0.03;       // scale reduction per stack level

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
      className="w-[420px] rounded-xl border-2 border-white p-12 flex flex-col"
      style={{
        backgroundColor: '#2E3134',
        height: 380,
      }}
    >
      {isActive && (
        <>
          <p className="text-white/90 text-xl leading-relaxed whitespace-pre-line overflow-y-auto min-h-0">
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
}: {
  activeIndex: number;
}) {

  return (
    <div className="relative flex items-center justify-center" style={{ height: 380 }}>
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
  );
}
