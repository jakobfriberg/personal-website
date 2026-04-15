'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';

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
      e.currentTarget.setPointerCapture(e.pointerId);
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

  const onLostPointerCapture = useCallback(() => {
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
        onLostPointerCapture={onLostPointerCapture}
      >
        <span className="text-xs text-white font-mono">
          {value}{unit}
        </span>
      </div>
    </div>
  );
}

export interface SliderDef {
  key: string;
  label: string;
  unit: string;
  sensitivity: number;
}

export interface DebugGroup {
  title: string;
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  sliders: SliderDef[];
}

export interface DebugTab {
  label: string;
  content: ReactNode;
}

export default function DebugPanel({
  groups,
  onCopy,
  tabs,
}: {
  groups: DebugGroup[];
  onCopy?: () => void;
  tabs?: DebugTab[];
}) {
  const [activeTab, setActiveTab] = useState(0);
  const allTabs: DebugTab[] = [
    {
      label: 'Gear',
      content: (
        <>
          {groups.map((group) => (
            <div key={group.title}>
              <div className="text-[10px] text-white/40 mt-2 mb-1">
                {group.title}
              </div>
              {group.sliders.map((s) => (
                <Slider
                  key={s.key}
                  label={s.label}
                  value={group.values[s.key]}
                  unit={s.unit}
                  sensitivity={s.sensitivity}
                  onChange={(v) => {
                    group.onChange({ ...group.values, [s.key]: v });
                  }}
                />
              ))}
            </div>
          ))}
        </>
      ),
    },
    ...(tabs ?? []),
  ];

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      return;
    }
    const text = groups
      .flatMap((g) =>
        g.sliders.map((s) => `${s.key}: ${g.values[s.key]},`),
      )
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-64 rounded-lg bg-black/80 p-4 backdrop-blur text-white space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          {allTabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`text-[10px] px-2 py-0.5 rounded ${
                activeTab === i
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === 0 && (
          <button
            onClick={handleCopy}
            className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded"
          >
            Copy
          </button>
        )}
      </div>

      {allTabs[activeTab].content}
    </div>
  );
}

// Common slider presets
export const posSliders = (prefix: string): SliderDef[] => [
  { key: `${prefix}Top`, label: 'top', unit: '%', sensitivity: 0.2 },
  { key: `${prefix}Left`, label: 'left', unit: '%', sensitivity: 0.2 },
  { key: `${prefix}Scale`, label: 'scale', unit: 'x', sensitivity: 0.005 },
];

export const tpsSliders: SliderDef[] = [
  { key: 'top', label: 'top', unit: '%', sensitivity: 0.2 },
  { key: 'left', label: 'left', unit: '%', sensitivity: 0.2 },
  { key: 'scale', label: 'scale', unit: 'x', sensitivity: 0.005 },
];
