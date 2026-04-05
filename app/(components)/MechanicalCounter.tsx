'use client';

import { useMemo } from 'react';

import { GEAR_CONFIG } from '@/app/config/gear';

// ── Character set ──────────────────────────────────────────────────
// All unique characters from the 9 card titles, sorted.
// Space first so blank slots scroll to position 0.
const CHAR_SET = [
  ' ',
  ...'0123456789ABCDEGHIKLMNORSTUOW'.split('').filter(
    (c, i, a) => a.indexOf(c) === i,
  ),
];
const CHAR_INDEX = new Map(CHAR_SET.map((c, i) => [c, i]));

const CHAR_HEIGHT = 40; // px — height of one character cell
const CHAR_WIDTH = 24;  // px — fixed width per slot
const TITLE_SLOTS = 12; // longest title: "WHAT I BUILD"

// Match the full card stack width: 420px card + 8 offsets * 20px spread on each side
const COUNTER_WIDTH = 420;

// ── CharacterSlot ──────────────────────────────────────────────────

function CharacterSlot({
  char,
  isFirst,
}: {
  char: string;
  isFirst?: boolean;
}) {
  const index = CHAR_INDEX.get(char) ?? 0;

  return (
    <div
      className={`overflow-hidden${isFirst ? '' : ' border-l border-white/8'}`}
      style={{ height: CHAR_HEIGHT, width: CHAR_WIDTH }}
    >
      <div
        style={{
          transform: `translateY(-${index * CHAR_HEIGHT}px)`,
          transition: `transform ${GEAR_CONFIG.transitionDuration}s ${GEAR_CONFIG.transitionEasing}`,
        }}
      >
        {CHAR_SET.map((c) => (
          <div
            key={c}
            className="flex items-center justify-center font-mono text-white text-xl font-semibold select-none"
            style={{ height: CHAR_HEIGHT }}
          >
            {c === ' ' ? '\u00A0' : c}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MechanicalCounter ──────────────────────────────────────────────

export default function MechanicalCounter({
  index,
  title,
}: {
  index: number;
  title: string;
}) {
  const numberChar = useMemo(() => `${index + 1}`, [index]);
  const paddedTitle = useMemo(
    () => title.toUpperCase().padEnd(TITLE_SLOTS, ' ').slice(0, TITLE_SLOTS),
    [title],
  );

  return (
    <div
      className="flex items-center rounded-t-xl border-2 border-white px-4 py-3"
      style={{
        backgroundColor: '#2E3134',
        width: COUNTER_WIDTH,
        boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
      }}
    >
      {/* Character slots: number + dot separator + title */}
      {/* Number slot */}
      <div
        className="relative flex shrink-0 items-center overflow-hidden rounded-md"
        style={{ background: '#2E3134' }}
      >
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-md"
          style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.25), inset 0 -1px 2px rgba(0,0,0,0.08)' }}
        />
        <CharacterSlot char={numberChar} isFirst />
      </div>

      <span className="font-mono text-white/50 text-xl font-semibold select-none shrink-0 mx-1">
        .
      </span>

      {/* Title slots */}
      <div
        className="relative flex items-center overflow-hidden rounded-md"
        style={{ background: '#2E3134' }}
      >
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-md"
          style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.25), inset 0 -1px 2px rgba(0,0,0,0.08)' }}
        />
        {paddedTitle.split('').map((char, i) => (
          <CharacterSlot key={i} char={char} isFirst={i === 0} />
        ))}
      </div>

    </div>
  );
}
