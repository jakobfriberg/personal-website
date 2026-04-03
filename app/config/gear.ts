// Exact tooth count ratio — independent of visual scaling
const TOOTH_RATIO = 53 / 15; // ≈ 3.5333...

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
  transitionDuration: 2.0,
  transitionEasing: 'ease',
} as const;

export type GearConfig = typeof GEAR_CONFIG;
