// Exact tooth count ratio — independent of visual scaling
const TOOTH_RATIO = 53 / 15; // ≈ 3.5333...

export const DEBUG = true;

export const GEAR_CONFIG = {
  // Large gear position & scale
  lgTop: -24.4,
  lgLeft: -15.13,
  lgScale: 1.43,

  // Small gear position & scale
  smTop: 12.32,
  smLeft: 28.76,
  smScale: 0.93,

  // Rotation
  gearRatio: TOOTH_RATIO,
  degreesPerCard: 30,
  transitionDuration: 1.0,
  transitionEasing: 'linear',

  // Thingy path progress — fraction (0-1) along movement-path per card index
  thingyProgress: [0.43, 0.41, 0.38, 0.34, 0.30, 0.25, 0.19, 0.12, 0] as readonly number[],
  thingyTransitionDuration: 1.0,
  thingyTransitionEasing: 'linear',
} as const;

export type GearConfig = typeof GEAR_CONFIG;

export const THINGY_DEFAULTS = { top: 50.6, left: 1.92, scale: 0.87 };
export const BG_GEAR_DEFAULTS = { top: 20, left: -20, scale: 2.0 };
export const MOTOR_DEFAULTS = { top: 67.72, left: 41.71, scale: 1.34 };
