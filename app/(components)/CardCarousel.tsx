'use client';

import { motion } from 'framer-motion';

import { GEAR_CONFIG } from '@/app/config/gear';

// ── Config ──────────────────────────────────────────────────────────

const CARD_SPREAD = 20;        // px between stacked cards
const SCALE_STEP = 0.03;       // scale reduction per stack level

export interface CardData {
  id: number;
  title: string;
  content: string;
}

export const CARDS: CardData[] = [
  {
    id: 0,
    title: 'Who I am',
    content:
      "Hey, I'm Jakob. I work at the intersection of product, " +
      "engineering, and AI.\n" +
      "I like working on problems where the problem is clear, " +
      "but the solution isn't.",
  },
  {
    id: 1,
    title: 'What I do',
    content:
      'I help turn ideas, data, and messy processes into working ' +
      'software: a new product feature, an API, a data pipeline, ' +
      'an internal tool.\n' +
      'It usually starts with figuring out what the right thing ' +
      'to build is.',
  },
  {
    id: 2,
    title: 'How I think',
    content:
      'I think from the perspective of the user, the business, ' +
      'and the technology at the same time.\n' +
      'Most good solutions come from understanding how those ' +
      'three fit together.',
  },
  {
    id: 3,
    title: 'What I build',
    content:
      "I've worked in both small and large organizations, " +
      'including Swish, SJ, PostNord, and 3M, often on early ' +
      'projects and new initiatives where things are still ' +
      'being figured out.',
  },
  {
    id: 4,
    title: 'How I work',
    content:
      'In the beginning of a project, learning is more important ' +
      'than optimizing.\n' +
      'I focus on understanding the problem, talking to users, ' +
      'and building prototypes to see what works.\n' +
      'I enjoy working with designers, product people, engineers, ' +
      'and real users to shape the product.\n' +
      "I like going from vague idea \u2192 first working version " +
      "\u2192 real product.",
  },
  {
    id: 5,
    title: 'What matters',
    content:
      'I care about building things that are actually useful ' +
      'and that feel good to use.\n' +
      "Product value isn't only in solving the functional need, " +
      'but also the emotional one.\n' +
      "That's where delight lives.",
  },
  {
    id: 6,
    title: 'Tech',
    content:
      "I'm fairly tech-agnostic and have worked with most things " +
      'thrown at me: Python, TypeScript, FastAPI, Next.js, ' +
      'Postgres, Supabase, GCP, and some Kubernetes.\n' +
      'The tech is usually the easy part. Deciding what to ' +
      'build is not.',
  },
  {
    id: 7,
    title: 'Background',
    content:
      'I started in materials science, which led me into data ' +
      'and analytics, and later into product development and AI.\n' +
      "One thing led to another. I've always just followed " +
      'interesting technology.',
  },
  {
    id: 8,
    title: 'Contact',
    content:
      "If you're building something and need someone who can " +
      'move between product, engineering, and AI, feel free ' +
      'to reach out.',
  },
];

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
      className="w-[420px] rounded-xl border-2 border-white p-12"
      style={{
        backgroundColor: '#2E3134',
        minHeight: 480,
      }}
    >
      {isActive && (
        <p className="text-white/90 text-xl leading-relaxed whitespace-pre-line">
          {card.content}
        </p>
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
  );
}
