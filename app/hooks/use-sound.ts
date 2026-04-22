import { useCallback, useEffect, useRef } from 'react';

import { getSoundId } from '@/app/config/sound';
import { useSoundContext } from '@/app/context/sound-context';

const bufferCache = new Map<string, AudioBuffer>();
let sharedCtx: AudioContext | null = null;

// ── AudioContext unlock ────────────────────────────────────────────
// Mobile browsers require a user gesture to resume a suspended
// AudioContext. iOS Safari only honors `click`; other events
// (touchend, pointerup) leave the context permanently suspended.
const UNLOCK_EVENTS = ['click', 'keydown'] as const;

function removeUnlockListeners() {
  UNLOCK_EVENTS.forEach((e) =>
    document.removeEventListener(e, unlockAudioContext, true),
  );
}

export function unlockAudioContext() {
  if (sharedCtx?.state === 'running') {
    removeUnlockListeners();
    return;
  }

  if (!sharedCtx) sharedCtx = new AudioContext();

  // Play silent buffer (Howler.js pattern)
  const buf = sharedCtx.createBuffer(1, 1, 22050);
  const src = sharedCtx.createBufferSource();
  src.buffer = buf;
  src.connect(sharedCtx.destination);
  src.start(0);

  const ctx = sharedCtx;
  ctx.resume().then(() => {
    if (ctx.state === 'running') removeUnlockListeners();
  });
}

if (typeof window !== 'undefined') {
  UNLOCK_EVENTS.forEach((e) =>
    document.addEventListener(e, unlockAudioContext, true),
  );
}

function getAudioContext() {
  if (!sharedCtx) sharedCtx = new AudioContext();
  return sharedCtx;
}

export function useSound(src: string) {
  const { muted, masterVolume, getSettings } = useSoundContext();
  const bufferRef = useRef<AudioBuffer | null>(null);
  const id = getSoundId(src);

  useEffect(() => {
    const cached = bufferCache.get(src);
    if (cached) {
      bufferRef.current = cached;
      return;
    }

    fetch(src)
      .then((r) => r.arrayBuffer())
      .then((data) => new OfflineAudioContext(1, 1, 44100).decodeAudioData(data))
      .then((buffer) => {
        bufferCache.set(src, buffer);
        bufferRef.current = buffer;
      })
      .catch((err) => console.warn(`[sound] failed to load ${src}:`, err));
  }, [src]);

  const masterVolumeRef = useRef(masterVolume);
  masterVolumeRef.current = masterVolume;

  const settingsRef = useRef(getSettings(id));
  settingsRef.current = getSettings(id);

  return useCallback(() => {
    if (muted) return;
    if (!bufferRef.current) return;
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const { volume: relativeVolume, trimStart, trimEnd, speed, speedVariance, fadeIn, fadeOut } = settingsRef.current;
    const volume = relativeVolume * masterVolumeRef.current;
    const variance = speedVariance > 0
      ? Math.max(0.1, speed + (Math.random() * 2 - 1) * speedVariance)
      : speed;
    const fullBuffer = bufferRef.current;
    const offset = fullBuffer.duration * trimStart;
    const duration = Math.max(0, fullBuffer.duration * trimEnd - offset);
    const fadeDuration = Math.min(duration * 0.4, 0.5);

    const gain = ctx.createGain();
    const now = ctx.currentTime;

    if (fadeIn) {
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + fadeDuration);
    } else {
      gain.gain.setValueAtTime(volume, now);
    }

    if (fadeOut) {
      const fadeStart = now + duration / variance - fadeDuration;
      gain.gain.setValueAtTime(volume, fadeStart);
      gain.gain.linearRampToValueAtTime(0, fadeStart + fadeDuration);
    }

    gain.connect(ctx.destination);

    const source = ctx.createBufferSource();
    source.buffer = fullBuffer;
    source.playbackRate.value = variance;
    source.connect(gain);
    source.onended = () => gain.disconnect();
    source.start(0, offset, duration);
  }, [muted]);
}
