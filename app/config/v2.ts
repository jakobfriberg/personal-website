export const DEBUG_V2 = true;

export const V2_CONFIG = {
  // Left gear
  leftTop: 52.48,
  leftLeft: 32.96,
  leftScale: 1.14,

  // Right gear (mirrored)
  rightTop: 52.48,
  rightLeft: 67.04,
  rightScale: 1.14,

  // Rotation
  degreesPerCard: 30,
  transitionDuration: 1.0,
  transitionEasing: 'linear',
} as const;
