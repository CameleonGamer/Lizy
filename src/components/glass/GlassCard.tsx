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
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  borderRadius,
  intensity,
  disableGlass = false,
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
          borderColor: currentTheme.colors.borderGlass,
          backgroundColor: currentTheme.colors.surfaceGlass,
        },
        style,
      ]}
    >
      {!disableGlass && (
        <BlurView
          intensity={blurIntensity}
          tint="dark"
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
      )}

      {/* Subtle Apple Glass specular highlight on top border */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        pointerEvents="none"
      />

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
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  contentContainer: {
    padding: 16,
    zIndex: 2,
  },
});
