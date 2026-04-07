'use client';

import { motion } from 'framer-motion';
import { useCallback, useState } from 'react';

import { BG_GEAR_DEFAULTS, DEBUG, GEAR_CONFIG, MOTOR_DEFAULTS, THINGY_DEFAULTS } from '@/app/config/gear';
import { CARDS } from '@/app/data/cards';

import GearDebug, { GEAR_DEFAULTS, type GearValues } from './debug/GearDebug';
import CardCarousel from './gear/CardCarousel';
import MechanicalCounter from './gear/MechanicalCounter';
import MotorSvg from './gear/MotorSvg';
import ThingySvg from './gear/ThingySvg';
import SmokeFog from './gear/SmokeFog';
import PullLever from './interaction/PullLever';
import MobileNav from './ui/MobileNav';
import SocialLinks from './ui/SocialLinks';

export default function MainContent() {
  const [gear, setGear] = useState(GEAR_DEFAULTS);
  const [thingy, setThingy] = useState(THINGY_DEFAULTS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [bgGear, setBgGear] = useState(BG_GEAR_DEFAULTS);
  const [motor, setMotor] = useState(MOTOR_DEFAULTS);
  const [debugProgress, setDebugProgress] = useState<number | null>(null);

  const handleGearChange = useCallback(
    (values: GearValues) => setGear(values),
    [],
  );

  const prev = useCallback(
    () => { setDebugProgress(null); setActiveIndex((i) => Math.max(0, i - 1)); },
    [],
  );
  const next = useCallback(
    () => { setDebugProgress(null); setActiveIndex((i) => Math.min(CARDS.length - 1, i + 1)); },
    [],
  );

  const lgAngle = activeIndex * GEAR_CONFIG.degreesPerCard;
  const smAngle = -lgAngle * gear.gearRatio;
  const thingyProgress = debugProgress ?? (GEAR_CONFIG.thingyProgress[activeIndex] ?? 0);

  return (
    <motion.div
      className="fixed inset-0 bg-main-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {/*
        Background canvas — fixed at design viewport (1728×900), centered.
        Smaller screens clip the edges; larger screens show the grid fill.
      */}
      <SmokeFog />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative shrink-0"
          style={{ width: 1728, height: 900 }}
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
            {/* Knob — centered on gear, doesn't rotate */}
            <img
              src="/knob.svg"
              alt=""
              width={120}
              height={120}
              className="absolute z-10"
              style={{
                top: 300 - 60,
                left: 300 - 60,
                transform: 'rotate(13deg)',
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

          {/* z-[-1]: Background gear */}
          <div
            className="absolute z-[-1]"
            style={{
              top: `${bgGear.top}%`,
              left: `${bgGear.left}%`,
              transform: `scale(${bgGear.scale})`,
              transformOrigin: 'top left',
            }}
          >
            <img
              src="/large-gear-bg.svg"
              alt=""
              width={600}
              height={600}
              style={{ animation: `slow-spin ${GEAR_CONFIG.bgSpinDuration}s linear infinite` }}
            />
          </div>

          {/* z-[-1]: Motor with gear */}
          <div
            className="absolute z-[-1]"
            style={{
              top: `${motor.top}%`,
              left: `${motor.left}%`,
              transform: `scale(${motor.scale})`,
              transformOrigin: 'top left',
            }}
          >
            <MotorSvg spinDuration={GEAR_CONFIG.bgSpinDuration / GEAR_CONFIG.gearRatio} />
          </div>

          {/* z-[0]: Thingy */}
          <div
            className="absolute z-[0]"
            style={{
              top: `${thingy.top}%`,
              left: `${thingy.left}%`,
              transform: `scale(${thingy.scale})`,
              transformOrigin: 'top left',
            }}
          >
            <ThingySvg trackProgress={thingyProgress} />
          </div>
        </div>
      </div>

      {/* z-[5]: Pull levers — anchored to 1440px content area, right side */}
      <div className="absolute inset-0 z-[5] hidden lg:flex justify-center pointer-events-none" style={{ top: -200 }}>
        <div className="w-full max-w-[1440px] flex justify-end gap-12 xl:gap-24" style={{ paddingRight: 100 }}>
          <PullLever
            direction="prev"
            onClick={prev}
            disabled={activeIndex === 0}
            hidden={activeIndex === 0}
          />
          <PullLever
            direction="next"
            onClick={next}
            disabled={activeIndex === CARDS.length - 1}
          />
        </div>
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

      {/* z-[3]: Counter + Cards */}
      <div className="relative z-[3] flex h-full flex-col items-center justify-center px-10 md:px-8">
        <div className="relative z-20 w-full flex justify-center">
          <MechanicalCounter
            index={activeIndex}
            title={CARDS[activeIndex].title}
          />
        </div>
        <div className="-mt-4 w-full max-w-[1440px]">
          <CardCarousel activeIndex={activeIndex} />
        </div>
      </div>

      {/* z-[5]: Mobile navigation — bottom center (mobile only) */}
      <MobileNav
        onPrev={prev}
        onNext={next}
        hasPrev={activeIndex > 0}
        hasNext={activeIndex < CARDS.length - 1}
      />

      {/* z-[4]: Social links — bottom right */}
      <SocialLinks />

      {/* Debug panel */}
      {DEBUG && (
        <GearDebug
          onChange={handleGearChange}
          thingy={thingy}
          onThingyChange={setThingy}
          bgGear={bgGear}
          onBgGearChange={setBgGear}
          motor={motor}
          onMotorChange={setMotor}
          thingyProgress={thingyProgress}
          onThingyProgressChange={setDebugProgress}
        />
      )}
    </motion.div>
  );
}
