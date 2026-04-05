'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useVerletRope } from '@/app/hooks/use-verlet-rope';

const SEGMENT_COUNT = 8;
const SEGMENT_LENGTH = 42;   // ~339px total rope
const HANDLE_WIDTH = 33;
const HANDLE_HEIGHT = 139;
const SVG_WIDTH = 140;        // extra width for swing room
const ROPE_LENGTH = SEGMENT_COUNT * SEGMENT_LENGTH;
const NOTE_OFFSET = 21;       // px from handle bottom to note hole
const SVG_HEIGHT = ROPE_LENGTH + HANDLE_HEIGHT + NOTE_OFFSET + 160;

const ANCHOR_X = SVG_WIDTH / 2;
const ANCHOR_Y = 0;

// How far the handle must be pulled down to trigger navigation
const PULL_THRESHOLD = 40;

// How far up to hide the lever (rope + handle fully above)
const HIDE_OFFSET = ROPE_LENGTH + HANDLE_HEIGHT + NOTE_OFFSET + 200;

export default function PullLever({
  direction,
  onClick,
  disabled = false,
  hidden = false,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
}) {
  const [revealed, setRevealed] = useState(!hidden);

  useEffect(() => {
    if (!hidden && !revealed) {
      setTimeout(() => setRevealed(true), 50);
    }
  }, [hidden, revealed]);
  const draggingRef = useRef(false);
  const didMoveRef = useRef(false);
  const dragStartYRef = useRef(0);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const {
    points, handleAngle, notePos, noteAngle,
    pull, nudge, startDrag, moveDrag, endDrag,
  } = useVerletRope({
    anchorX: ANCHOR_X,
    anchorY: ANCHOR_Y,
    segmentCount: SEGMENT_COUNT,
    segmentLength: SEGMENT_LENGTH,
    noteOffset: NOTE_OFFSET,
  });

  const toLocal = useCallback(
    (e: React.PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      draggingRef.current = true;
      didMoveRef.current = false;
      dragStartYRef.current = points[points.length - 1].y;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [disabled, points],
  );

  const DRAG_THRESHOLD = 5;

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;
      if (!didMoveRef.current && dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;

      const local = toLocal(e);
      if (!didMoveRef.current) {
        didMoveRef.current = true;
        startDrag();
      }
      moveDrag(local.x, local.y);
    },
    [toLocal, startDrag, moveDrag],
  );

  const handlePointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    const wasDrag = didMoveRef.current;

    if (wasDrag) {
      const lastY = points[points.length - 1].y;
      const pullDistance = lastY - dragStartYRef.current;
      endDrag();
      if (pullDistance > PULL_THRESHOLD) {
        onClick();
      }
    } else {
      pull();
      onClick();
    }
  }, [points, endDrag, pull, onClick]);

  const handleMouseEnter = useCallback(() => {
    if (disabled || draggingRef.current) return;
    nudge();
  }, [disabled, nudge]);

  // Last particle = handle attachment
  const lastPoint = points[points.length - 1];

  const handleAngleDeg = handleAngle * (180 / Math.PI);
  // Handle bottom = where note thread attaches
  const handleBottomX = lastPoint.x + Math.sin(handleAngle) * HANDLE_HEIGHT;
  const handleBottomY = lastPoint.y + Math.cos(handleAngle) * HANDLE_HEIGHT;

  // Rope: two parallel lines for band look
  const ROPE_WIDTH = 3;
  const leftPoints: string[] = [];
  const rightPoints: string[] = [];

  for (let i = 0; i < points.length; i++) {
    const next = points[Math.min(i + 1, points.length - 1)];
    const prev = points[Math.max(i - 1, 0)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    leftPoints.push(`${points[i].x + nx * ROPE_WIDTH},${points[i].y + ny * ROPE_WIDTH}`);
    rightPoints.push(`${points[i].x - nx * ROPE_WIDTH},${points[i].y - ny * ROPE_WIDTH}`);
  }

  // Note angle in degrees
  const noteAngleDeg = noteAngle * (180 / Math.PI);

  // Label text
  const label = direction === 'prev' ? 'Prev' : 'Next';

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
      className={`relative pointer-events-none overflow-visible ${disabled && revealed ? 'opacity-30' : ''}`}
      style={{
        width: HANDLE_WIDTH,
        height: SVG_HEIGHT,
        transform: revealed ? 'translateY(0)' : `translateY(-${HIDE_OFFSET}px)`,
        transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <svg
        ref={svgRef}
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
        className="absolute top-0 left-0"
        style={{ left: -(SVG_WIDTH - HANDLE_WIDTH) / 2 }}
      >
        {/* Rope — two parallel edges */}
        <polyline
          points={leftPoints.join(' ')}
          stroke="white"
          strokeWidth="2"
          fill="none"
          pointerEvents="none"
        />
        <polyline
          points={rightPoints.join(' ')}
          stroke="white"
          strokeWidth="2"
          fill="none"
          pointerEvents="none"
        />

        {/* Thread from handle bottom to note hole — two lines for V-shape through hole */}
        <path
          d={`M${handleBottomX},${handleBottomY} L${notePos.x - 1},${notePos.y}`}
          stroke="white"
          strokeWidth="1"
          fill="none"
          pointerEvents="none"
        />
        <path
          d={`M${handleBottomX + 4},${handleBottomY} L${notePos.x + 2},${notePos.y}`}
          stroke="white"
          strokeWidth="1"
          fill="none"
          pointerEvents="none"
        />

        {/* Note — positioned at note physics body, paths re-origined to hole center (53.83, 501.23) */}
        <g transform={`translate(${notePos.x}, ${notePos.y}) rotate(${noteAngleDeg})`}>
          {/* Note body */}
          <path
            d="M25.97 24.69C34.73 38.29 47.13 60.29 47.18 60.39C47.07 60.43 29.59 66.43 19.41 71.74C9.19 77.07 -5.39 87.72 -5.39 87.72C-5.45 87.62 -17.52 66.14 -26.06 52.86C-34.63 39.55 -49.8 18.79 -49.8 18.79L2.23 -9.38C2.23 -9.38 17.19 11.06 25.97 24.69ZM2.46 -0.0C2.71 -1.35 1.81 -2.66 0.45 -2.91C-0.91 -3.16 -2.21 -2.26 -2.46 -0.9C-2.71 0.46 -1.81 1.76 -0.45 2.01C0.9 2.26 2.21 1.36 2.46 -0.0Z"
            fill="#35383B"
            stroke="white"
            strokeWidth="1"
          />
          {/* Note text — exact paths from SVG, re-origined */}
          <path
            d="M-0.19 26.55L-11.2 33.64L-12.03 32.34L-7.25 20.78L-7.32 20.67L-15.96 26.24L-16.82 24.91L-5.82 17.82L-5.0 19.11L-9.77 30.71L-9.7 30.81L-1.04 25.23L-0.19 26.55ZM-7.53 39.7C-8.05 38.9 -8.31 38.1 -8.33 37.3C-8.35 36.5 -8.14 35.74 -7.7 35.02C-7.27 34.3 -6.62 33.67 -5.78 33.12C-4.93 32.58 -4.09 32.25 -3.25 32.15C-2.4 32.04 -1.61 32.15 -0.89 32.47C-0.17 32.8 0.43 33.33 0.91 34.07C1.19 34.5 1.39 34.97 1.52 35.49C1.65 36.0 1.66 36.53 1.56 37.08C1.46 37.63 1.22 38.18 0.82 38.72C0.43 39.26 -0.15 39.78 -0.93 40.28L-1.46 40.62L-5.56 34.26L-4.47 33.56L-1.2 38.63C-0.73 38.33 -0.38 37.97 -0.13 37.55C0.11 37.13 0.23 36.68 0.23 36.21C0.22 35.73 0.07 35.27 -0.22 34.81C-0.55 34.3 -0.96 33.95 -1.44 33.74C-1.93 33.53 -2.43 33.46 -2.96 33.52C-3.48 33.58 -3.97 33.76 -4.42 34.05L-5.15 34.52C-5.78 34.92 -6.24 35.37 -6.53 35.86C-6.82 36.36 -6.95 36.87 -6.93 37.4C-6.9 37.93 -6.73 38.46 -6.4 38.97C-6.18 39.3 -5.94 39.57 -5.67 39.78C-5.4 39.99 -5.11 40.13 -4.79 40.21C-4.47 40.28 -4.13 40.28 -3.78 40.2L-3.33 41.65C-3.83 41.79 -4.33 41.8 -4.85 41.7C-5.35 41.6 -5.84 41.38 -6.3 41.04C-6.76 40.71 -7.17 40.26 -7.53 39.7ZM4.8 40.34L2.7 44.49L7.35 44.3L8.29 45.76L2.45 45.75L0.04 51.08L-0.9 49.62L1.02 45.57L-3.45 45.66L-4.39 44.2L1.42 44.16L3.86 38.88L4.8 40.34ZM11.77 51.16L10.7 51.85L7.94 47.57L9.01 46.88L11.77 51.16ZM11.8 46.85L12.61 48.12L4.75 53.19C4.39 53.42 4.15 53.65 4.04 53.87C3.93 54.09 3.9 54.3 3.95 54.5C4.0 54.71 4.08 54.9 4.2 55.09C4.29 55.23 4.37 55.34 4.45 55.42C4.52 55.5 4.58 55.56 4.63 55.61L3.66 56.6C3.57 56.53 3.46 56.43 3.33 56.3C3.19 56.17 3.05 55.99 2.9 55.75C2.67 55.39 2.52 54.99 2.45 54.55C2.38 54.11 2.44 53.68 2.61 53.25C2.78 52.82 3.1 52.45 3.58 52.14L11.8 46.85Z"
            fill="white"
          />
        </g>

        {/* Handle — positioned at last particle, interactive */}
        <g
          transform={`translate(${lastPoint.x}, ${lastPoint.y}) rotate(${handleAngleDeg}) translate(${-HANDLE_WIDTH / 2}, 0)`}
          onPointerDown={handlePointerDown}
          onMouseEnter={handleMouseEnter}
          className="pointer-events-auto cursor-grab active:cursor-grabbing"
        >
          <rect
            width={HANDLE_WIDTH}
            height={HANDLE_HEIGHT}
            fill="#35383B"
            stroke="white"
            strokeWidth="2"
            rx="16"
          />
        </g>
      </svg>
    </div>
  );
}
