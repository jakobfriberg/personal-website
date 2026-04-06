'use client';

import { useCallback, useState } from 'react';

import { GEAR_CONFIG } from '@/app/config/gear';

import DebugPanel, { posSliders, tpsSliders } from './DebugPanel';

export interface GearValues {
  lgTop: number;
  lgLeft: number;
  lgScale: number;
  gearRatio: number;
  smTop: number;
  smLeft: number;
  smScale: number;
}

export const GEAR_DEFAULTS: GearValues = {
  lgTop: GEAR_CONFIG.lgTop,
  lgLeft: GEAR_CONFIG.lgLeft,
  lgScale: GEAR_CONFIG.lgScale,
  smTop: GEAR_CONFIG.smTop,
  smLeft: GEAR_CONFIG.smLeft,
  smScale: GEAR_CONFIG.smScale,
  gearRatio: GEAR_CONFIG.gearRatio,
};

export interface ThingyValues {
  top: number;
  left: number;
  scale: number;
}

export default function GearDebug({
  onChange,
  thingy,
  onThingyChange,
  bgGear,
  onBgGearChange,
}: {
  onChange: (values: GearValues) => void;
  thingy: ThingyValues;
  onThingyChange: (values: ThingyValues) => void;
  bgGear: ThingyValues;
  onBgGearChange: (values: ThingyValues) => void;
}) {
  const [pos, setPos] = useState(GEAR_DEFAULTS);

  const updateGear = useCallback(
    (values: Record<string, number>) => {
      const next = values as unknown as GearValues;
      setPos(next);
      onChange(next);
    },
    [onChange],
  );

  return (
    <DebugPanel
      groups={[
        {
          title: 'Large gear',
          values: pos as unknown as Record<string, number>,
          onChange: updateGear,
          sliders: posSliders('lg'),
        },
        {
          title: 'Small gear',
          values: pos as unknown as Record<string, number>,
          onChange: updateGear,
          sliders: posSliders('sm'),
        },
        {
          title: 'Thingy',
          values: thingy as unknown as Record<string, number>,
          onChange: (v) => onThingyChange(v as unknown as ThingyValues),
          sliders: tpsSliders,
        },
        {
          title: 'Bg gear',
          values: bgGear as unknown as Record<string, number>,
          onChange: (v) => onBgGearChange(v as unknown as ThingyValues),
          sliders: tpsSliders,
        },
      ]}
    />
  );
}
