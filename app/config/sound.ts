import type { SoundSettings } from '@/app/context/sound-context';

export function getSoundId(src: string): string {
  return src.split('/').pop()?.replace(/\.[^.]+$/, '') ?? src;
}

export interface SoundDef {
  src: string;
  settings: SoundSettings;
}

export const MASTER_VOLUME = 0.25;

export const SOUNDS = {
  cardSwitch: {
    src: '/sounds/el-click.mp3',
    settings: { volume: 0.65, trimStart: 0.1, trimEnd: 1, speed: 1.0, speedVariance: 0.04, fadeIn: false, fadeOut: false },
  },
  cardSwitchBack: {
    src: '/sounds/el-click-back.mp3',
    settings: { volume: 0.65, trimStart: 0, trimEnd: 1, speed: 1.2, speedVariance: 0.04, fadeIn: false, fadeOut: false },
  },
  mechWhirr: {
    src: '/sounds/el-whirr-3.mp3',
    settings: { volume: 0.8, trimStart: 0, trimEnd: 1, speed: 1.0, speedVariance: 0.0, fadeIn: false, fadeOut: true },
  },
  largeGear: {
    src: '/sounds/el-large-gear-2.mp3',
    settings: { volume: 0.4, trimStart: 0, trimEnd: 1, speed: 1.0, speedVariance: 0.04, fadeIn: false, fadeOut: false },
  },
  buttonTap: {
    src: '/sounds/button-tap.mp3',
    settings: { volume: 0.4, trimStart: 0, trimEnd: 1, speed: 1.0, speedVariance: 0, fadeIn: false, fadeOut: false },
  },
} satisfies Record<string, SoundDef>;

export const SOUND_DEFAULTS: Record<string, SoundSettings> =
  Object.fromEntries(
    Object.values(SOUNDS).map((s) => {
      const id = getSoundId(s.src);
      return [id, s.settings];
    }),
  );
