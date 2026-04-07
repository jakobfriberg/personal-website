'use client';

import { useState } from 'react';

import SmokeFog from '@/app/(components)/gear/SmokeFog';

export default function SmokeSandbox() {
  const [opacity, setOpacity] = useState(1);
  const [blurScale, setBlurScale] = useState(1);
  const [speedScale, setSpeedScale] = useState(1);
  const [puffCount, setPuffCount] = useState(10);

  return (
    <div className="fixed inset-0 bg-main-grid">
      <SmokeFog
        key={puffCount}
        opacity={opacity}
        blurScale={blurScale}
        speedScale={speedScale}
        puffCount={puffCount}
      />

      {/* Controls panel */}
      <div
        className="fixed top-4 right-4 z-50 rounded-lg p-4 space-y-3"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          minWidth: 240,
        }}
      >
        <h2 className="text-white text-sm font-semibold mb-3">
          Smoke Controls
        </h2>

        <label className="block">
          <span className="text-white/70 text-xs">
            Opacity: {opacity.toFixed(2)}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full"
          />
        </label>

        <label className="block">
          <span className="text-white/70 text-xs">
            Blur scale: {blurScale.toFixed(2)}
          </span>
          <input
            type="range"
            min="0.3"
            max="3"
            step="0.1"
            value={blurScale}
            onChange={(e) => setBlurScale(Number(e.target.value))}
            className="w-full"
          />
        </label>

        <label className="block">
          <span className="text-white/70 text-xs">
            Speed: {speedScale.toFixed(2)}x
          </span>
          <input
            type="range"
            min="0.2"
            max="3"
            step="0.1"
            value={speedScale}
            onChange={(e) => setSpeedScale(Number(e.target.value))}
            className="w-full"
          />
        </label>

        <label className="block">
          <span className="text-white/70 text-xs">
            Puffs: {puffCount}
          </span>
          <input
            type="range"
            min="3"
            max="20"
            step="1"
            value={puffCount}
            onChange={(e) => setPuffCount(Number(e.target.value))}
            className="w-full"
          />
        </label>
      </div>
    </div>
  );
}
