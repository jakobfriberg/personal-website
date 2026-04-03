'use client';

import { motion } from 'framer-motion';
import { useCallback, useState } from 'react';

import { GEAR_CONFIG } from '@/app/config/gear';

import CardCarousel from './CardCarousel';
import GearDebug, { GEAR_DEFAULTS, type GearValues } from './GearDebug';
import ThingySvg from './ThingySvg';

const THINGY_DEFAULTS = { top: 51.15, left: -4.78, scale: 0.87 };

const CARDS_COUNT = 9;

export default function MainContent() {
  const [gear, setGear] = useState(GEAR_DEFAULTS);
  const [thingy, setThingy] = useState(THINGY_DEFAULTS);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleGearChange = useCallback(
    (values: GearValues) => setGear(values),
    [],
  );

  const prev = useCallback(
    () => setActiveIndex((i) => Math.max(0, i - 1)),
    [],
  );
  const next = useCallback(
    () => setActiveIndex((i) => Math.min(CARDS_COUNT - 1, i + 1)),
    [],
  );

  const lgAngle = activeIndex * GEAR_CONFIG.degreesPerCard;
  const smAngle = -lgAngle * gear.gearRatio;
  const thingyTrackAngle = GEAR_CONFIG.thingyAngles[activeIndex] ?? 0;

  return (
    <motion.div
      className="fixed inset-0 bg-main-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {/* z-[1]: Gears — below gradient + cards */}
      <div
        className="absolute z-[1]"
        style={{
          top: `${gear.lgTop}%`,
          left: `${gear.lgLeft}%`,
          transform: `scale(${gear.lgScale})`,
          transformOrigin: 'top left',
        }}
      >
        <img
          src="/large-gear.svg"
          alt=""
          width={600}
          height={600}
          style={{
            transform: `rotate(${lgAngle}deg)`,
            transition: `transform ${GEAR_CONFIG.transitionDuration}s ${GEAR_CONFIG.transitionEasing}`,
          }}
        />
      </div>
      <div
        className="absolute z-[1]"
        style={{
          top: `${gear.smTop}%`,
          left: `${gear.smLeft}%`,
          transform: `scale(${gear.smScale})`,
          transformOrigin: 'top left',
        }}
      >
        <img
          src="/small-gear.svg"
          alt=""
          width={360}
          height={360}
          style={{
            transform: `rotate(${smAngle}deg)`,
            transition: `transform ${GEAR_CONFIG.transitionDuration}s ${GEAR_CONFIG.transitionEasing}`,
          }}
        />
      </div>

      {/* z-[0]: Thingy — bottom left, behind gears */}
      <div
        className="absolute z-[0]"
        style={{
          top: `${thingy.top}%`,
          left: `${thingy.left}%`,
          transform: `scale(${thingy.scale})`,
          transformOrigin: 'top left',
        }}
      >
        <ThingySvg trackRotation={thingyTrackAngle} />
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
          <CardCarousel
            activeIndex={activeIndex}
            onPrev={prev}
            onNext={next}
          />
        </div>
      </div>

      {/* Debug panel — remove when done */}
      <GearDebug
        onChange={handleGearChange}
        thingy={thingy}
        onThingyChange={setThingy}
      />
    </motion.div>
  );
}
