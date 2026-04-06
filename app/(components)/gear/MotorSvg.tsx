'use client';

import { useEffect, useRef } from 'react';

const GEAR_CENTER = { x: 179.5, y: 178.5 };

export default function MotorSvg({
  spinDuration,
}: {
  spinDuration: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    fetch('/gear-with-motor.svg')
      .then((r) => r.text())
      .then((svgText) => {
        el.innerHTML = svgText;
        const svg = el.querySelector('svg');
        if (svg) {
          svg.style.width = '100%';
          svg.style.height = '100%';
        }

        const gear = el.querySelector('#motor-gear') as SVGGElement | null;
        if (gear) {
          gear.style.transformOrigin =
            `${GEAR_CENTER.x}px ${GEAR_CENTER.y}px`;
          gear.style.animation =
            `slow-spin-reverse ${spinDuration}s linear infinite`;
        }
      });
  }, [spinDuration]);

  return (
    <div
      ref={containerRef}
      style={{ width: 866, height: 359 }}
    />
  );
}
