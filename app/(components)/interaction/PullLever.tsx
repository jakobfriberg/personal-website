'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useVerletRope } from '@/app/hooks/use-verlet-rope';

const SEGMENT_COUNT = 8;
const SEGMENT_LENGTH = 60;   // ~480px total rope
const HANDLE_WIDTH = 50;
const HANDLE_HEIGHT = 210;
const SVG_WIDTH = 210;        // extra width for swing room
const ROPE_LENGTH = SEGMENT_COUNT * SEGMENT_LENGTH;
const NOTE_OFFSET = 10;       // px from handle bottom to note hole
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
    points, handleAngle, threadLeftPoints: tLeft, threadRightPoints: tRight,
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

  // Last particle = handle top (body position)
  const lastPoint = points[points.length - 1];
  const handleAngleDeg = handleAngle * (180 / Math.PI);

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

  // Thread lines from physics
  const threadLeftStr = tLeft.map(p => `${p.x},${p.y}`).join(' ');
  const threadRightStr = tRight.map(p => `${p.x},${p.y}`).join(' ');

  // Note angle in degrees
  const noteAngleDeg = noteAngle * (180 / Math.PI);

  const muted = disabled && revealed;
  const strokeColor = muted ? 'rgba(255,255,255,0.12)' : 'white';

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

        {/* Thread behind note — left side of loop */}
        <polyline
          points={threadLeftStr}
          stroke={strokeColor}
          strokeWidth="1"
          fill="none"
          pointerEvents="none"
        />

        {/* Note — positioned at hole center, referencing external SVG */}
        <image
          href={direction === 'next' ? '/note-next.svg' : '/note-back.svg'}
          x={notePos.x - (direction === 'next' ? 33 : 35)}
          y={notePos.y - 10}
          width={66}
          height={66}
          transform={`rotate(${noteAngleDeg}, ${notePos.x}, ${notePos.y})`}
          pointerEvents="none"
          opacity={muted ? 0.12 : 1}
        />

        {/* Thread in front of note — right side of loop */}
        <polyline
          points={threadRightStr}
          stroke={strokeColor}
          strokeWidth="1"
          fill="none"
          pointerEvents="none"
        />


        {/* Handle — positioned at top, interactive */}
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
            stroke={strokeColor}
            strokeWidth="2"
            rx="16"
          />
        </g>
      </svg>
    </div>
  );
}
