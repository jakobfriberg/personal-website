'use client';

import { useCallback, useEffect, useRef } from 'react';

import { GEAR_CONFIG } from '@/app/config/gear';

export default function ThingySvg({
  trackProgress,
}: {
  trackProgress: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const totalLengthRef = useRef(0);
  const knobCenterRef = useRef({ x: 0, y: 0 });
  const trackRef = useRef<SVGGElement | null>(null);
  const knobRef = useRef<SVGGElement | null>(null);
  const progressRef = useRef(trackProgress);
  progressRef.current = trackProgress;

  const applyPosition = useCallback((progress: number, animate = true) => {
    const path = pathRef.current;
    const track = trackRef.current;
    const knob = knobRef.current;
    if (!path || !track || !knob) return;

    const point = path.getPointAtLength(
      progress * totalLengthRef.current,
    );

    const center = knobCenterRef.current;
    const dx = point.x - center.x;
    const dy = point.y - center.y;

    const transform = `translate(${dx}px, ${dy}px)`;
    const transition = animate
      ? `transform ${GEAR_CONFIG.thingyTransitionDuration}s ${GEAR_CONFIG.thingyTransitionEasing}`
      : 'none';

    track.style.transform = transform;
    track.style.transition = transition;
    knob.style.transform = transform;
    knob.style.transition = transition;
  }, []);

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

        const path = el.querySelector('#movement-path') as SVGPathElement | null;
        const track = el.querySelector('#track-2') as SVGGElement | null;
        const knob = el.querySelector('#knob') as SVGGElement | null;

        if (!path || !track || !knob) return;

        pathRef.current = path;
        trackRef.current = track;
        knobRef.current = knob;
        totalLengthRef.current = path.getTotalLength();
        // Knob center — this is the point we want to place on the path
        const knobBBox = knob.getBBox();
        knobCenterRef.current = {
          x: knobBBox.x + knobBBox.width / 2,
          y: knobBBox.y + knobBBox.height / 2,
        };

        // Hide the movement path
        path.style.display = 'none';

        // Apply initial position instantly (no transition)
        applyPosition(progressRef.current, false);
      });
  }, [applyPosition]);

  useEffect(() => {
    applyPosition(trackProgress);
  }, [trackProgress, applyPosition]);

  return (
    <div
      ref={containerRef}
      style={{ width: 981, height: 601 }}
    />
  );
}
