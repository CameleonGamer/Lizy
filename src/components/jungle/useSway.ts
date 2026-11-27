import { useEffect } from 'react';
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '@/stores/useThemeStore';
import { WindIntensity } from '@/types';

const WIND_PROFILE: Record<WindIntensity, { ampScale: number; durScale: number; driftScale: number }> = {
  gentle: { ampScale: 0.65, durScale: 1.4, driftScale: 0.55 },
  breeze: { ampScale: 1.0, durScale: 1.0, driftScale: 1.0 },
  strong: { ampScale: 1.65, durScale: 0.65, driftScale: 1.65 },
};

export interface LeafWindOptions {
  /** Nominal half-amplitude rotation in degrees (for 'breeze'). */
  baseDegrees?: number;
  /** Nominal half-cycle duration in ms (swing from one side to the other). */
  baseDuration?: number;
  /** Initial phase delay in ms so leaf clusters ripple organically. */
  delay?: number;
  /** Subtle lateral wind sway in px. */
  driftPx?: number;
  /** Anchor point (e.g. '0% 0%', '100% 0%', '50% 0%'). */
  transformOrigin?: string;
}

/**
 * UI-thread Reanimated wind sway for vector leaves and hanging vines.
 * Reacts live to `leafWindEnabled` and `leafWindIntensity`, and cancels cleanly
 * with zero CPU overhead when disabled or when OS reduce-motion is enabled.
 */
export function useLeafWindStyle({
  baseDegrees = 5.0,
  baseDuration = 1950,
  delay = 0,
  driftPx = 3.5,
  transformOrigin = '50% 50%',
}: LeafWindOptions = {}) {
  const reducedMotion = useReducedMotion();
  const enabled = useThemeStore((s) => s.leafWindEnabled);
  const intensity = useThemeStore((s) => s.leafWindIntensity);

  const profile = WIND_PROFILE[intensity] ?? WIND_PROFILE.breeze;
  const active = enabled && !reducedMotion && baseDegrees > 0;

  const targetDeg = active ? baseDegrees * profile.ampScale : 0;
  const targetDrift = active ? driftPx * profile.driftScale : 0;
  const halfCycleMs = Math.max(450, Math.round(baseDuration * profile.durScale));

  const progress = useSharedValue(0);
  const ampDegSV = useSharedValue(targetDeg);
  const driftSV = useSharedValue(targetDrift);

  useEffect(() => {
    cancelAnimation(progress);

    if (!active) {
      ampDegSV.value = withTiming(0, { duration: 300 });
      driftSV.value = withTiming(0, { duration: 300 });
      progress.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });
      return;
    }

    ampDegSV.value = withTiming(targetDeg, { duration: 320 });
    driftSV.value = withTiming(targetDrift, { duration: 320 });

    const ease = Easing.inOut(Easing.sin);
    // Start cleanly from current position -> +1 -> -1 -> +1 endlessly on the UI worklet thread
    progress.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: Math.round(halfCycleMs * 0.5), easing: ease }),
        withRepeat(withTiming(-1, { duration: halfCycleMs, easing: ease }), -1, true)
      )
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [active, targetDeg, targetDrift, halfCycleMs, delay, progress, ampDegSV, driftSV]);

  return useAnimatedStyle(() => {
    'worklet';
    const angle = progress.value * ampDegSV.value;
    const tx = progress.value * driftSV.value;
    const ty = Math.abs(progress.value) * (driftSV.value * 0.25);

    return {
      transformOrigin,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { rotate: `${angle}deg` },
      ],
    };
  }, [transformOrigin]);
}
