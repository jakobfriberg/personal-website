import * as planck from 'planck';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────

interface Vec2 {
  x: number;
  y: number;
}

interface RopeOptions {
  anchorX: number;       // px — attachment point X in SVG coords
  anchorY: number;       // px — attachment point Y in SVG coords
  segmentCount: number;  // number of chain links
  segmentLength: number; // px — length per segment
  noteOffset?: number;   // px — distance from handle bottom to note hole
}

// ── Constants ────────────────────────────────────────────────────────

// Box2D / Planck.js uses Y-up coords and meters.
// Our rope is ~339px ≈ 1.5m real life → ~226 px/m.
// Rendering: flip Y back to screen coords (Y-down).
const SCALE = 226;
const TIME_STEP = 1 / 60;
const VELOCITY_ITERATIONS = 8;
const POSITION_ITERATIONS = 3;

// Convert screen Y (down) to physics Y (up)
const toPhysX = (px: number) => px / SCALE;
const toPhysY = (px: number) => -px / SCALE;
const toScreenX = (m: number) => m * SCALE;
const toScreenY = (m: number) => -m * SCALE;

// ── Hook ─────────────────────────────────────────────────────────────

export function useVerletRope(options: RopeOptions) {
  const { anchorX, anchorY, segmentCount, segmentLength, noteOffset = 0 } = options;

  const worldRef = useRef<planck.World | null>(null);
  const bodiesRef = useRef<planck.Body[]>([]);
  const mouseJointRef = useRef<planck.Joint | null>(null);
  const groundRef = useRef<planck.Body | null>(null);
  const rafRef = useRef<number>(0);

  const [points, setPoints] = useState<Vec2[]>(() => {
    const pts: Vec2[] = [];
    for (let i = 0; i <= segmentCount; i++) {
      pts.push({ x: anchorX, y: anchorY + i * segmentLength });
    }
    return pts;
  });
  const [handleAngle, setHandleAngle] = useState(0);
  const [notePos, setNotePos] = useState<Vec2>({ x: anchorX, y: anchorY + segmentCount * segmentLength + noteOffset });
  const [noteAngle, setNoteAngle] = useState(0);
  const noteBodyRef = useRef<planck.Body | null>(null);

  // Build the physics world
  useEffect(() => {
    // Standard Box2D gravity: Y-up, -10 m/s²
    const world = planck.World({ gravity: planck.Vec2(0, -10) });
    worldRef.current = world;

    const segLen = segmentLength / SCALE;
    const ax = toPhysX(anchorX);
    const ay = toPhysY(anchorY);

    // Static anchor body
    const anchor = world.createBody({
      type: 'static',
      position: planck.Vec2(ax, ay),
    });
    groundRef.current = anchor;

    // Chain of dynamic bodies hanging downward (negative Y in physics)
    const bodies: planck.Body[] = [anchor];
    let prevBody = anchor;

    for (let i = 1; i <= segmentCount; i++) {
      const body = world.createBody({
        type: 'dynamic',
        position: planck.Vec2(ax, ay - i * segLen),
        linearDamping: 5.0,
        angularDamping: 4.0,
      });

      body.createFixture({
        shape: planck.Box(0.01, segLen / 2),
        density: i === segmentCount ? 500.0 : 5.0,
        friction: 0.2,
      });

      // Revolute joint at the connection point between segments
      const jointY = ay - (i - 0.5) * segLen;
      world.createJoint(
        planck.RevoluteJoint(
          { collideConnected: false },
          prevBody,
          body,
          planck.Vec2(ax, jointY),
        ),
      );

      // Rigid distance constraint — prevents stretching
      const pA = prevBody.getPosition();
      const pB = body.getPosition();
      world.createJoint(
        planck.DistanceJoint(
          { frequencyHz: 0, dampingRatio: 0, collideConnected: false },
          prevBody,
          body,
          planck.Vec2(pA.x, pA.y),
          planck.Vec2(pB.x, pB.y),
        ),
      );

      bodies.push(body);
      prevBody = body;
    }

    bodiesRef.current = bodies;

    // Note body — hangs from handle bottom
    if (noteOffset > 0) {
      const handle = bodies[bodies.length - 1];
      const handlePos = handle.getPosition();
      const handleBottomY = handlePos.y - (139 / SCALE); // handle is 139px tall, bottom in Y-up
      const noteOffsetM = noteOffset / SCALE;
      const jointY = handleBottomY - noteOffsetM;
      const noteCenterY = jointY - 0.15; // note center below the hole

      const note = world.createBody({
        type: 'dynamic',
        position: planck.Vec2(handlePos.x, noteCenterY),
        linearDamping: 2.0,
        angularDamping: 3.0,
      });

      note.createFixture({
        shape: planck.Box(0.15, 0.1),
        density: 0.5,
        friction: 0.2,
      });

      // Revolute joint at handle bottom / note hole
      world.createJoint(
        planck.RevoluteJoint(
          { collideConnected: false },
          handle,
          note,
          planck.Vec2(handlePos.x, jointY),
        ),
      );

      noteBodyRef.current = note;
    }

    // Simulation loop
    const step = () => {
      world.step(TIME_STEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);

      const pts: Vec2[] = bodies.map((b) => {
        const p = b.getPosition();
        return { x: toScreenX(p.x), y: toScreenY(p.y) };
      });
      setPoints(pts);
      // Planck Y-up: negate angle for screen coords
      setHandleAngle(-bodies[bodies.length - 1].getAngle());

      if (noteBodyRef.current) {
        const np = noteBodyRef.current.getPosition();
        setNotePos({ x: toScreenX(np.x), y: toScreenY(np.y) });
        setNoteAngle(-noteBodyRef.current.getAngle());
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafRef.current);
      worldRef.current = null;
      bodiesRef.current = [];
    };
  }, [anchorX, anchorY, segmentCount, segmentLength]);

  // Pull impulse — downward in physics = negative Y
  const pull = useCallback(() => {
    const bodies = bodiesRef.current;
    if (bodies.length === 0) return;
    const handle = bodies[bodies.length - 1];
    handle.applyLinearImpulse(
      planck.Vec2(0, -0.8),
      handle.getWorldCenter(),
      true,
    );
  }, []);

  // Small nudge for hover
  const nudge = useCallback(() => {
    const bodies = bodiesRef.current;
    if (bodies.length === 0) return;
    const handle = bodies[bodies.length - 1];
    handle.applyLinearImpulse(
      planck.Vec2(0, -0.25),
      handle.getWorldCenter(),
      true,
    );
  }, []);

  // Drag — attach a mouse joint to the handle
  const startDrag = useCallback(() => {
    const world = worldRef.current;
    const ground = groundRef.current;
    const bodies = bodiesRef.current;
    if (!world || !ground || bodies.length === 0) return;

    const handle = bodies[bodies.length - 1];
    const pos = handle.getPosition();

    const joint = world.createJoint(
      planck.MouseJoint(
        {
          maxForce: 200.0 * handle.getMass(),
          frequencyHz: 5.0,
          dampingRatio: 0.9,
        },
        ground,
        handle,
        planck.Vec2(pos.x, pos.y),
      ),
    );
    mouseJointRef.current = joint;
  }, []);

  const maxDragDist = segmentCount * segmentLength * 1.1; // screen px

  const moveDrag = useCallback((x: number, y: number) => {
    const joint = mouseJointRef.current;
    if (!joint) return;

    // Clamp distance from anchor in screen coords
    const dx = x - anchorX;
    const dy = y - anchorY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let cx = x;
    let cy = y;
    if (dist > maxDragDist) {
      cx = anchorX + (dx / dist) * maxDragDist;
      cy = anchorY + (dy / dist) * maxDragDist;
    }

    (joint as planck.MouseJoint).setTarget(
      planck.Vec2(toPhysX(cx), toPhysY(cy)),
    );
  }, [anchorX, anchorY, maxDragDist]);

  const endDrag = useCallback(() => {
    const world = worldRef.current;
    const joint = mouseJointRef.current;
    if (!world || !joint) return;
    world.destroyJoint(joint);
    mouseJointRef.current = null;
  }, []);

  return { points, handleAngle, notePos, noteAngle, pull, nudge, startDrag, moveDrag, endDrag };
}
