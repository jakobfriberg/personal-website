'use client';

import { useEffect, useRef } from 'react';

// ── Geometry constants (from SVG) ───────────────────────────────────
const GEAR_CENTER = { x: 179.5, y: 178.5 };
const CRANK_RADIUS = 63; // gear center → attached-hole

// At rest (gear angle 0), crank pin is at the TOP joint
const CRANK_REST = { x: 179.5, y: 115.5 };

// Wrist pin (bolt-piston) — where linkage meets the piston
const WRIST_REST = { x: 406, y: 116 };

// Connecting rod length (crank pin → wrist pin at rest)
const ROD_LENGTH = WRIST_REST.x - CRANK_REST.x; // ~316px

// Linkage anchor (bolt-gear position at rest)
const LINKAGE_ANCHOR = { x: 180, y: 116 };

// Piston slides along this fixed Y
const PISTON_Y = 116;

export default function MotorSvg({
  spinDuration,
}: {
  spinDuration: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    fetch('/gear-with-motor-bg.svg')
      .then((r) => r.text())
      .then((svgText) => {
        el.innerHTML = svgText;
        const svg = el.querySelector('svg');
        if (svg) {
          svg.style.width = '100%';
          svg.style.height = '100%';
        }

        const gear = el.querySelector('#small-gear-2') as SVGGElement | null;
        const linkage = el.querySelector('#linkage') as SVGGElement | null;
        const boltGear = el.querySelector('#bolt-gear') as SVGElement | null;
        const boltPiston = el.querySelector('#bolt-piston') as SVGElement | null;
        const piston = el.querySelector('#moving-piston > #piston') as SVGGElement | null;

        if (!gear || !linkage || !piston) return;

        const startTime = performance.now();

        const animate = (now: number) => {
          const elapsed = (now - startTime) / 1000;
          const gearAngleDeg = -(elapsed / spinDuration) * 360;
          const gearAngleRad = (gearAngleDeg * Math.PI) / 180;

          // 1. Rotate the gear
          gear.style.transformOrigin =
            `${GEAR_CENTER.x}px ${GEAR_CENTER.y}px`;
          gear.style.transform = `rotate(${gearAngleDeg}deg)`;

          // 2. Crank pin position (attached-hole traces a circle)
          const crankX =
            GEAR_CENTER.x + CRANK_RADIUS * Math.sin(gearAngleRad);
          const crankY =
            GEAR_CENTER.y - CRANK_RADIUS * Math.cos(gearAngleRad);

          // 3. Wrist pin X (piston constrained to Y = PISTON_Y)
          const dy = PISTON_Y - crankY;
          const wristX =
            crankX + Math.sqrt(ROD_LENGTH * ROD_LENGTH - dy * dy);
          const pistonDeltaX = wristX - WRIST_REST.x;

          // 4. Linkage angle
          const linkageAngleDeg =
            Math.atan2(dy, wristX - crankX) * (180 / Math.PI);

          // 5. Transform linkage: translate to crank, rotate to point at wrist
          const dx = crankX - LINKAGE_ANCHOR.x;
          const dyLink = crankY - LINKAGE_ANCHOR.y;
          linkage.style.transformOrigin =
            `${LINKAGE_ANCHOR.x}px ${LINKAGE_ANCHOR.y}px`;
          linkage.style.transform =
            `translate(${dx}px, ${dyLink}px) rotate(${linkageAngleDeg}deg)`;

          // 6. bolt-gear orbits with the crank but doesn't rotate itself
          if (boltGear) {
            boltGear.style.transform =
              `translate(${dx}px, ${dyLink}px)`;
          }

          // 7. bolt-piston slides X with piston
          if (boltPiston) {
            boltPiston.style.transform =
              `translateX(${pistonDeltaX}px)`;
          }

          // 7. Piston slides in X only
          piston.style.transform = `translateX(${pistonDeltaX}px)`;

          rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);
      });

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [spinDuration]);

  return (
    <div
      ref={containerRef}
      style={{ width: 866, height: 359 }}
    />
  );
}
