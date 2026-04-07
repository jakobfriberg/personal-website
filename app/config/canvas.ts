// Design viewport — the background canvas is rendered at this fixed size.
// Smaller screens clip the edges; larger screens show the grid fill.
export const DESIGN_VIEWPORT = { width: 1728, height: 900 };

// Background canvas offset for smaller screens (px).
// Shifts which part of the canvas is visible when clipped.
export const BG_CANVAS_OFFSET = { x: 250, y: 0 };
