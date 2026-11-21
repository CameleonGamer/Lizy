import React, { useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { Leaf, LeafDefs, LeafSpec } from './Leaf';
import { useSvgId } from './LeafCluster';
import { shade } from '@/core/theme/color';

interface VineProps {
  /** 'hanging' falls from the top centre, 'draped' sags between left & right. */
  kind?: 'hanging' | 'draped';
  width: number;
  height: number;
  vineColor: string;
  leafColor: string;
  /** Space between two leaves along the vine, in px. */
  leafEvery?: number;
  leafSize?: number;
  /** Changes the wave shape so several vines don't look identical. */
  seed?: number;
  style?: StyleProp<ViewStyle>;
}

type Pt = { x: number; y: number };

function samplePath(kind: 'hanging' | 'draped', w: number, h: number, seed: number): Pt[] {
  const pts: Pt[] = [];
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (kind === 'hanging') {
      const amp = (w / 2 - 6) * (0.25 + 0.75 * t);
      pts.push({ x: w / 2 + Math.sin(t * Math.PI * (1.6 + seed * 0.3) + seed) * amp * 0.55, y: 2 + t * (h - 6) });
    } else {
      const sag = 4 * (h * 0.55) * t * (1 - t);
      pts.push({ x: t * w, y: 4 + sag + Math.sin(t * Math.PI * (3 + seed) + seed) * 3 });
    }
  }
  return pts;
}

function toPath(pts: Pt[]): string {
  // Smooth with quadratic curves through mid-points.
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
}

/** A liana with small leaves sprouting along it. */
export const Vine: React.FC<VineProps> = React.memo(
  ({ kind = 'hanging', width, height, vineColor, leafColor, leafEvery = 26, leafSize = 22, seed = 0, style }) => {
    const id = useSvgId('vine');
    // Leaves stick out of the stem's box: give them room so they're not clipped.
    const pad = Math.ceil(leafSize * 1.1);

    const { d, leaves } = useMemo(() => {
      const pts = samplePath(kind, width, height, seed);
      const leafSpecs: LeafSpec[] = [];
      let travelled = 0;
      let side = seed % 2 === 0 ? 1 : -1;
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x;
        const dy = pts[i].y - pts[i - 1].y;
        travelled += Math.hypot(dx, dy);
        if (travelled >= leafEvery) {
          travelled = 0;
          const dir = (Math.atan2(dy, dx) * 180) / Math.PI; // direction of the vine
          const progress = i / pts.length;
          leafSpecs.push({
            variant: i % 3 === 0 ? 'heart' : 'tropical',
            x: pts[i].x,
            y: pts[i].y,
            // Leaf tip angle = rotate - 90. Hanging leaves point outward & down,
            // draped ones mostly hang under the vine.
            rotate: (kind === 'hanging' ? dir + side * 60 : 90 + side * 40) + 90,
            size: leafSize * (kind === 'hanging' ? 0.75 + 0.35 * progress : 0.9),
            flip: side < 0,
            tone: i % 4 === 0 ? 1 : 0,
          });
          side = -side;
        }
      }
      return { d: toPath(pts), leaves: leafSpecs };
    }, [kind, width, height, seed, leafEvery, leafSize]);

    return (
      <Svg
        width={width + pad * 2}
        height={height + pad}
        style={[style, { marginLeft: -pad }]}
        pointerEvents="none"
      >
        <LeafDefs id={id} color={leafColor} />
        <G transform={`translate(${pad} 0)`}>
          <Path d={d} stroke={shade(vineColor, -0.35)} strokeWidth={4.2} fill="none" strokeLinecap="round" />
          <Path d={d} stroke={vineColor} strokeWidth={2.6} fill="none" strokeLinecap="round" />
          <Path d={d} stroke={shade(vineColor, 0.35)} strokeOpacity={0.5} strokeWidth={0.8} fill="none" strokeLinecap="round" />
          {leaves.map((leaf, i) => (
            <Leaf key={i} {...leaf} gradientId={id} color={leafColor} />
          ))}
        </G>
      </Svg>
    );
  }
);
Vine.displayName = 'Vine';
