export const SMOKE_CONFIG = {
  puffCount: 30,
  opacity: 1,
  blurScale: 1,
  speedScale: 1,
  color: 'rgba(100, 105, 115, 0.4)',
  // Puff size range
  sizeBase: 200,
  sizeVariation: 80,
  // Blur range (px)
  blurBase: 60,
  blurVariation: 30,
  // Travel duration range (seconds)
  durationBase: 14,
  durationVariation: 4,
  // How far puffs drift (vw/vh)
  xDriftBase: -50,
  xDriftVariation: 25,
  yDriftBase: -70,
  yDriftVariation: 20,
  // How much puffs grow
  scaleEnd: 2.5,
  scaleVariation: 0.8,
  // Emission origin (bottom-right area, %)
  originRight: -10,
  originBottom: 25,
  originSpread: 15,
};
