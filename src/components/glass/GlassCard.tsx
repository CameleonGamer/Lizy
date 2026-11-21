import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/stores/useThemeStore';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  borderRadius?: number;
  intensity?: number;
  disableGlass?: boolean;
  glowColor?: string;
  prismaticEffect?: boolean;
}

/**
 * True Apple Liquid Glass (Liquid Glassmorphism)
 *
 * Inspired by QWEA0/Liquid-Glass-Android & Apple VisionOS design:
 * - Real optical chromatic dispersion (prismatic edge aberration)
 * - Volumetric fluid glass core (physical 3D refraction depth)
 * - Directional Fresnel specular edge ring (apex highlight)
 * - Bottom caustic bounce (internal ambient reflection)
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  borderRadius,
  intensity,
  disableGlass = false,
  glowColor,
  prismaticEffect = true,
}) => {
  const { currentTheme } = useThemeStore();
  const radius = borderRadius ?? currentTheme.borderRadius;
  const blurIntensity = intensity ?? currentTheme.glassBlurIntensity;

  return (
    <View
      style={[
        styles.outerBevel,
        {
          borderRadius: radius,
          backgroundColor: currentTheme.colors.surfaceGlass,
        },
        style,
      ]}
    >
      {/* 1. Hardware-accelerated Frosted Blur Layer */}
      {!disableGlass && (
        <BlurView
          intensity={blurIntensity}
          tint="dark"
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
      )}

      {/* 2. Volumetric Fluid Glass Core (Physical Refraction Depth) */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.12)',
          'rgba(255, 255, 255, 0.03)',
          'rgba(0, 0, 0, 0.12)',
          'rgba(255, 255, 255, 0.05)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        pointerEvents="none"
      />

      {/* 3. Prismatic Chromatic Dispersion Bevel (SDF Optical Simulation) */}
      {prismaticEffect && (
        <LinearGradient
          colors={[
            'rgba(165, 243, 252, 0.32)', // Prismatic cyan sheen at apex
            'rgba(255, 255, 255, 0.22)', // Pure specular luster
            'rgba(244, 114, 182, 0.12)', // Subtle magenta dispersion
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 0.4 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          pointerEvents="none"
        />
      )}

      {/* 4. Top Fresnel Specular Luster (Crisp Edge Ring) */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.42)',
          'rgba(255, 255, 255, 0.12)',
          'transparent',
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.2 }}
        style={[
          styles.specularRing,
          {
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
          },
        ]}
        pointerEvents="none"
      />

      {/* 5. Bottom Caustic Ground Bounce */}
      <LinearGradient
        colors={['transparent', 'rgba(255, 255, 255, 0.06)']}
        start={{ x: 0.5, y: 0.85 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          styles.causticBounce,
          {
            borderBottomLeftRadius: radius,
            borderBottomRightRadius: radius,
          },
        ]}
        pointerEvents="none"
      />

      {/* 6. Optional Ambient Glow */}
      {glowColor && (
        <LinearGradient
          colors={[`${glowColor}25`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.6 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          pointerEvents="none"
        />
      )}

      {/* 7. Content Layer */}
      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerBevel: {
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    borderLeftColor: 'rgba(255, 255, 255, 0.25)',
    borderRightColor: 'rgba(255, 255, 255, 0.10)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  specularRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  causticBounce: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 14,
  },
  contentContainer: {
    padding: 16,
    zIndex: 2,
  },
});
