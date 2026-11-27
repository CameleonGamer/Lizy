import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/stores/useThemeStore';
import { withAlpha, shade } from '@/core/theme/color';
import { LeafCluster } from './LeafCluster';
import { Vine } from './Vine';
import { LeafSpec } from './Leaf';
import { useLeafWindStyle } from './useSway';

/*
 * Corner clusters. Coordinates are local to each cluster's Svg box.
 * The leaves overflow the screen edges on purpose (looks like the canopy
 * continues beyond the phone).
 */
const TOP_LEFT: LeafSpec[] = [
  { variant: 'monstera', x: 0, y: 40, rotate: 130, size: 150, tone: 1 },
  { variant: 'long', x: 0, y: 10, rotate: 105, size: 130 },
  { variant: 'tropical', x: 30, y: 0, rotate: 160, size: 110 },
  { variant: 'fern', x: 0, y: 90, rotate: 115, size: 120, tone: 1 },
];

const TOP_RIGHT: LeafSpec[] = [
  { variant: 'heart', x: 170, y: 0, rotate: -150, size: 120, tone: 1 },
  { variant: 'long', x: 170, y: 30, rotate: -110, size: 140 },
  { variant: 'fern', x: 150, y: 0, rotate: -170, size: 110 },
];

const BOTTOM_LEFT: LeafSpec[] = [
  { variant: 'long', x: 10, y: 200, rotate: 25, size: 170, tone: 1 },
  { variant: 'monstera', x: -10, y: 200, rotate: 50, size: 140 },
  { variant: 'fern', x: 40, y: 200, rotate: 8, size: 150, tone: 1 },
  { variant: 'tropical', x: 0, y: 160, rotate: 75, size: 100 },
];

const BOTTOM_RIGHT: LeafSpec[] = [
  { variant: 'tropical', x: 170, y: 200, rotate: -30, size: 160, tone: 1 },
  { variant: 'heart', x: 180, y: 190, rotate: -60, size: 120 },
  { variant: 'fern', x: 150, y: 200, rotate: -12, size: 140 },
];

const SwayingLeafCluster: React.FC<{
  width: number;
  height: number;
  leaves: LeafSpec[];
  color: string;
  style: StyleProp<ViewStyle>;
  transformOrigin: string;
  degrees: number;
  duration: number;
  delay: number;
  driftPx: number;
}> = ({
  width,
  height,
  leaves,
  color,
  style,
  transformOrigin,
  degrees,
  duration,
  delay,
  driftPx,
}) => {
  const windStyle = useLeafWindStyle({
    baseDegrees: degrees,
    baseDuration: duration,
    delay,
    driftPx,
    transformOrigin,
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[style, { width, height }, windStyle]}
    >
      <LeafCluster width={width} height={height} leaves={leaves} color={color} />
    </Animated.View>
  );
};

const SwayingVine: React.FC<{
  left: number;
  width: number;
  height: number;
  seed: number;
  degrees: number;
  duration: number;
  vineColor: string;
  leafColor: string;
}> = ({ left, width, height, seed, degrees, duration, vineColor, leafColor }) => {
  const windStyle = useLeafWindStyle({
    baseDegrees: degrees,
    baseDuration: duration,
    delay: seed * 320,
    driftPx: 2.5,
    transformOrigin: '50% 0%',
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.vine, { left, width, height }, windStyle]}
    >
      <Vine kind="hanging" width={width} height={height} seed={seed} vineColor={vineColor} leafColor={leafColor} />
    </Animated.View>
  );
};

interface JungleBackgroundProps {
  /** Lower density for busy screens. */
  density?: 'full' | 'light';
}

/**
 * Decorative jungle layer. Put it as the first child of a screen root: it
 * fills the screen behind the content and never catches touches.
 * Renders nothing when the jungle decor is disabled in settings.
 */
export const JungleBackground: React.FC<JungleBackgroundProps> = ({ density = 'full' }) => {
  const { width, height } = useWindowDimensions();
  const enabled = useThemeStore((s) => s.jungleDecorEnabled);
  const leafColor = useThemeStore((s) => s.leafColor);
  const vineColor = useThemeStore((s) => s.vineColor);
  const background = useThemeStore((s) => s.currentTheme.colors.background);

  if (!enabled) return null;

  const full = density === 'full';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Sunlight filtering through the canopy */}
      <LinearGradient
        colors={[withAlpha(leafColor, 0.22), withAlpha(leafColor, 0.06), 'transparent']}
        locations={[0, 0.3, 0.6]}
        style={StyleSheet.absoluteFill}
      />
      {/* Damp undergrowth shadow */}
      <LinearGradient
        colors={['transparent', withAlpha(shade(leafColor, -0.6), 0.35)]}
        locations={[0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Leaves kept faint so text stays readable over them */}
      <View style={[styles.layer, { opacity: 0.55 }]}>
        <SwayingLeafCluster
          width={200}
          height={200}
          leaves={TOP_LEFT}
          color={leafColor}
          style={[styles.abs, { top: -30, left: -40 }]}
          transformOrigin="0% 0%"
          degrees={5.0}
          duration={1900}
          delay={0}
          driftPx={4.0}
        />
        <SwayingLeafCluster
          width={180}
          height={170}
          leaves={TOP_RIGHT}
          color={leafColor}
          style={[styles.abs, { top: -20, right: -30 }]}
          transformOrigin="100% 0%"
          degrees={4.6}
          duration={2150}
          delay={350}
          driftPx={3.5}
        />
        {full && (
          <>
            <SwayingLeafCluster
              width={200}
              height={200}
              leaves={BOTTOM_LEFT}
              color={leafColor}
              style={[styles.abs, { bottom: 40, left: -50 }]}
              transformOrigin="0% 100%"
              degrees={5.4}
              duration={1750}
              delay={650}
              driftPx={4.5}
            />
            <SwayingLeafCluster
              width={190}
              height={200}
              leaves={BOTTOM_RIGHT}
              color={leafColor}
              style={[styles.abs, { bottom: 30, right: -40 }]}
              transformOrigin="100% 100%"
              degrees={4.8}
              duration={2050}
              delay={950}
              driftPx={4.0}
            />
          </>
        )}
      </View>

      <View style={[styles.layer, { opacity: 0.7 }]}>
        <SwayingVine left={width * 0.04} width={70} height={Math.min(260, height * 0.3)} seed={1} degrees={4.2} duration={2000} vineColor={vineColor} leafColor={leafColor} />
        {full && (
          <SwayingVine left={width * 0.55} width={60} height={Math.min(150, height * 0.18)} seed={2} degrees={5.5} duration={1650} vineColor={vineColor} leafColor={leafColor} />
        )}
        <SwayingVine left={width - 78} width={70} height={Math.min(320, height * 0.38)} seed={3} degrees={3.6} duration={2300} vineColor={vineColor} leafColor={leafColor} />
      </View>

      {/* Soft fade so the decor melts into the chosen background colour */}
      <LinearGradient
        colors={['transparent', withAlpha(background, 0.35), 'transparent']}
        locations={[0.25, 0.5, 0.75]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  abs: {
    position: 'absolute',
  },
  vine: {
    position: 'absolute',
    top: -4,
  },
});
