import React, { useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { LeafCluster } from './LeafCluster';
import { Vine } from './Vine';
import { LeafSpec } from './Leaf';
import { useLeafWindSway } from './useSway';

const CORNER_TL: LeafSpec[] = [
  { variant: 'monstera', x: 40, y: 46, rotate: -60, size: 54, tone: 1 },
  { variant: 'long', x: 42, y: 48, rotate: -100, size: 54 },
  { variant: 'fern', x: 46, y: 50, rotate: -135, size: 46, tone: 1 },
  { variant: 'tropical', x: 44, y: 44, rotate: -35, size: 34 },
];

const CORNER_BR: LeafSpec[] = [
  { variant: 'long', x: 50, y: 40, rotate: 140, size: 50, tone: 1 },
  { variant: 'heart', x: 48, y: 38, rotate: 95, size: 44 },
  { variant: 'fern', x: 46, y: 42, rotate: 178, size: 46 },
];

const CORNER_TR: LeafSpec[] = [
  { variant: 'tropical', x: 30, y: 40, rotate: 40, size: 40, tone: 1 },
  { variant: 'long', x: 28, y: 42, rotate: 80, size: 38 },
];

export type FoliageStyle = 'frame' | 'corner' | 'vine';

interface CardFoliageProps {
  variant: FoliageStyle;
  /** Rendered behind the card (true) or over its edges (false). */
  back?: boolean;
}

/**
 * Leaves & a liana wrapped around a card, like the jungle panels of the
 * mock-up. Absolutely positioned: the parent must be `position: relative`.
 */
export const CardFoliage: React.FC<CardFoliageProps> = ({ variant, back = false }) => {
  const leafColor = useThemeStore((s) => s.leafColor);
  const vineColor = useThemeStore((s) => s.vineColor);
  const [width, setWidth] = useState(0);

  const swayTL = useLeafWindSway(1.8, 3600, 200);
  const swayBR = useLeafWindSway(1.6, 3900, 600);
  const swayTR = useLeafWindSway(1.5, 3300, 400);
  const swayVine = useLeafWindSway(1.2, 3400, 100);

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  if (back) {
    // Big leaves peeking from behind the card.
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            styles.abs,
            {
              top: -34,
              left: -30,
              opacity: 0.95,
              transformOrigin: 'top left',
              transform: [{ rotate: swayTL }],
            },
          ]}
        >
          <LeafCluster width={90} height={90} leaves={CORNER_TL} color={leafColor} />
        </Animated.View>
        {variant === 'frame' && (
          <Animated.View
            style={[
              styles.abs,
              {
                bottom: -30,
                right: -26,
                opacity: 0.95,
                transformOrigin: 'bottom right',
                transform: [{ rotate: swayBR }],
              },
            ]}
          >
            <LeafCluster width={90} height={80} leaves={CORNER_BR} color={leafColor} />
          </Animated.View>
        )}
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {(variant === 'frame' || variant === 'vine') && width > 0 && (
        <Animated.View style={[styles.abs, { top: -6, left: 18, transformOrigin: 'top', transform: [{ rotate: swayVine }] }]}>
          <Vine kind="draped" width={width - 36} height={34} vineColor={vineColor} leafColor={leafColor} leafEvery={30} leafSize={24} seed={1} />
        </Animated.View>
      )}
      {variant !== 'vine' && (
        <Animated.View
          style={[
            styles.abs,
            {
              top: -22,
              right: -12,
              transformOrigin: 'top right',
              transform: [{ rotate: swayTR }],
            },
          ]}
        >
          <LeafCluster width={60} height={60} leaves={CORNER_TR} color={leafColor} />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
