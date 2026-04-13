import * as planck from 'planck';

import {
  FIXTURE_FRICTION, GRAVITY, HANDLE_DENSITY,
  NOTE_ANGULAR_DAMPING, NOTE_DENSITY, NOTE_HALF_H, NOTE_HALF_W,
  NOTE_LINEAR_DAMPING, NOTE_OFFSET_Y, NOTE_TILT,
  ROPE_ANGULAR_DAMPING, ROPE_LINEAR_DAMPING, ROPE_SEGMENT_DENSITY,
  SCALE, SWING_IN_LIFT, SWING_IN_TORQUE,
  THREAD_ANGULAR_DAMPING, THREAD_LINEAR_DAMPING,
  toPhysX, toPhysY,
  type RopeOptions,
} from './config';

export interface RopeWorld {
  world: planck.World;
  bodies: planck.Body[];
  ground: planck.Body;
  threadBody: planck.Body | null;
  noteBody: planck.Body | null;
}

/*
 * Builds the full physics world for a rope lever:
 *
 * 1. A static anchor at the top
 * 2. A chain of revolute-jointed bodies hanging down (the rope).
 *    Each pair also has a rigid distance joint to prevent stretching.
 *    The last body is the handle — heavier, with a full box collider.
 * 3. Optionally, a thread + note dangling from the handle bottom.
 * 4. If initialOffsetX is set, all dynamic bodies are displaced sideways
 *    and the handle gets a torque + upward kick for a swing-in entrance.
 */
export function buildRopeWorld(opts: RopeOptions): RopeWorld {
  const {
    anchorX, anchorY, segmentCount, segmentLength,
    noteOffset = 0, handleWidth = 0, handleHeight = 0,
    initialOffsetX = 0,
  } = opts;

  const world = planck.World({ gravity: planck.Vec2(0, GRAVITY) });
  const segLen = segmentLength / SCALE;
  const ax = toPhysX(anchorX);
  const ay = toPhysY(anchorY);
  const handleHeightM = handleHeight / SCALE;
  const handleWidthM = handleWidth / SCALE;

  const ground = world.createBody({
    type: 'static',
    position: planck.Vec2(ax, ay),
  });

  const bodies = buildChain(world, ground, {
    ax, ay, segLen, segmentCount,
    handleWidthM, handleHeightM,
  });

  let threadBody: planck.Body | null = null;
  let noteBody: planck.Body | null = null;

  if (noteOffset > 0) {
    const result = buildThreadAndNote(world, bodies, {
      ax, handleHeightM, noteOffset,
    });
    threadBody = result.threadBody;
    noteBody = result.noteBody;
  }

  if (initialOffsetX !== 0) {
    applySwingIn(bodies, segmentCount, initialOffsetX, threadBody, noteBody);
  }

  return { world, bodies, ground, threadBody, noteBody };
}

// ── Chain construction ──────────────────────────────────────────────

interface ChainParams {
  ax: number;
  ay: number;
  segLen: number;
  segmentCount: number;
  handleWidthM: number;
  handleHeightM: number;
}

