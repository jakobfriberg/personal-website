'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { perpendicular, useVerletRope } from '@/app/hooks/rope';

// ── Layout ──────────────────────────────────────────────────────────
const SEGMENT_COUNT = 8;
const SEGMENT_LENGTH = 60;
const HANDLE_WIDTH = 50;
const HANDLE_HEIGHT = 210;
const SVG_WIDTH = 210;
const ROPE_LENGTH = SEGMENT_COUNT * SEGMENT_LENGTH;
const NOTE_OFFSET = 10;
const SVG_HEIGHT = ROPE_LENGTH + HANDLE_HEIGHT + NOTE_OFFSET + 160;
const ANCHOR_X = SVG_WIDTH / 2;
const ANCHOR_Y = 0;

// ── Interaction ─────────────────────────────────────────────────────
const PULL_THRESHOLD = 40;
const DRAG_THRESHOLD_PX = 5;
const HIDE_OFFSET = ROPE_LENGTH + HANDLE_HEIGHT + NOTE_OFFSET + 200;
const SWING_IN_OFFSET = 400;

// ── Visual ──────────────────────────────────────────────────────────
const ROPE_VISUAL_WIDTH = 3;
const NOTE_SIZE = 66;
const NOTE_CENTER_X_NEXT = 33;
const NOTE_CENTER_X_PREV = 35;
const NOTE_CENTER_Y = 10;
const HANDLE_FILL = '#35383B';
const HANDLE_CORNER_RADIUS = 16;
const MUTED_OPACITY = 0.12;
const REVEAL_DURATION = '1.2s';
const REVEAL_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

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
  const initialOffsetRef = useRef<number | null>(null);

  if (initialOffsetRef.current === null && !hidden) {
    initialOffsetRef.current = direction === 'prev' ? -SWING_IN_OFFSET : SWING_IN_OFFSET;
  }

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
    points, handleAngle, threadLeftPoints, threadRightPoints,
    notePos, noteAngle,
    pull, nudge, startDrag, moveDrag, endDrag,
  } = useVerletRope({
    anchorX: ANCHOR_X,
    anchorY: ANCHOR_Y,
    segmentCount: SEGMENT_COUNT,
    segmentLength: SEGMENT_LENGTH,
    noteOffset: NOTE_OFFSET,
    handleWidth: HANDLE_WIDTH,
    handleHeight: HANDLE_HEIGHT,
    initialOffsetX: initialOffsetRef.current ?? 0,
  });

  // Track points via ref so callbacks don't rebuild every physics frame
  const pointsRef = useRef(points);
  pointsRef.current = points;

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
      const pts = pointsRef.current;
      dragStartYRef.current = pts[pts.length - 1].y;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [disabled],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;
      if (!didMoveRef.current && dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;

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
      const pts = pointsRef.current;
      const lastY = pts[pts.length - 1].y;
      const pullDistance = lastY - dragStartYRef.current;
      endDrag();
      if (pullDistance > PULL_THRESHOLD) {
        onClick();
      }
    } else {
      pull();
      onClick();
    }
  }, [endDrag, pull, onClick]);

  const handleMouseEnter = useCallback(() => {
    if (disabled || draggingRef.current) return;
    nudge();
  }, [disabled, nudge]);

  const lastPoint = points[points.length - 1];
  const handleAngleDeg = handleAngle * (180 / Math.PI);

  const leftPoints: string[] = [];
  const rightPoints: string[] = [];

  for (let i = 0; i < points.length; i++) {
    const next = points[Math.min(i + 1, points.length - 1)];
    const prev = points[Math.max(i - 1, 0)];
    const { nx, ny } = perpendicular(next.x - prev.x, next.y - prev.y);
    leftPoints.push(`${points[i].x + nx * ROPE_VISUAL_WIDTH},${points[i].y + ny * ROPE_VISUAL_WIDTH}`);
    rightPoints.push(`${points[i].x - nx * ROPE_VISUAL_WIDTH},${points[i].y - ny * ROPE_VISUAL_WIDTH}`);
  }

  const threadLeftStr = threadLeftPoints.map(p => `${p.x},${p.y}`).join(' ');
  const threadRightStr = threadRightPoints.map(p => `${p.x},${p.y}`).join(' ');
  const noteAngleDeg = noteAngle * (180 / Math.PI);

  const muted = disabled && revealed;
  const strokeColor = muted ? `rgba(255,255,255,${MUTED_OPACITY})` : 'white';

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
      className="relative pointer-events-none overflow-visible"
      style={{
        width: HANDLE_WIDTH,
        height: SVG_HEIGHT,
        transform: revealed ? 'translateY(0)' : `translateY(-${HIDE_OFFSET}px)`,
        transition: `transform ${REVEAL_DURATION} ${REVEAL_EASING}`,
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
        <polyline
          points={leftPoints.join(' ')}
          stroke={strokeColor}
          strokeWidth="2"
          fill="none"
          pointerEvents="none"
        />
        <polyline
          points={rightPoints.join(' ')}
          stroke={strokeColor}
          strokeWidth="2"
          fill="none"
          pointerEvents="none"
        />

        {/* Thread left — renders behind note (z-order) */}
        <polyline
          points={threadLeftStr}
          stroke={strokeColor}
          strokeWidth="1"
          fill="none"
          pointerEvents="none"
        />

        <image
          href={direction === 'next' ? '/images/note-next.svg' : '/images/note-back.svg'}
          x={notePos.x - (direction === 'next' ? NOTE_CENTER_X_NEXT : NOTE_CENTER_X_PREV)}
          y={notePos.y - NOTE_CENTER_Y}
          width={NOTE_SIZE}
          height={NOTE_SIZE}
          transform={`rotate(${noteAngleDeg}, ${notePos.x}, ${notePos.y})`}
          pointerEvents="none"
          opacity={muted ? MUTED_OPACITY : 1}
        />

        {/* Thread right — renders in front of note (z-order) */}
        <polyline
          points={threadRightStr}
          stroke={strokeColor}
          strokeWidth="1"
          fill="none"
          pointerEvents="none"
        />

        <g
          transform={`translate(${lastPoint.x}, ${lastPoint.y}) rotate(${handleAngleDeg}) translate(${-HANDLE_WIDTH / 2}, 0)`}
          onPointerDown={handlePointerDown}
          onMouseEnter={handleMouseEnter}
          className="pointer-events-auto cursor-grab active:cursor-grabbing"
        >
          <rect
            width={HANDLE_WIDTH}
            height={HANDLE_HEIGHT}
            fill={HANDLE_FILL}
            stroke={strokeColor}
            strokeWidth="2"
            rx={HANDLE_CORNER_RADIUS}
          />
        </g>
      </svg>
    </div>
  );
}
