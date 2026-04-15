'use client';

import { useEffect, useRef } from 'react';

import { GEAR_CONFIG } from '@/app/config/gear';

// ── Geometry constants (from SVG) ───────────────────────────────────
const GEAR_CENTER = { x: 180, y: 178 };
const CRANK_RADIUS = 64; // gear center → attached-hole

// At rest (gear angle 0), crank pin is to the RIGHT of gear center
const CRANK_REST = { x: 244, y: 178 };

// Wrist pin (bolt-piston) — where linkage meets the piston
const WRIST_REST = { x: 470, y: 178 };

// Connecting rod length (crank pin → wrist pin at rest)
const ROD_LENGTH = WRIST_REST.x - CRANK_REST.x; // ~226px

// Linkage anchor (bolt-gear position at rest)
const LINKAGE_ANCHOR = { x: 244, y: 178 };

// Piston slides along this fixed Y
const PISTON_Y = 178;

export default function MotorSvg({
  spinDuration,
  bgGearRef,
}: {
  spinDuration: number;
  bgGearRef?: React.RefObject<HTMLImageElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    fetch('/images/gear-with-motor-bg.svg')
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
        const bgSpinDuration = GEAR_CONFIG.bgSpinDuration;
        const bgPhaseOffset = GEAR_CONFIG.bgGearPhaseOffset;

        const animate = (now: number) => {
          const elapsed = (now - startTime) / 1000;

          // Motor gear angle (small, fast)
          const gearAngleDeg = -(elapsed / spinDuration) * 360;
          const gearAngleRad = (gearAngleDeg * Math.PI) / 180;

          // BG gear angle (large, slow) — same time source, derived
          const bgGearAngleDeg =
            (elapsed / bgSpinDuration) * 360 + bgPhaseOffset;

          // 1. Rotate the motor gear
          gear.style.transformOrigin =
            `${GEAR_CENTER.x}px ${GEAR_CENTER.y}px`;
          gear.style.transform = `rotate(${gearAngleDeg}deg)`;

          // 2. Rotate the BG gear from the same clock
          if (bgGearRef?.current) {
            bgGearRef.current.style.transform =
              `rotate(${bgGearAngleDeg}deg)`;
          }

          // 3. Crank pin position (attached-hole traces a circle)
          const crankX =
            GEAR_CENTER.x + CRANK_RADIUS * Math.sin(gearAngleRad);
          const crankY =
            GEAR_CENTER.y - CRANK_RADIUS * Math.cos(gearAngleRad);

          // 4. Wrist pin X (piston constrained to Y = PISTON_Y)
          const dy = PISTON_Y - crankY;
          const wristX =
            crankX + Math.sqrt(ROD_LENGTH * ROD_LENGTH - dy * dy);
          const pistonDeltaX = wristX - WRIST_REST.x;

          // 5. Linkage angle
          const linkageAngleDeg =
            Math.atan2(dy, wristX - crankX) * (180 / Math.PI);

          // 6. Transform linkage: translate to crank, rotate to point at wrist
          const dx = crankX - LINKAGE_ANCHOR.x;
          const dyLink = crankY - LINKAGE_ANCHOR.y;
          linkage.style.transformOrigin =
            `${LINKAGE_ANCHOR.x}px ${LINKAGE_ANCHOR.y}px`;
          linkage.style.transform =
            `translate(${dx}px, ${dyLink}px) rotate(${linkageAngleDeg}deg)`;

          // 7. bolt-gear orbits with the crank but doesn't rotate itself
          if (boltGear) {
            boltGear.style.transform =
              `translate(${dx}px, ${dyLink}px)`;
          }

          // 8. bolt-piston slides X with piston
          if (boltPiston) {
            boltPiston.style.transform =
              `translateX(${pistonDeltaX}px)`;
          }

          // 9. Piston slides in X only
          piston.style.transform = `translateX(${pistonDeltaX}px)`;

          rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);
      });

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [spinDuration, bgGearRef]);

  return (
    <div
      ref={containerRef}
      style={{ width: 866, height: 359 }}
    />
  );
}
