'use client';

import { useCallback, useRef, useState } from 'react';

import { GEAR_CONFIG } from '@/app/config/gear';

export interface GearValues {
  lgTop: number;
  lgLeft: number;
  lgScale: number;
  gearRatio: number;
  smTop: number;
  smLeft: number;
  smScale: number;
}

export const GEAR_DEFAULTS: GearValues = {
  lgTop: GEAR_CONFIG.lgTop,
  lgLeft: GEAR_CONFIG.lgLeft,
  lgScale: GEAR_CONFIG.lgScale,
  smTop: GEAR_CONFIG.smTop,
  smLeft: GEAR_CONFIG.smLeft,
  smScale: GEAR_CONFIG.smScale,
  gearRatio: GEAR_CONFIG.gearRatio,
};

function Slider({
  label,
  value,
  unit,
  sensitivity,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  sensitivity: number;
  onChange: (v: number) => void;
}) {
  const dragging = useRef(false);
  const startX = useRef(0);
  const startVal = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      startX.current = e.clientX;
      startVal.current = value;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [value],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const delta = (e.clientX - startX.current) * sensitivity;
      onChange(Math.round((startVal.current + delta) * 100) / 100);
    },
    [onChange, sensitivity],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-xs text-white/50">{label}</span>
      <div
        className="flex-1 h-6 bg-white/10 rounded cursor-ew-resize flex items-center px-2 select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="text-xs text-white font-mono">
          {value}{unit}
        </span>
      </div>
    </div>
  );
}

export default function GearDebug({
  onChange,
}: {
  onChange: (values: GearValues) => void;
}) {
  const [pos, setPos] = useState(GEAR_DEFAULTS);

  const update = useCallback(
    (key: keyof GearValues, value: number) => {
      const next = { ...pos, [key]: value };
      setPos(next);
      onChange(next);
    },
    [pos, onChange],
  );

  const copyValues = () => {
    const text = [
      `lgTop: ${pos.lgTop},`,
      `lgLeft: ${pos.lgLeft},`,
      `lgScale: ${pos.lgScale},`,
      `smTop: ${pos.smTop},`,
      `smLeft: ${pos.smLeft},`,
      `smScale: ${pos.smScale},`,
    ].join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-64 rounded-lg bg-black/80 p-4 backdrop-blur text-white space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-white/70">Gear Positions</span>
        <button
          onClick={copyValues}
          className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded"
        >
          Copy
        </button>
      </div>

      <div className="text-[10px] text-white/40 mb-1">Large gear</div>
      <Slider label="top" value={pos.lgTop} unit="%" sensitivity={0.2} onChange={(v) => update('lgTop', v)} />
      <Slider label="left" value={pos.lgLeft} unit="%" sensitivity={0.2} onChange={(v) => update('lgLeft', v)} />
      <Slider label="scale" value={pos.lgScale} unit="x" sensitivity={0.005} onChange={(v) => update('lgScale', v)} />

      <div className="text-[10px] text-white/40 mt-2 mb-1">Small gear</div>
      <Slider label="top" value={pos.smTop} unit="%" sensitivity={0.2} onChange={(v) => update('smTop', v)} />
      <Slider label="left" value={pos.smLeft} unit="%" sensitivity={0.2} onChange={(v) => update('smLeft', v)} />
      <Slider label="scale" value={pos.smScale} unit="x" sensitivity={0.005} onChange={(v) => update('smScale', v)} />
    </div>
  );
}
