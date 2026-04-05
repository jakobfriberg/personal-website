'use client';

import { motion } from 'framer-motion';
import { useCallback, useState } from 'react';

import { DEBUG_V2, V2_CONFIG } from '@/app/config/v2';

import CardCarousel from '@/app/(components)/CardCarousel';
import DebugPanel, { tpsSliders } from '@/app/(components)/DebugPanel';
import PersonalPanel from '@/app/(components)/PersonalPanel';

const CARDS_COUNT = 9;

const LEFT_DEFAULTS = {
  top: V2_CONFIG.leftTop,
  left: V2_CONFIG.leftLeft,
  scale: V2_CONFIG.leftScale,
};

const RIGHT_DEFAULTS = {
  top: V2_CONFIG.rightTop,
  left: V2_CONFIG.rightLeft,
  scale: V2_CONFIG.rightScale,
};

export default function MainContentV2() {
  const [leftGear, setLeftGear] = useState(LEFT_DEFAULTS);
  const [rightGear, setRightGear] = useState(RIGHT_DEFAULTS);
  const [activeIndex, setActiveIndex] = useState(0);

  const prev = useCallback(
    () => setActiveIndex((i) => Math.max(0, i - 1)),
    [],
  );
  const next = useCallback(
    () => setActiveIndex((i) => Math.min(CARDS_COUNT - 1, i + 1)),
    [],
  );

  const lgAngle = activeIndex * V2_CONFIG.degreesPerCard;

  return (
    <motion.div
      className="fixed inset-0 bg-main-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {/* z-[1]: Left gear */}
      <div
        className="absolute z-[1]"
        style={{
          top: `${leftGear.top}%`,
          left: `${leftGear.left}%`,
          width: 600,
          height: 600,
          marginTop: -300,
          marginLeft: -300,
        }}
      >
        <img
          src="/large-gear.svg"
          alt=""
          width={600}
          height={600}
          style={{
            transform: `scale(${leftGear.scale}) rotate(${lgAngle}deg)`,
            transition: `transform ${V2_CONFIG.transitionDuration}s ${V2_CONFIG.transitionEasing}`,
          }}
        />
      </div>

      {/* z-[1]: Right gear */}
      <div
        className="absolute z-[1]"
        style={{
          top: `${rightGear.top}%`,
          left: `${rightGear.left}%`,
          width: 600,
          height: 600,
          marginTop: -300,
          marginLeft: -300,
        }}
      >
        <img
          src="/large-gear.svg"
          alt=""
          width={600}
          height={600}
          style={{
            transform: `scale(${rightGear.scale}) rotate(${-lgAngle}deg)`,
            transition: `transform ${V2_CONFIG.transitionDuration}s ${V2_CONFIG.transitionEasing}`,
          }}
        />
      </div>

      {/* z-[2]: Grid edge fade */}
      <div className="absolute inset-0 pointer-events-none z-[2] flex items-center justify-center">
        <div
          className="h-full w-full max-w-[1440px]"
          style={{
            boxShadow: '0 0 0 9999px #35383B',
            background: [
              'linear-gradient(to right, #35383B, transparent 20%, transparent 80%, #35383B)',
              'linear-gradient(to bottom, #35383B, transparent 20%, transparent 80%, #35383B)',
            ].join(', '),
          }}
        />
      </div>

      {/* z-[3]: Cards */}
      <div className="relative z-[3] flex h-full flex-col items-center justify-center">
        <div className="w-full max-w-[1440px] px-8">
          <CardCarousel activeIndex={activeIndex} />
        </div>
      </div>

      {/* z-[4]: Personal panel — bottom right */}
      <PersonalPanel />

      {/* Debug */}
      {DEBUG_V2 && (
        <DebugPanel
          groups={[
            {
              title: 'Left gear',
              values: leftGear,
              onChange: (v) => setLeftGear(v as typeof leftGear),
              sliders: tpsSliders,
            },
            {
              title: 'Right gear',
              values: rightGear,
              onChange: (v) => setRightGear(v as typeof rightGear),
              sliders: tpsSliders,
            },
          ]}
        />
      )}
    </motion.div>
  );
}
