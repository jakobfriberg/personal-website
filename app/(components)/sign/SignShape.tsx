'use client';

// ── Config ──────────────────────────────────────────────────────────
const FRAME_GAP = 8;
const OUTER_RADIUS = 40;
const INNER_RADIUS = 34;
const SHADOW_PAD = 30; // extra space around sign for drop shadow

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
  const svgW = width + SHADOW_PAD * 2;
  const svgH = height + SHADOW_PAD * 2;

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
        <filter id="sign-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="4" dy="6" stdDeviation="8"
            floodColor="#000000" floodOpacity="0.5"
          />
        </filter>
      </defs>

      <g filter="url(#sign-shadow)">
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
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontWeight={800}
          fontSize={fontSize}
          letterSpacing="0.06em"
        >
          JAKOB ECK FRIBERG
        </text>
      </g>
    </svg>
  );
}
