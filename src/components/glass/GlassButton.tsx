import React, { useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Insets,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from 'expo-glass-effect';
import { useThemeStore } from '@/stores/useThemeStore';
import { withAlpha, shade } from '@/core/theme/color';
import { useGlassMode } from './glassMode';
import { splitStyle } from './splitStyle';

export type GlassButtonVariant =
  /** Prominent coloured glass (main call-to-action). */
  | 'filled'
  /** Lightly tinted glass with a coloured rim (secondary / destructive). */
  | 'tinted'
  /** Neutral clear glass (icon buttons, pills). */
  | 'clear';

interface GlassButtonProps {
  children: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  /**
   * Layout style of the button (height, padding, radius, flexDirection…).
   * A `backgroundColor` here is used as the glass tint when `tint` is absent.
   */
  style?: StyleProp<ViewStyle>;
  /** Colour of the glass. Defaults to the theme primary colour. */
  tint?: string;
  variant?: GlassButtonVariant;
  hitSlop?: Insets | number;
  accessibilityLabel?: string;
  testID?: string;
}

const DEFAULT_RADIUS = 16;
const HIGHLIGHT = 70; // radius of the touch light, px

/**
 * Liquid Glass button.
 *
 * - iOS 26+: native Liquid Glass (`GlassView`, interactive: the system
 *   handles the refraction, the light following the finger and the bounce).
 * - Elsewhere: a simulated liquid glass — frosted body, specular rim, a light
 *   blob that follows the finger and a jelly squash & stretch on press.
 * - Liquid Glass disabled in settings: solid, flat button.
 */
export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  style,
  tint,
  variant = 'filled',
  hitSlop,
  accessibilityLabel,
  testID,
}) => {
  const mode = useGlassMode();
  const primary = useThemeStore((s) => s.currentTheme.colors.primary);

  const { outer, inner } = splitStyle(style);
  const {
    backgroundColor: styleBg,
    borderColor: styleBorder,
    borderWidth: styleBorderWidth,
    ...layout
  } = inner;
  const color = tint ?? (typeof styleBg === 'string' && styleBg !== 'transparent' ? styleBg : primary);
  const radius = (layout.borderRadius as number | undefined) ?? DEFAULT_RADIUS;

  // ---- animation state (simulated & solid modes) ----
  const press = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const touch = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const bodyRef = useRef<React.ComponentRef<typeof View>>(null);
  const origin = useRef({ x: 0, y: 0 });

  const moveLight = (e: GestureResponderEvent) => {
    touch.setValue({
      x: e.nativeEvent.pageX - origin.current.x - HIGHLIGHT,
      y: e.nativeEvent.pageY - origin.current.y - HIGHLIGHT,
    });
  };

  const handlePressIn = (e: GestureResponderEvent) => {
    if (mode === 'native') return;
    const { pageX, pageY } = e.nativeEvent;
    bodyRef.current?.measure((_x, _y, _w, _h, px, py) => {
      origin.current = { x: px, y: py };
      touch.setValue({ x: pageX - px - HIGHLIGHT, y: pageY - py - HIGHLIGHT });
    });
    Animated.parallel([
      Animated.spring(press, { toValue: 1, speed: 40, bounciness: 0, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    if (mode === 'native') return;
    Animated.parallel([
      // Low friction -> overshoot -> the "jelly" wobble when released.
      Animated.spring(press, { toValue: 0, friction: 3.2, tension: 170, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  };

  const pressableProps = {
    onPress,
    onLongPress,
    disabled,
    hitSlop,
    testID,
    accessibilityRole: 'button' as const,
    accessibilityLabel,
    accessibilityState: { disabled },
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
    style: outer,
  };

  // ---------- Native iOS 26 Liquid Glass ----------
  if (mode === 'native') {
    return (
      <Pressable {...pressableProps}>
        <GlassView
          // isInteractive can only be set at mount time.
          key={disabled ? 'glass-disabled' : 'glass-enabled'}
          glassEffectStyle={variant === 'clear' ? 'clear' : 'regular'}
          tintColor={variant === 'clear' ? undefined : withAlpha(color, variant === 'filled' ? 0.72 : 0.22)}
          isInteractive={!disabled}
          colorScheme="dark"
          style={[layout, styles.fill, { borderRadius: radius }]}
        >
          {children}
        </GlassView>
      </Pressable>
    );
  }

  const squash = {
    transform: [
      { scaleX: press.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.985, 1, 1.035] }) },
      { scaleY: press.interpolate({ inputRange: [-1, 0, 1], outputRange: [1.02, 1, 0.92] }) },
    ],
  };

  // ---------- Liquid Glass disabled: solid button ----------
  if (mode === 'solid') {
    const filled = variant === 'filled';
    return (
      <Pressable {...pressableProps}>
        <Animated.View
          ref={bodyRef}
          style={[
            layout,
            styles.fill,
            {
              borderRadius: radius,
              backgroundColor: filled ? color : withAlpha(color, variant === 'clear' ? 0.08 : 0.14),
              borderWidth: filled ? 0 : (styleBorderWidth ?? 1),
              borderColor: filled ? undefined : (styleBorder ?? withAlpha(color, 0.45)),
            },
            squash,
            disabled && styles.disabled,
          ]}
        >
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  // ---------- Simulated liquid glass ----------
  const bodyTint =
    variant === 'filled' ? withAlpha(color, 0.5) : variant === 'tinted' ? withAlpha(color, 0.16) : 'rgba(255,255,255,0.06)';
  const rim = variant === 'clear' ? 'rgba(255,255,255,0.28)' : withAlpha(shade(color, 0.45), variant === 'filled' ? 0.7 : 0.5);

  return (
    <Pressable {...pressableProps} onTouchMove={moveLight}>
      <Animated.View
        ref={bodyRef}
        style={[
          layout,
          styles.fill,
          styles.simBody,
          // On iOS the tint sits above the blur instead (a background below
          // a BlurView would be blurred into mud).
          { borderRadius: radius, backgroundColor: Platform.OS === 'ios' ? 'transparent' : bodyTint, borderColor: rim },
          squash,
          disabled && styles.disabled,
        ]}
      >
        {Platform.OS === 'ios' && <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />}
        {Platform.OS === 'ios' && <View style={[StyleSheet.absoluteFill, { backgroundColor: bodyTint }]} pointerEvents="none" />}

        {/* Specular sheen: light hits the top of the glass drop */}
        <LinearGradient
          colors={['rgba(255,255,255,0.38)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
          locations={[0, 0.42, 0.7]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Refracted light gathering at the bottom edge */}
        <LinearGradient
          colors={['transparent', withAlpha(shade(color, 0.6), variant === 'clear' ? 0.12 : 0.3)]}
          locations={[0.55, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Light blob following the finger */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.highlight,
            {
              opacity: glow,
              transform: [
                ...touch.getTranslateTransform(),
                { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
              ],
            },
          ]}
        />
        {/* Hairline at the top rim */}
        <View
          pointerEvents="none"
          style={[styles.topRim, { left: radius * 0.6, right: radius * 0.6 }]}
        />

        {children}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fill: {
    flexGrow: 1,
  },
  simBody: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  highlight: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: HIGHLIGHT * 2,
    height: HIGHLIGHT * 2,
    borderRadius: HIGHLIGHT,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  topRim: {
    position: 'absolute',
    top: 1,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  disabled: {
    opacity: 0.5,
  },
});
