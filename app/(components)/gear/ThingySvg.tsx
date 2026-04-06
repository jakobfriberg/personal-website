'use client';

import { useEffect, useRef } from 'react';

import { GEAR_CONFIG } from '@/app/config/gear';

const KNOB_CENTER = { x: 427.5, y: 249 };

export default function ThingySvg({
  trackRotation,
}: {
  trackRotation: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    fetch('/thingy.svg')
      .then((r) => r.text())
      .then((svgText) => {
        el.innerHTML = svgText;
        const svg = el.querySelector('svg');
        if (svg) {
          svg.style.width = '100%';
          svg.style.height = '100%';
        }
      });
  }, []);

  useEffect(() => {
    const track = containerRef.current?.querySelector('#track-2');
    if (!track) return;
    const s = (track as SVGGElement).style;
    s.transformOrigin = `${KNOB_CENTER.x}px ${KNOB_CENTER.y}px`;
    s.transform = `rotate(${trackRotation}deg)`;
    s.transition = `transform ${GEAR_CONFIG.thingyTransitionDuration}s ${GEAR_CONFIG.thingyTransitionEasing}`;
  }, [trackRotation]);

  return (
    <div
      ref={containerRef}
      style={{ width: 981, height: 601 }}
    />
  );
}
