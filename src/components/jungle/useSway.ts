import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';

/** Whether the user asked the OS to reduce motion. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => mounted && setReduce(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/**
 * Gentle, endless back-and-forth rotation (wind in the jungle).
 * Returns an interpolated rotation string usable in a transform.
 */
export function useSway(degrees = 2.5, duration = 3600, delay = 0) {
  const reduce = useReduceMotion();
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce || degrees === 0) {
      value.setValue(0);
      return;
    }
    const ease = Easing.inOut(Easing.sin);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration, easing: ease, useNativeDriver: true, delay }),
        Animated.timing(value, { toValue: -1, duration: duration * 2, easing: ease, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration, easing: ease, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, degrees, duration, delay, value]);

  return value.interpolate({
    inputRange: [-1, 1],
    outputRange: [`-${degrees}deg`, `${degrees}deg`],
  });
}

/**
 * Sway hook that adapts in real-time to the user's wind animation settings.
 * Parameters:
 *  - baseDegrees: nominal sway amplitude
 *  - baseDuration: nominal sway cycle time
 *  - delay: phase offset for natural wave propagation
 */
export function useLeafWindSway(baseDegrees = 2.6, baseDuration = 3600, delay = 0) {
  const enabled = useThemeStore((s) => s.leafWindEnabled);
  const intensity = useThemeStore((s) => s.leafWindIntensity);

  let factor = 1.0;
  let durFactor = 1.0;

  if (!enabled) {
    factor = 0;
  } else if (intensity === 'gentle') {
    factor = 0.55; // gentle, subtle sway
    durFactor = 1.35; // slower, calmer wind
  } else if (intensity === 'breeze') {
    factor = 1.0; // natural balanced breeze
    durFactor = 1.0;
  } else if (intensity === 'strong') {
    factor = 1.85; // lively gust of wind
    durFactor = 0.72; // faster oscillation
  }

  const effectiveDegrees = baseDegrees * factor;
  const effectiveDuration = Math.round(baseDuration * durFactor);

  return useSway(effectiveDegrees, effectiveDuration, delay);
}
