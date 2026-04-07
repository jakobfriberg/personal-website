'use client';

import { useEffect, useRef } from 'react';
import {
  Application,
  BlurFilter,
  Container,
  defaultFilterVert,
  Filter,
  GlProgram,
  Sprite,
  Texture,
  UniformGroup,
} from 'pixi.js';

import { CLOUD_CONFIG } from '@/app/config/clouds';

// ── Gooey outline filter ───────────────────────────────────────────
// Double-threshold on blurred alpha:
// - alpha > upper threshold → fill color
// - alpha between lower and upper → stroke color (outline)
// - alpha < lower threshold → transparent
const GOOEY_OUTLINE_FRAG = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;

uniform float uUpperThreshold;
uniform float uLowerThreshold;
uniform vec3 uFillColor;
uniform vec3 uStrokeColor;

void main() {
  vec4 color = texture(uTexture, vTextureCoord);
  float a = color.a;

  if (a > uUpperThreshold) {
    finalColor = vec4(uFillColor, 1.0);
  } else if (a > uLowerThreshold) {
    finalColor = vec4(uStrokeColor, 1.0);
  } else {
    finalColor = vec4(0.0);
  }
}
`;

function hexToVec3(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

function createGooeyOutlineFilter(c: typeof CLOUD_CONFIG): Filter {
  const fill = hexToVec3(c.fillColor);
  const stroke = hexToVec3(c.strokeColor);

  const gooeyUniforms = new UniformGroup({
    uUpperThreshold: { value: c.gooeyUpperThreshold, type: 'f32' },
    uLowerThreshold: { value: c.gooeyLowerThreshold, type: 'f32' },
    uFillColor: { value: new Float32Array(fill), type: 'vec3<f32>' },
    uStrokeColor: { value: new Float32Array(stroke), type: 'vec3<f32>' },
  });

  return new Filter({
    glProgram: GlProgram.from({
      vertex: defaultFilterVert,
      fragment: GOOEY_OUTLINE_FRAG,
      name: 'gooey-outline-filter',
    }),
    resources: {
      gooeyUniforms,
    },
  });
}

// ── Puff state ─────────────────────────────────────────────────────
interface Puff {
  sprite: Sprite;
  size: number;
  speed: number;
  scaleEnd: number;
  spinSpeed: number;
  stagger: number;
  // Direction angle (radians) — cloud drifts this direction until off-screen
  angle: number;
}

// ── Component ──────────────────────────────────────────────────────
export default function SmokeFog({
  config,
}: {
  config?: typeof CLOUD_CONFIG;
} = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const configRef = useRef(config ?? CLOUD_CONFIG);
  configRef.current = config ?? CLOUD_CONFIG;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let destroyed = false;

    async function init() {
      const c = configRef.current;

      const app = new Application();
      await app.init({
        resizeTo: el!,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (destroyed) { app.destroy(true); return; }

      appRef.current = app;
      el!.appendChild(app.canvas as HTMLCanvasElement);

      const textures = await extractCloudTextures(c);

      if (destroyed || textures.length === 0) { app.destroy(true); return; }

      const cloudContainer = new Container();
      const blur = new BlurFilter({
        strength: c.blurStrength,
        quality: c.blurQuality,
      });
      const gooey = createGooeyOutlineFilter(c);
      cloudContainer.filters = [blur, gooey];
      app.stage.addChild(cloudContainer);

      const puffs: Puff[] = [];
      const vw = app.screen.width;
      const vh = app.screen.height;
      // Distance a cloud must travel to be fully off-screen from any start point
      const maxDist = Math.sqrt(vw * vw + vh * vh) * 1.5;
      const angleRad = c.driftAngle * Math.PI / 180;
      const spread = c.driftAngleSpread * Math.PI / 180;

      for (let i = 0; i < c.puffCount; i++) {
        const tex = textures[i % textures.length];
        const sprite = new Sprite(tex);
        sprite.anchor.set(0.5);
        cloudContainer.addChild(sprite);

        const size = c.sizeBase + Math.sin(i * 1.7) * c.sizeVariation;
        const speed = c.speed + Math.abs(Math.sin(i * 3.1)) * c.speedVariation;
        const angle = angleRad + Math.sin(i * 2.7) * spread;

        puffs.push({
          sprite,
          size,
          speed,
          scaleEnd: c.scaleEnd + Math.sin(i * 1.9) * c.scaleVariation,
          spinSpeed: (Math.sin(i * 2.3) > 0 ? 1 : -1) * (c.spinSpeed + Math.abs(Math.sin(i * 3.7)) * c.spinVariation),
          stagger: i / c.puffCount,
          angle,
        });
      }

      // Spawn origin (px)
      const spawnX = vw * (1 + c.spawnX / 100);
      const spawnY = vh * (1 - c.spawnY / 100);

      app.ticker.add((ticker) => {
        const elapsed = ticker.lastTime / 1000;

        for (const puff of puffs) {
          // t wraps 0→1, each cloud evenly staggered
          const t = (elapsed * puff.speed + puff.stagger) % 1;

          // Distance along drift direction
          const dist = t * maxDist;
          const dx = Math.cos(puff.angle) * dist;
          const dy = Math.sin(puff.angle) * dist;

          // Randomize spawn position slightly per cloud
          const sx = spawnX + Math.sin(puff.stagger * 37) * vw * (c.spawnSpread / 100);
          const sy = spawnY + Math.cos(puff.stagger * 53) * vh * (c.spawnSpread / 100);

          puff.sprite.x = sx + dx;
          puff.sprite.y = sy + dy;

          const scale = puff.size / c.textureSize * (c.scaleStart + (puff.scaleEnd - c.scaleStart) * t);
          puff.sprite.scale.set(scale);

          puff.sprite.rotation = elapsed * puff.spinSpeed;
        }
      });
    }

    init();

    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[-2] pointer-events-none"
    />
  );
}

// ── SVG → cloud textures (solid white shapes for blur input) ───────
// The shapes are rendered as solid white on transparent.
// The gooey outline filter handles coloring after blur.
async function extractCloudTextures(
  config: typeof CLOUD_CONFIG,
): Promise<Texture[]> {
  const response = await fetch(config.svgUrl);
  const svgText = await response.text();

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden';
  wrapper.innerHTML = svgText;
  document.body.appendChild(wrapper);

  const svg = wrapper.querySelector('svg')!;
  const paths = Array.from(svg.querySelectorAll('path'));

  const textures: Texture[] = [];
  const serializer = new XMLSerializer();
  const pad = 10;
  const size = config.textureSize;

  for (const path of paths) {
    const d = path.getAttribute('d');
    if (!d) continue;

    const bbox = (path as SVGGraphicsElement).getBBox();
    if (bbox.width < 1 || bbox.height < 1) continue;

    const vb = `${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`;

    // Render as solid white — the shader handles fill/stroke colors
    const singleSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    singleSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    singleSvg.setAttribute('viewBox', vb);
    singleSvg.setAttribute('width', `${size}`);
    singleSvg.setAttribute('height', `${size}`);

    const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    newPath.setAttribute('d', d);
    newPath.setAttribute('fill', 'white');
    newPath.setAttribute('stroke', 'none');
    singleSvg.appendChild(newPath);

    const svgString = serializer.serializeToString(singleSvg);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

    const tex = await new Promise<Texture>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, size, size);
        resolve(Texture.from(canvas));
      };
      img.src = dataUrl;
    });

    textures.push(tex);
  }

  document.body.removeChild(wrapper);
  return textures;
}
