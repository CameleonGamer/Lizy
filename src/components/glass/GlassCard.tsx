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
 * Ultra-Luxurious Apple Liquid Glass (VisionOS & iOS 18 Specular Glass)
 *
 * Refined optical model:
 * 1. Hardware frosted blur depth (BlurView)
 * 2. Deep crystal glass tint with high transmissivity
 * 3. Continuous 3D volumetric light field (silky smooth light-to-shadow gradient)
 * 4. Micro-iridescent chromatic dispersion (< 7% opacity for genuine crystal optics, zero muddy glare)
 * 5. Razor-sharp 1px glass perimeter highlight (apex light incidence)
 * 6. Subtle ground caustic bounce at bottom rim
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
        styles.outerContainer,
        {
          borderRadius: radius,
          backgroundColor: currentTheme.colors.surfaceGlass,
          borderColor: currentTheme.colors.borderGlass,
        },
        style,
      ]}
    >
      {/* 1. Frosted Blur Background */}
      {!disableGlass && (
        <BlurView
          intensity={Platform.OS === 'android' ? Math.min(blurIntensity, 40) : blurIntensity}
          tint="dark"
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
      )}

      {/* 2. Volumetric Crystal Refraction (Smooth Light Falloff) */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.09)',
          'rgba(255, 255, 255, 0.02)',
          'rgba(0, 0, 0, 0.08)',
          'rgba(255, 255, 255, 0.04)',
        ]}
        locations={[0, 0.35, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        pointerEvents="none"
      />

      {/* 3. Micro-Iridescent Prismatic Rim (Ultra-Subtle Crystal Sheen) */}
      {prismaticEffect && (
        <LinearGradient
          colors={[
            'rgba(186, 230, 253, 0.08)', // Delicate Ice-Blue ray
            'rgba(255, 255, 255, 0.05)', // Neutral highlight
            'rgba(244, 114, 182, 0.04)', // Micro-violet dispersion
            'transparent',
          ]}
          locations={[0, 0.15, 0.35, 0.6]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.7 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          pointerEvents="none"
        />
      )}

      {/* 4. Top Glass Edge Highlight (Hairline Glint) */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.22)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          styles.topGlint,
          {
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
          },
        ]}
        pointerEvents="none"
      />

      {/* 5. Bottom Rim Caustic Reflection */}
      <LinearGradient
        colors={['transparent', 'rgba(255, 255, 255, 0.06)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          styles.bottomCaustic,
          {
            borderBottomLeftRadius: radius,
            borderBottomRightRadius: radius,
          },
        ]}
        pointerEvents="none"
      />

      {/* 6. Optional Ambient Theme Glow */}
      {glowColor && (
        <LinearGradient
          colors={[`${glowColor}18`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.7 }}
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
  topGlint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  bottomCaustic: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  contentContainer: {
    padding: 16,
    zIndex: 2,
  },
});
