'use client';

import { motion } from 'framer-motion';

import { SMOKE_CONFIG } from '@/app/config/smoke';

interface PuffConfig {
  size: number;
  blur: number;
  duration: number;
  delay: number;
  xEnd: number;
  yEnd: number;
  drift: number;
  scaleEnd: number;
  clipPath: string;
}

function generatePolygon(seed: number, edges: number): string {
  const points: string[] = [];
  for (let j = 0; j < edges; j++) {
    const angle = (j / edges) * Math.PI * 2;
    const radius = 35 + Math.sin(seed * 3.7 + j * 2.1) * 15;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  }
  return `polygon(${points.join(', ')})`;
}

function generatePuffs(count: number): PuffConfig[] {
  const c = SMOKE_CONFIG;
  const puffs: PuffConfig[] = [];
  for (let i = 0; i < count; i++) {
    const edges = 4 + Math.floor(Math.abs(Math.sin(i * 5.3)) * 5);
    puffs.push({
      size: c.sizeBase + Math.sin(i * 1.7) * c.sizeVariation,
      blur: c.blurBase + Math.sin(i * 2.3) * c.blurVariation,
      duration: c.durationBase + Math.abs(Math.sin(i * 3.1)) * c.durationVariation,
      delay: (i / count) * c.durationBase + Math.sin(i * 2.9) * 2,
      xEnd: c.xDriftBase - Math.sin(i * 1.3) * c.xDriftVariation,
      yEnd: c.yDriftBase - Math.sin(i * 2.7) * c.yDriftVariation,
      drift: Math.sin(i * 4.1) * 40,
      scaleEnd: c.scaleEnd + Math.sin(i * 1.9) * c.scaleVariation,
      clipPath: generatePolygon(i, edges),
    });
  }
  return puffs;
}

const DEFAULT_PUFFS = generatePuffs(SMOKE_CONFIG.puffCount);

export default function SmokeFog() {
  const c = SMOKE_CONFIG;
  const puffs = DEFAULT_PUFFS;

  return (
    <div className="absolute inset-0 z-[-2] overflow-hidden pointer-events-none">
      {puffs.map((puff, i) => {
        const h = puff.size * (0.7 + Math.sin(i * 2.4) * 0.3);
        const pad = puff.blur * c.blurScale;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: puff.size + pad * 2,
              height: h + pad * 2,
              right: `${c.originRight + Math.sin(i * 3.2) * c.originSpread}%`,
              bottom: `${c.originBottom + Math.sin(i * 1.8) * c.originSpread}%`,
              filter: `blur(${pad}px)`,
              willChange: 'transform',
            }}
            animate={{
              x: [`${puff.drift}px`, `${puff.xEnd}vw`],
              y: ['0vh', `${puff.yEnd}vh`],
              scale: [0.5, puff.scaleEnd],
              opacity: [c.opacity * 0.6, c.opacity * 0.3, 0],
            }}
            transition={{
              duration: puff.duration * c.speedScale,
              repeat: Infinity,
              ease: 'easeOut',
              delay: puff.delay * c.speedScale,
              times: [0, 0.6, 1],
            }}
          >
            <div
              style={{
                width: puff.size,
                height: h,
                margin: pad,
                background: c.color,
                clipPath: puff.clipPath,
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
