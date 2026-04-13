import * as planck from 'planck';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DRAG_DAMPING_RATIO, DRAG_FREQUENCY_HZ, DRAG_MAX_FORCE_MULT,
  DRAG_REACH_MULT, NUDGE_IMPULSE, PULL_IMPULSE, SCALE,
  THREAD_SPREAD, TIME_STEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS,
  perpendicular, toPhysX, toPhysY, toScreen,
  type RopeOptions, type Vec2,
} from './config';
import { buildRopeWorld } from './build-world';

export { perpendicular } from './config';
export type { RopeOptions, Vec2 } from './config';

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
  const threadBodyRef = useRef<planck.Body | null>(null);
  const noteBodyRef = useRef<planck.Body | null>(null);
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
  const [notePos, setNotePos] = useState<Vec2>({
    x: anchorX,
    y: anchorY + segmentCount * segmentLength + handleHeight + noteOffset,
  });
  const [noteAngle, setNoteAngle] = useState(0);

  useEffect(() => {
    const { world, bodies, ground, threadBody, noteBody } = buildRopeWorld({
      anchorX, anchorY, segmentCount, segmentLength,
      noteOffset, handleWidth, handleHeight, initialOffsetX,
    });

    worldRef.current = world;
    bodiesRef.current = bodies;
    groundRef.current = ground;
    threadBodyRef.current = threadBody;
    noteBodyRef.current = noteBody;

    const handleHeightM = handleHeight / SCALE;

    /*
     * Physics steps at a fixed 60Hz regardless of display refresh rate.
     * We accumulate real elapsed time and step only when enough has
     * built up. State reads run every frame for smooth rendering.
     */
    let lastTime = performance.now();
    let accumulator = 0;
    const stepMs = TIME_STEP * 1000;

    const maxAccumulator = stepMs * 6;

    const step = () => {
      const now = performance.now();
      accumulator = Math.min(accumulator + (now - lastTime), maxAccumulator);
      lastTime = now;

      while (accumulator >= stepMs) {
        world.step(TIME_STEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);
        accumulator -= stepMs;
      }

      setPoints(bodies.map((b) => toScreen(b.getPosition())));

      const handle = bodies[bodies.length - 1];
      setHandleAngle(-handle.getAngle());

      const hBottom = handle.getWorldPoint(planck.Vec2(0, -handleHeightM));
      const hBottomScreen = toScreen(hBottom);

      let noteHoleScreen = hBottomScreen;
      if (noteBody) {
        noteHoleScreen = toScreen(noteBody.getWorldPoint(planck.Vec2(0, 0)));
      }

      if (threadBody) {
        const mid = toScreen(threadBody.getPosition());
        const { nx, ny } = perpendicular(
          noteHoleScreen.x - hBottomScreen.x,
          noteHoleScreen.y - hBottomScreen.y,
        );

        setThreadLeftPoints([
          hBottomScreen,
          { x: mid.x + nx * THREAD_SPREAD, y: mid.y + ny * THREAD_SPREAD },
          noteHoleScreen,
        ]);
        setThreadRightPoints([
          hBottomScreen,
          { x: mid.x - nx * THREAD_SPREAD, y: mid.y - ny * THREAD_SPREAD },
          noteHoleScreen,
        ]);
      }

      if (noteBody) {
        setNotePos(toScreen(noteBody.getPosition()));
        setNoteAngle(-noteBody.getAngle());
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafRef.current);
      worldRef.current = null;
      bodiesRef.current = [];
      threadBodyRef.current = null;
      noteBodyRef.current = null;
    };
  }, [anchorX, anchorY, segmentCount, segmentLength, noteOffset, handleWidth, handleHeight, initialOffsetX]);

  // ── Interaction callbacks ─────────────────────────────────────────

  const getHandle = () => {
    const bodies = bodiesRef.current;
    return bodies.length > 0 ? bodies[bodies.length - 1] : null;
  };

  const pull = useCallback(() => {
    const handle = getHandle();
    if (!handle) return;
    handle.applyLinearImpulse(
      planck.Vec2(0, PULL_IMPULSE),
      handle.getWorldCenter(),
      true,
    );
  }, []);

  const nudge = useCallback(() => {
    const handle = getHandle();
    if (!handle) return;
    handle.applyLinearImpulse(
      planck.Vec2(0, NUDGE_IMPULSE),
      handle.getWorldCenter(),
      true,
    );
  }, []);

  const startDrag = useCallback(() => {
    const world = worldRef.current;
    const ground = groundRef.current;
    const handle = getHandle();
    if (!world || !ground || !handle) return;

    const pos = handle.getPosition();
    const joint = world.createJoint(
      planck.MouseJoint(
        {
          maxForce: DRAG_MAX_FORCE_MULT * handle.getMass(),
          frequencyHz: DRAG_FREQUENCY_HZ,
          dampingRatio: DRAG_DAMPING_RATIO,
        },
        ground,
        handle,
        planck.Vec2(pos.x, pos.y),
      ),
    );
    mouseJointRef.current = joint;
  }, []);

  const maxDragDist = segmentCount * segmentLength * DRAG_REACH_MULT;

  const moveDrag = useCallback((x: number, y: number) => {
    const joint = mouseJointRef.current;
    if (!joint) return;

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

  return {
    points, handleAngle, threadLeftPoints, threadRightPoints,
    notePos, noteAngle,
    pull, nudge, startDrag, moveDrag, endDrag,
  };
}
