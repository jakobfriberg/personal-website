'use client';

import { useEffect, useId, useState } from 'react';

// ── Config ──────────────────────────────────────────────────────────
const FRAME_GAP = 8;
const OUTER_RADIUS = 40;
const INNER_RADIUS = 34;
const SHADOW_PAD = 30; // extra space around sign for drop shadow

// ── Stroke-trace config ─────────────────────────────────────────────
const SIGN_TEXT = 'JAKOB ECK FRIBERG';
const SIGN_CHARS = SIGN_TEXT.split('');
const CHAR_ADVANCE_RATIO = 0.6; // JetBrains Mono monospace advance / em
const LETTER_SPACING_EM = 0.06;
const DASH_ARRAY = 500;
const TRACE_DURATION = 1.7; // seconds per character
const TRACE_STAGGER_WINDOW = 1.0; // random delay spread in seconds

function computeDelays(): (number | null)[] {
  const nonSpaceIndices = SIGN_CHARS
    .map((c, i) => (c !== ' ' ? i : null))
    .filter((i): i is number => i !== null);

  const shuffled = [...nonSpaceIndices];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const result = new Array<number | null>(SIGN_CHARS.length).fill(null);
  shuffled.forEach((originalIdx, position) => {
    result[originalIdx] =
      (position / (nonSpaceIndices.length - 1)) * TRACE_STAGGER_WINDOW;
  });
  return result;
}

interface SignShapeProps {
  width: number;
  height: number;
  fontSize: number;
  className?: string;
}

export default function SignShape({
  width,
  height,
  fontSize,
  className,
}: SignShapeProps) {
  const filterId = `sign-shadow-${useId()}`;
  const svgW = width + SHADOW_PAD * 2;
  const svgH = height + SHADOW_PAD * 2;

  const [delays, setDelays] = useState<(number | null)[] | null>(null);
  useEffect(() => { setDelays(computeDelays()); }, []);

  const nominalAdvance = fontSize * CHAR_ADVANCE_RATIO;
  const letterSpacingPx = fontSize * LETTER_SPACING_EM;
  const charStep = nominalAdvance + letterSpacingPx;
  const totalWidth =
    SIGN_CHARS.length * nominalAdvance +
    (SIGN_CHARS.length - 1) * letterSpacingPx;
  const startX = width / 2 - totalWidth / 2;

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`${-SHADOW_PAD} ${-SHADOW_PAD} ${svgW} ${svgH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="4" dy="6" stdDeviation="8"
            floodColor="#000000" floodOpacity="0.5"
          />
        </filter>
      </defs>

      <g filter={`url(#${filterId})`}>
        {/* Outer frame */}
        <rect
          width={width}
          height={height}
          rx={OUTER_RADIUS}
          ry={OUTER_RADIUS}
          fill="#35383B"
          stroke="#ffffff"
          strokeWidth="2"
        />
        {/* Inner frame */}
        <rect
          x={FRAME_GAP}
          y={FRAME_GAP}
          width={width - FRAME_GAP * 2}
          height={height - FRAME_GAP * 2}
          rx={INNER_RADIUS}
          ry={INNER_RADIUS}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
        />
        {SIGN_CHARS.map((char, i) => {
          const x = startX + i * charStep;
          const isSpace = char === ' ';
          const delay = delays?.[i] ?? null;

          return (
            <text
              key={i}
              x={x}
              y={height / 2}
              textAnchor="start"
              dominantBaseline="central"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              fontFamily="var(--font-jetbrains-mono), monospace"
              fontWeight={800}
              fontSize={fontSize}
              style={
                !isSpace && delay !== null
                  ? {
                      strokeDasharray: DASH_ARRAY,
                      strokeDashoffset: DASH_ARRAY,
                      animation: `stroke-trace ${TRACE_DURATION}s ease-in ${delay}s forwards`,
                    }
                  : undefined
              }
            >
              {char}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
