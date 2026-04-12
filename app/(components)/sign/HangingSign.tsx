'use client';

import SignShape from './SignShape';

// ── Config ──────────────────────────────────────────────────────────
const FONT_SIZE = 52;
const SIGN_PADDING_Y = 40;
const SIGN_WIDTH = 720;
const SIGN_HEIGHT = FONT_SIZE + SIGN_PADDING_Y * 2;

export default function HangingSign() {
  return (
    <div className="flex justify-center pointer-events-none">
      <SignShape
        width={SIGN_WIDTH}
        height={SIGN_HEIGHT}
        fontSize={FONT_SIZE}
      />
    </div>
  );
}
