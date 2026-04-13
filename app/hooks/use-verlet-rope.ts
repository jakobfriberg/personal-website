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
  handleWidth?: number;  // px — visual handle width
  handleHeight?: number; // px — visual handle height
  initialOffsetX?: number; // px — horizontal displacement for swing-in
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
  const {
    anchorX, anchorY, segmentCount, segmentLength,
    noteOffset = 0, handleWidth = 0, handleHeight = 0,
    initialOffsetX = 0,
  } = options;

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
  const [threadLeftPoints, setThreadLeftPoints] = useState<Vec2[]>([]);
  const [threadRightPoints, setThreadRightPoints] = useState<Vec2[]>([]);
  const [notePos, setNotePos] = useState<Vec2>({ x: anchorX, y: anchorY + segmentCount * segmentLength + handleHeight + noteOffset });
  const [noteAngle, setNoteAngle] = useState(0);
  const threadLeftRef = useRef<planck.Body[]>([]);
  const threadRightRef = useRef<planck.Body[]>([]);
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

    const handleHeightM = handleHeight / SCALE;
    const handleWidthM = handleWidth / SCALE;

    for (let i = 1; i <= segmentCount; i++) {
      const isHandle = i === segmentCount;
      const body = world.createBody({
        type: 'dynamic',
        position: planck.Vec2(ax, ay - i * segLen),
        linearDamping: 1.5,
        angularDamping: 2.0,
      });

      if (isHandle) {
        // Handle: full-sized box offset downward from body position
        body.createFixture({
          shape: planck.Box(
            handleWidthM / 2,
            handleHeightM / 2,
            planck.Vec2(0, -handleHeightM / 2),
            0,
          ),
          density: 21.0,
          friction: 0.2,
        });
      } else {
        body.createFixture({
          shape: planck.Box(0.01, segLen / 2),
          density: 5.0,
          friction: 0.2,
        });
      }

      // Same joint pattern for all segments
      const jointY = ay - (i - 0.5) * segLen;
      world.createJoint(
        planck.RevoluteJoint(
          { collideConnected: false },
          prevBody,
          body,
          planck.Vec2(ax, jointY),
        ),
      );

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

    // Thread + note — single chain, visual loop computed in rendering
    if (noteOffset > 0) {
      const handle = bodies[bodies.length - 1];
      const handlePos = handle.getPosition();
      const handleBottomY = handlePos.y - handleHeightM;
      const threadLen = noteOffset / SCALE;

      // Thread body
      const threadBody = world.createBody({
        type: 'dynamic',
        position: planck.Vec2(ax, handleBottomY - threadLen),
        linearDamping: 3.0,
        angularDamping: 3.0,
      });
      threadBody.createFixture({
        shape: planck.Box(0.01, threadLen / 2),
        density: 1.0,
        friction: 0.2,
      });
      world.createJoint(
        planck.RevoluteJoint(
          { collideConnected: false },
          handle,
          threadBody,
          planck.Vec2(ax, handleBottomY),
        ),
      );
      world.createJoint(
        planck.DistanceJoint(
          { frequencyHz: 0, dampingRatio: 0, collideConnected: false },
          handle,
          threadBody,
          planck.Vec2(ax, handleBottomY),
          planck.Vec2(ax, handleBottomY - threadLen),
        ),
      );

      // Note body
      const threadBottomY = handleBottomY - threadLen;
      const noteBody = world.createBody({
        type: 'dynamic',
        position: planck.Vec2(ax, threadBottomY - 0.05),
        linearDamping: 2.0,
        angularDamping: 3.0,
      });
      noteBody.createFixture({
        shape: planck.Box(0.15, 0.1, planck.Vec2(0, -0.22), -0.5),
        density: 0.5,
        friction: 0.2,
      });
      world.createJoint(
        planck.RevoluteJoint(
          { collideConnected: false },
          threadBody,
          noteBody,
          planck.Vec2(ax, threadBottomY),
        ),
      );

      threadLeftRef.current = [threadBody];
      threadRightRef.current = [threadBody];
      noteBodyRef.current = noteBody;
    }

    // Displace dynamic bodies for swing-in effect (joints stay correct)
    if (initialOffsetX !== 0) {
      const offM = initialOffsetX / SCALE;
      for (let i = 1; i < bodies.length; i++) {
        const t = i / segmentCount;
        const pos = bodies[i].getPosition();
        bodies[i].setTransform(
          planck.Vec2(pos.x + offM * t, pos.y),
          bodies[i].getAngle(),
        );
      }
      // Thread + note bodies too
      for (const b of [...threadLeftRef.current, ...(noteBodyRef.current ? [noteBodyRef.current] : [])]) {
        const pos = b.getPosition();
        b.setTransform(planck.Vec2(pos.x + offM, pos.y), b.getAngle());
      }
      // Give the handle a twist and upward kick as it swings in
      const handle = bodies[bodies.length - 1];
      const torqueDir = initialOffsetX > 0 ? -1 : 1;
      handle.applyAngularImpulse(torqueDir * 20);
      handle.applyLinearImpulse(
        planck.Vec2(0, 30),
        handle.getWorldCenter(),
        true,
      );
    }

    // Simulation loop
    const step = () => {
      world.step(TIME_STEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);

      const pts: Vec2[] = bodies.map((b) => {
        const p = b.getPosition();
        return { x: toScreenX(p.x), y: toScreenY(p.y) };
      });
      setPoints(pts);
      setHandleAngle(-bodies[bodies.length - 1].getAngle());

      const handle = bodies[bodies.length - 1];
      const hBottom = handle.getWorldPoint(planck.Vec2(0, -handleHeightM));
      const hBottomScreen = { x: toScreenX(hBottom.x), y: toScreenY(hBottom.y) };

      // Note hole position from physics
      let noteHoleScreen = hBottomScreen;
      if (noteBodyRef.current) {
        const hole = noteBodyRef.current.getWorldPoint(planck.Vec2(0, 0));
        noteHoleScreen = { x: toScreenX(hole.x), y: toScreenY(hole.y) };
      }

      // Compute visual loop: same start/end, spread in middle
      const THREAD_SPREAD = 4; // px
      if (threadLeftRef.current.length > 0) {
        const midBodies = threadLeftRef.current.map((b) => {
          const p = b.getPosition();
          return { x: toScreenX(p.x), y: toScreenY(p.y) };
        });
        // Perpendicular offset at each mid point
        const dx = noteHoleScreen.x - hBottomScreen.x;
        const dy = noteHoleScreen.y - hBottomScreen.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;

        setThreadLeftPoints([
          hBottomScreen,
          ...midBodies.map(p => ({ x: p.x + nx * THREAD_SPREAD, y: p.y + ny * THREAD_SPREAD })),
          noteHoleScreen,
        ]);
        setThreadRightPoints([
          hBottomScreen,
          ...midBodies.map(p => ({ x: p.x - nx * THREAD_SPREAD, y: p.y - ny * THREAD_SPREAD })),
          noteHoleScreen,
        ]);
      }
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
      threadLeftRef.current = [];
      threadRightRef.current = [];
      noteBodyRef.current = null;
    };
  }, [anchorX, anchorY, segmentCount, segmentLength, noteOffset, handleWidth, handleHeight, initialOffsetX]);

  // Pull impulse — downward in physics = negative Y
  const pull = useCallback(() => {
    const bodies = bodiesRef.current;
    if (bodies.length === 0) return;
    const handle = bodies[bodies.length - 1];
    handle.applyLinearImpulse(
      planck.Vec2(0, -3.6),
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

  return { points, handleAngle, threadLeftPoints, threadRightPoints, notePos, noteAngle, pull, nudge, startDrag, moveDrag, endDrag };
}
