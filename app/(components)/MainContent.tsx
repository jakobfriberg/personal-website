'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { DEBUG } from '@/app/config/debug';
import { BG_GEAR_DEFAULTS, GEAR_CONFIG, MOTOR_DEFAULTS, THINGY_DEFAULTS } from '@/app/config/gear';
import { BG_CANVAS_OFFSET, DESIGN_VIEWPORT } from '@/app/config/canvas';
import { CARDS } from '@/app/data/cards';
import { SOUNDS } from '@/app/config/sound';
import { useSound } from '@/app/hooks/use-sound';

import GearDebug, { GEAR_DEFAULTS, type GearValues } from './debug/GearDebug';
import { useSoundDebugTab } from './debug/SoundDebug';
import CardCarousel from './gear/CardCarousel';
import MechanicalCounter from './gear/MechanicalCounter';
import MotorSvg from './gear/MotorSvg';
import ThingySvg from './gear/ThingySvg';
import SmokeFog from './gear/SmokeFog';
import PullLever from './interaction/PullLever';
import MobileNav from './ui/MobileNav';
import MuteButton from './ui/MuteButton';
import SocialLinks from './ui/SocialLinks';
export default function MainContent({ introComplete = false }: { introComplete?: boolean }) {
  const bgGearImgRef = useRef<HTMLImageElement>(null);
  const [gear, setGear] = useState(GEAR_DEFAULTS);
  const [thingy, setThingy] = useState(THINGY_DEFAULTS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [bgGear, setBgGear] = useState(BG_GEAR_DEFAULTS);
  const [motor, setMotor] = useState(MOTOR_DEFAULTS);
  const [debugProgress, setDebugProgress] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const playCardSound = useSound(SOUNDS.cardSwitch.src);
  const playCardSoundBack = useSound(SOUNDS.cardSwitchBack.src);
  const playWhirr = useSound(SOUNDS.mechWhirr.src);
  const playLargeGear = useSound(SOUNDS.largeGear.src);
  const playButtonTap = useSound(SOUNDS.buttonTap.src);
  const soundTab = useSoundDebugTab();

  const handleGearChange = useCallback(
    (values: GearValues) => setGear(values),
    [],
  );

  const goToCard = useCallback(
    (direction: 'prev' | 'next') => {
      setDebugProgress(null);
      playWhirr();
      playLargeGear();
      setActiveIndex((i) =>
        direction === 'prev'
          ? Math.max(0, i - 1)
          : Math.min(CARDS.length - 1, i + 1),
      );
    },
    [playWhirr, playLargeGear],
  );

  const prev = useCallback(
    () => { playCardSoundBack(); goToCard('prev'); },
    [playCardSoundBack, goToCard],
  );
  const next = useCallback(
    () => { playCardSound(); goToCard('next'); },
    [playCardSound, goToCard],
  );
  const mobilePrev = useCallback(
    () => { playButtonTap(); goToCard('prev'); },
    [playButtonTap, goToCard],
  );
  const mobileNext = useCallback(
    () => { playButtonTap(); goToCard('next'); },
    [playButtonTap, goToCard],
  );
  const swipePrev = useCallback(
    () => { if (activeIndex > 0) goToCard('prev'); },
    [activeIndex, goToCard],
  );
  const swipeNext = useCallback(
    () => { if (activeIndex < CARDS.length - 1) goToCard('next'); },
    [activeIndex, goToCard],
  );

  const lgAngle = activeIndex * GEAR_CONFIG.degreesPerCard;
  const smAngle = -lgAngle * gear.gearRatio;
  const thingyProgress = debugProgress ?? (GEAR_CONFIG.thingyProgress[activeIndex] ?? 0);

  return (
    <div className="fixed inset-0 bg-main-grid">
      {/*
        Background canvas — fixed at design viewport (1728×900), centered.
        Smaller screens clip the edges; larger screens show the grid fill.
      */}
      <SmokeFog />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div
          className="relative shrink-0 max-lg:translate-x-[var(--bg-offset-x)] max-lg:translate-y-[var(--bg-offset-y)]"
          style={{
            width: DESIGN_VIEWPORT.width,
            height: DESIGN_VIEWPORT.height,
            '--bg-offset-x': `${BG_CANVAS_OFFSET.x}px`,
            '--bg-offset-y': `${BG_CANVAS_OFFSET.y}px`,
          } as React.CSSProperties}
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
              src="/images/large-gear.svg"
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
              src="/images/knob.svg"
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
              src="/images/small-gear.svg"
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
              ref={bgGearImgRef}
              src="/images/large-gear-bg.svg"
              alt=""
              width={600}
              height={600}
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
            <MotorSvg
              spinDuration={GEAR_CONFIG.bgSpinDuration / GEAR_CONFIG.gearRatio}
              bgGearRef={bgGearImgRef}
            />
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
            hidden={!introComplete || activeIndex === 0}
          />
          <PullLever
            direction="next"
            onClick={next}
            disabled={activeIndex === CARDS.length - 1}
            hidden={!introComplete}
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
              'linear-gradient(to right, #35383B, transparent 35%, transparent 65%, #35383B)',
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
          <CardCarousel activeIndex={activeIndex} swipeEnabled={isMobile} onPrev={swipePrev} onNext={swipeNext} />
        </div>
      </div>

      {/* z-[5]: Mobile navigation — bottom center (mobile only) */}
      <MobileNav
        onPrev={mobilePrev}
        onNext={mobileNext}
        hasPrev={activeIndex > 0}
        hasNext={activeIndex < CARDS.length - 1}
      />

      {/* z-[4]: Social links — bottom right */}
      <SocialLinks />
      <MuteButton />

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
          tabs={[soundTab]}
        />
      )}
    </div>
  );
}
