import React from 'react';
import { StyleSheet, View, ViewStyle, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/stores/useThemeStore';
import { CardFoliage, FoliageStyle } from '@/components/jungle/CardFoliage';
import { useGlassMode } from './glassMode';
import { splitStyle } from './splitStyle';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  intensity?: number;
  disableGlass?: boolean;
  glowColor?: string;
  prismaticEffect?: boolean;
  /**
   * Wrap the card in jungle leaves / a liana (only shown when the jungle
   * decor is enabled in settings).
   */
  foliage?: FoliageStyle;
}

/**
 * Content card.
 *
 * Cards are the *content* layer: following Apple's guidance, real Liquid
 * Glass is kept for controls (buttons, tab bar); cards use a frosted panel.
 * When the user disables Liquid Glass, cards become solid surfaces.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  borderRadius,
  intensity,
  disableGlass = false,
  glowColor,
  prismaticEffect = true,
  foliage,
}) => {
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const jungleDecorEnabled = useThemeStore((s) => s.jungleDecorEnabled);
  const mode = useGlassMode();
  const radius = borderRadius ?? currentTheme.borderRadius;
  const blurIntensity = intensity ?? currentTheme.glassBlurIntensity;
  const solid = mode === 'solid';
  const showFoliage = !!foliage && jungleDecorEnabled;

  const body = (bodyStyle: StyleProp<ViewStyle>) => (
    <View
      style={[
        styles.outerContainer,
        {
          borderRadius: radius,
          backgroundColor: solid ? currentTheme.colors.surface : currentTheme.colors.surfaceGlass,
          borderColor: solid ? currentTheme.colors.border : currentTheme.colors.borderGlass,
        },
        bodyStyle,
      ]}
    >
      {!solid && !disableGlass && (
        <BlurView
          intensity={Platform.OS === 'android' ? Math.min(blurIntensity, 40) : blurIntensity}
          tint="dark"
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
      )}

      {!solid && (
        <>
          {/* Volumetric light falloff */}
          <LinearGradient
            colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.08)', 'rgba(255,255,255,0.04)']}
            locations={[0, 0.35, 0.75, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {prismaticEffect && (
            <LinearGradient
              colors={['rgba(186,230,253,0.07)', 'rgba(255,255,255,0.04)', 'transparent']}
              locations={[0, 0.2, 0.6]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.7, y: 0.7 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          )}
          {/* Top hairline glint */}
          <LinearGradient
            colors={['rgba(255,255,255,0.22)', 'transparent']}
            style={[styles.topGlint, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]}
            pointerEvents="none"
          />
        </>
      )}

      {glowColor && (
        <LinearGradient
          colors={[`${glowColor}18`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.7 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      <View style={styles.contentContainer}>{children}</View>
    </View>
  );

  if (!showFoliage) return body(style);

  // With foliage, leaves must overflow the (clipped) card: wrap it.
  const { outer, inner } = splitStyle(style);
  return (
    <View style={[styles.foliageWrapper, outer]}>
      <CardFoliage variant={foliage} back />
      {body([inner, styles.fill])}
      <CardFoliage variant={foliage} />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  foliageWrapper: {
    position: 'relative',
  },
  fill: {
    flexGrow: 1,
  },
  topGlint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  contentContainer: {
    padding: 16,
    zIndex: 2,
  },
});