function buildChain(
  world: planck.World,
  anchor: planck.Body,
  p: ChainParams,
): planck.Body[] {
  const bodies: planck.Body[] = [anchor];
  let prevBody = anchor;

  for (let i = 1; i <= p.segmentCount; i++) {
    const isHandle = i === p.segmentCount;
    const body = world.createBody({
      type: 'dynamic',
      position: planck.Vec2(p.ax, p.ay - i * p.segLen),
      linearDamping: ROPE_LINEAR_DAMPING,
      angularDamping: ROPE_ANGULAR_DAMPING,
    });

    if (isHandle) {
      body.createFixture({
        shape: planck.Box(
          p.handleWidthM / 2,
          p.handleHeightM / 2,
          planck.Vec2(0, -p.handleHeightM / 2),
          0,
        ),
        density: HANDLE_DENSITY,
        friction: FIXTURE_FRICTION,
      });
    } else {
      body.createFixture({
        shape: planck.Box(0.01, p.segLen / 2),
        density: ROPE_SEGMENT_DENSITY,
        friction: FIXTURE_FRICTION,
      });
    }

    const jointY = p.ay - (i - 0.5) * p.segLen;
    world.createJoint(
      planck.RevoluteJoint(
        { collideConnected: false },
        prevBody,
        body,
        planck.Vec2(p.ax, jointY),
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

  return bodies;
}

// ── Thread + note construction ──────────────────────────────────────

/*
 * A single thread body hangs from the handle bottom via revolute joint.
 * The note body dangles from the thread. Both sides of the visual "loop"
 * are computed from the same thread body, offset perpendicular to the
 * thread direction (done at render time, not here).
 */

interface ThreadParams {
  ax: number;
  handleHeightM: number;
  noteOffset: number;
}

function buildThreadAndNote(
  world: planck.World,
  bodies: planck.Body[],
  p: ThreadParams,
) {
  const handle = bodies[bodies.length - 1];
  const handlePos = handle.getPosition();
  const handleBottomY = handlePos.y - p.handleHeightM;
  const threadLen = p.noteOffset / SCALE;

  const threadBody = world.createBody({
    type: 'dynamic',
    position: planck.Vec2(p.ax, handleBottomY - threadLen),
    linearDamping: THREAD_LINEAR_DAMPING,
    angularDamping: THREAD_ANGULAR_DAMPING,
  });
  threadBody.createFixture({
    shape: planck.Box(0.01, threadLen / 2),
    density: 1.0,
    friction: FIXTURE_FRICTION,
  });
  world.createJoint(
    planck.RevoluteJoint(
      { collideConnected: false },
      handle,
      threadBody,
      planck.Vec2(p.ax, handleBottomY),
    ),
  );
  world.createJoint(
    planck.DistanceJoint(
      { frequencyHz: 0, dampingRatio: 0, collideConnected: false },
      handle,
      threadBody,
      planck.Vec2(p.ax, handleBottomY),
      planck.Vec2(p.ax, handleBottomY - threadLen),
    ),
  );

  const threadBottomY = handleBottomY - threadLen;
  const noteBody = world.createBody({
    type: 'dynamic',
    position: planck.Vec2(p.ax, threadBottomY - 0.05),
    linearDamping: NOTE_LINEAR_DAMPING,
    angularDamping: NOTE_ANGULAR_DAMPING,
  });
  noteBody.createFixture({
    shape: planck.Box(NOTE_HALF_W, NOTE_HALF_H, planck.Vec2(0, NOTE_OFFSET_Y), NOTE_TILT),
    density: NOTE_DENSITY,
    friction: FIXTURE_FRICTION,
  });
  world.createJoint(
    planck.RevoluteJoint(
      { collideConnected: false },
      threadBody,
      noteBody,
      planck.Vec2(p.ax, threadBottomY),
    ),
  );

  return { threadBody, noteBody };
}

// ── Swing-in displacement ───────────────────────────────────────────

/*
 * After the world is built at resting positions (so all joints have
 * correct local anchors), teleport dynamic bodies sideways and give
 * the handle a rotational kick. Physics naturally swings them back.
 */
function applySwingIn(
  bodies: planck.Body[],
  segmentCount: number,
  offsetX: number,
  threadBody: planck.Body | null,
  noteBody: planck.Body | null,
) {
  const offM = offsetX / SCALE;

  for (let i = 1; i < bodies.length; i++) {
    const t = i / segmentCount;
    const pos = bodies[i].getPosition();
    bodies[i].setTransform(
      planck.Vec2(pos.x + offM * t, pos.y),
      bodies[i].getAngle(),
    );
  }

  for (const b of [threadBody, noteBody]) {
    if (!b) continue;
    const pos = b.getPosition();
    b.setTransform(planck.Vec2(pos.x + offM, pos.y), b.getAngle());
  }

  const handle = bodies[bodies.length - 1];
  const torqueDir = offsetX > 0 ? -1 : 1;
  handle.applyAngularImpulse(torqueDir * SWING_IN_TORQUE);
  handle.applyLinearImpulse(
    planck.Vec2(0, SWING_IN_LIFT),
    handle.getWorldCenter(),
    true,
  );
}
