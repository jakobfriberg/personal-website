'use client';

import { useSoundContext, type SoundSettings } from '@/app/context/sound-context';
import { getSoundId, SOUNDS } from '@/app/config/sound';

import type { DebugTab } from './DebugPanel';

const SOUND_LIST = Object.entries(SOUNDS).map(([key, def]) => ({
  id: getSoundId(def.src),
  label: key,
}));

function SoundSlider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const display = format ? format(value) : `${Math.round(value * 100)}%`;
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-xs text-white/50">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-white"
      />
      <span className="w-10 text-xs text-white font-mono text-right">
        {display}
      </span>
    </div>
  );
}

function SoundGroup({ id, label }: { id: string; label: string }) {
  const { getSettings, setSettings } = useSoundContext();
  const settings = getSettings(id);

  const update = (partial: Partial<SoundSettings>) => {
    setSettings(id, { ...settings, ...partial });
  };

  return (
    <div>
      <div className="text-[10px] text-white/40 mt-2 mb-1">{label}</div>
      <SoundSlider
        label="vol"
        value={settings.volume}
        onChange={(v) => update({ volume: v })}
      />
      <SoundSlider
        label="start"
        value={settings.trimStart}
        onChange={(v) => update({ trimStart: Math.min(v, settings.trimEnd) })}
      />
      <SoundSlider
        label="end"
        value={settings.trimEnd}
        onChange={(v) => update({ trimEnd: Math.max(v, settings.trimStart) })}
      />
      <SoundSlider
        label="speed"
        value={settings.speed}
        min={0.25}
        max={3}
        step={0.05}
        format={(v) => `${v.toFixed(2)}x`}
        onChange={(v) => update({ speed: v })}
      />
      <SoundSlider
        label="vary"
        value={settings.speedVariance}
        min={0}
        max={0.5}
        step={0.01}
        format={(v) => `±${Math.round(v * 100)}%`}
        onChange={(v) => update({ speedVariance: v })}
      />
      <div className="flex items-center gap-4 mt-1">
        <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.fadeIn}
            onChange={(e) => update({ fadeIn: e.target.checked })}
            className="accent-white"
          />
          fade in
        </label>
        <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.fadeOut}
            onChange={(e) => update({ fadeOut: e.target.checked })}
            className="accent-white"
          />
          fade out
        </label>
      </div>
    </div>
  );
}

function MasterVolume() {
  const { masterVolume, setMasterVolume } = useSoundContext();
  return (
    <div>
      <div className="text-[10px] text-white/40 mb-1">master</div>
      <SoundSlider
        label="vol"
        value={masterVolume}
        onChange={setMasterVolume}
      />
    </div>
  );
}

export function useSoundDebugTab(): DebugTab {
  return {
    label: 'Sound',
    content: (
      <>
        <MasterVolume />
        {SOUND_LIST.map((s) => (
          <SoundGroup key={s.id} id={s.id} label={s.label} />
        ))}
      </>
    ),
  };
}
