'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react';

import { MASTER_VOLUME, SOUND_DEFAULTS } from '@/app/config/sound';

const STORAGE_KEY = 'sound-muted';

export interface SoundSettings {
  volume: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  speedVariance: number;
  fadeIn: boolean;
  fadeOut: boolean;
}

interface SoundContextValue {
  muted: boolean;
  toggleMute: () => void;
  masterVolume: number;
  setMasterVolume: (v: number) => void;
  getSettings: (id: string) => SoundSettings;
  setSettings: (id: string, settings: SoundSettings) => void;
  registry: Record<string, SoundSettings>;
}

const FALLBACK: SoundSettings = { volume: 1, trimStart: 0, trimEnd: 1, speed: 1, speedVariance: 0, fadeIn: false, fadeOut: false };

const SoundContext = createContext<SoundContextValue>({
  muted: false,
  toggleMute: () => {},
  masterVolume: 1,
  setMasterVolume: () => {},
  getSettings: () => FALLBACK,
  setSettings: () => {},
  registry: {},
});

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(MASTER_VOLUME);
  const [registry, setRegistry] = useState<Record<string, SoundSettings>>(SOUND_DEFAULTS);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setMuted(true);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const getSettings = useCallback(
    (id: string) => registry[id] ?? FALLBACK,
    [registry],
  );

  const setSettings = useCallback(
    (id: string, settings: SoundSettings) => {
      setRegistry((prev) => ({ ...prev, [id]: settings }));
    },
    [],
  );

  const value = useMemo(
    () => ({ muted, toggleMute, masterVolume, setMasterVolume, getSettings, setSettings, registry }),
    [muted, toggleMute, masterVolume, setMasterVolume, getSettings, setSettings, registry],
  );

  return (
    <SoundContext value={value}>
      {children}
    </SoundContext>
  );
}

export function useSoundContext() {
  return useContext(SoundContext);
}
