import React from 'react';
import { G, Path, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';
import { shade, blend } from '@/core/theme/color';

/**
 * Vector jungle leaves. Every leaf is drawn in a 100x100 box with its stem
 * base at (50, 100) and its tip pointing up, so placing / rotating a leaf is
 * always done around its base.
 */
export type LeafVariant = 'tropical' | 'long' | 'heart' | 'monstera' | 'fern';

export interface LeafSpec {
  variant: LeafVariant;
  /** Position of the stem base inside the parent Svg. */
  x: number;
  y: number;
  /** Rotation in degrees (0 = tip up, 90 = tip right). */
  rotate: number;
  /** Leaf length in px (the 100-unit box is scaled to this). */
  size: number;
  /** Mirror horizontally. */
  flip?: boolean;
  /** 0 = main tone, 1 = darker/deeper tone (adds depth). */
  tone?: 0 | 1;
  opacity?: number;
}

const OUTLINES: Record<Exclude<LeafVariant, 'fern'>, string> = {
  tropical: 'M50 100 C 22 82, 6 48, 50 2 C 94 48, 78 82, 50 100 Z',
  long: 'M50 100 C 36 74, 32 30, 50 0 C 68 30, 64 74, 50 100 Z',
  heart: 'M50 92 C 38 100, 8 98, 6 70 C 4 42, 30 14, 50 0 C 70 14, 96 42, 94 70 C 92 98, 62 100, 50 92 Z',
  // Monstera-like: broad leaf with deep side cuts.
  monstera:
    'M50 96 C 36 100, 10 94, 6 70 L 24 64 L 5 56 C 6 40, 14 26, 22 18 L 34 34 L 30 12 C 38 5, 44 2, 50 0 ' +
    'C 56 2, 62 5, 70 12 L 66 34 L 78 18 C 86 26, 94 40, 95 56 L 76 64 L 94 70 C 90 94, 64 100, 50 96 Z',
};

const VEINS: Record<Exclude<LeafVariant, 'fern'>, string> = {
  tropical: 'M50 98 Q 50 50 50 8 M50 70 Q 36 62 26 56 M50 70 Q 64 62 74 56 M50 46 Q 38 38 32 30 M50 46 Q 62 38 68 30',
  long: 'M50 98 Q 50 50 50 6 M50 66 Q 42 58 38 52 M50 66 Q 58 58 62 52 M50 40 Q 44 32 42 26 M50 40 Q 56 32 58 26',
  heart: 'M50 92 Q 50 46 50 6 M50 64 Q 30 58 16 64 M50 64 Q 70 58 84 64 M50 40 Q 34 32 24 34 M50 40 Q 66 32 76 34',
  monstera: 'M50 94 Q 50 46 50 6 M50 66 Q 36 62 22 66 M50 66 Q 64 62 78 66 M50 42 Q 40 34 32 26 M50 42 Q 60 34 68 26',
};

/** Gradient defs shared by every leaf of one Svg. */
export const LeafDefs: React.FC<{ id: string; color: string }> = ({ id, color }) => {
  const deep = blend(shade(color, -0.35), '#0B3D2E', 0.25);
  return (
    <Defs>
      <LinearGradient id={`${id}-a`} x1="0.5" y1="1" x2="0.5" y2="0">
        <Stop offset="0" stopColor={shade(color, -0.3)} />
        <Stop offset="0.55" stopColor={color} />
        <Stop offset="1" stopColor={shade(color, 0.28)} />
      </LinearGradient>
      <LinearGradient id={`${id}-b`} x1="0.5" y1="1" x2="0.5" y2="0">
        <Stop offset="0" stopColor={shade(deep, -0.25)} />
        <Stop offset="1" stopColor={shade(deep, 0.15)} />
      </LinearGradient>
    </Defs>
  );
};

interface LeafProps extends LeafSpec {
  gradientId: string;
  color: string;
}

export const Leaf: React.FC<LeafProps> = ({
  variant,
  x,
  y,
  rotate,
  size,
  flip,
  tone = 0,
  opacity = 1,
  gradientId,
  color,
}) => {
  const scale = size / 100;
  const transform = `translate(${x} ${y}) rotate(${rotate}) scale(${flip ? -scale : scale} ${scale}) translate(-50 -100)`;
  const fill = `url(#${gradientId}-${tone === 1 ? 'b' : 'a'})`;
  const veinColor = shade(color, tone === 1 ? 0.05 : 0.45);

  if (variant === 'fern') {
    // Fern frond: a stem with pairs of leaflets that shrink toward the tip.
    const leaflets = [];
    const count = 9;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const ly = 92 - t * 86;
      const len = 26 * (1 - t * 0.75);
      const w = 7 * (1 - t * 0.6);
      leaflets.push(
        <Ellipse key={`l${i}`} cx={50 - len / 2 - 1} cy={ly} rx={len / 2} ry={w / 2} transform={`rotate(-24 ${50 - len / 2 - 1} ${ly})`} fill={fill} />,
        <Ellipse key={`r${i}`} cx={50 + len / 2 + 1} cy={ly - 3} rx={len / 2} ry={w / 2} transform={`rotate(24 ${50 + len / 2 + 1} ${ly - 3})`} fill={fill} />
      );
    }
    return (
      <G transform={transform} opacity={opacity}>
        <Path d="M50 100 Q 52 50 50 4" stroke={shade(color, -0.35)} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        {leaflets}
      </G>
    );
  }

  return (
    <G transform={transform} opacity={opacity}>
      <Path d={OUTLINES[variant]} fill={fill} />
      <Path d={VEINS[variant]} stroke={veinColor} strokeOpacity={0.45} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </G>
  );
};
