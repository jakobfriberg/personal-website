import * as planck from 'planck';

/*
 * Planck.js uses Y-up meters; our SVG uses Y-down pixels.
 * SCALE converts between the two (~226 px/m, so a 480px rope ≈ 2.1m).
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface RopeOptions {
  anchorX: number;
  anchorY: number;
  segmentCount: number;
  segmentLength: number;
  noteOffset?: number;
  handleWidth?: number;
  handleHeight?: number;
  initialOffsetX?: number;
}

// ── Simulation ──────────────────────────────────────────────────────

export const SCALE = 226;
export const TIME_STEP = 1 / 60;
export const VELOCITY_ITERATIONS = 8;
export const POSITION_ITERATIONS = 3;

// ── Physics tuning ──────────────────────────────────────────────────

export const GRAVITY = -10;
export const ROPE_LINEAR_DAMPING = 1.5;
export const ROPE_ANGULAR_DAMPING = 2.0;
export const ROPE_SEGMENT_DENSITY = 5.0;
export const HANDLE_DENSITY = 21.0;
export const THREAD_LINEAR_DAMPING = 3.0;
export const THREAD_ANGULAR_DAMPING = 3.0;
export const NOTE_LINEAR_DAMPING = 2.0;
export const NOTE_ANGULAR_DAMPING = 3.0;
export const NOTE_DENSITY = 0.5;
export const FIXTURE_FRICTION = 0.2;

export const NOTE_HALF_W = 0.15;
export const NOTE_HALF_H = 0.1;
export const NOTE_OFFSET_Y = -0.22;
export const NOTE_TILT = -0.5;

// ── Impulses ────────────────────────────────────────────────────────

export const PULL_IMPULSE = -3.6;
export const NUDGE_IMPULSE = -0.25;
export const SWING_IN_TORQUE = 20;
export const SWING_IN_LIFT = 30;

// ── Visual ──────────────────────────────────────────────────────────

export const THREAD_SPREAD = 4;

// ── Drag ────────────────────────────────────────────────────────────

export const DRAG_MAX_FORCE_MULT = 200.0;
export const DRAG_FREQUENCY_HZ = 5.0;
export const DRAG_DAMPING_RATIO = 0.9;
export const DRAG_REACH_MULT = 1.1;

// ── Coordinate conversion ───────────────────────────────────────────

export const toPhysX = (px: number) => px / SCALE;
export const toPhysY = (px: number) => -px / SCALE;
export const toScreenX = (m: number) => m * SCALE;
export const toScreenY = (m: number) => -m * SCALE;

export const toScreen = (p: planck.Vec2): Vec2 => ({
  x: toScreenX(p.x),
  y: toScreenY(p.y),
});

// ── Helpers ─────────────────────────────────────────────────────────

export function perpendicular(dx: number, dy: number) {
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { nx: -dy / len, ny: dx / len };
}
