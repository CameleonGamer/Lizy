import { Platform } from 'react-native';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useThemeStore } from '@/stores/useThemeStore';

/**
 * - 'native'    : real iOS 26+ Liquid Glass (UIGlassEffect through expo-glass-effect)
 * - 'simulated' : our own liquid glass (blur + specular light + jelly press) for
 *                 Android, older iOS, Expo Go and web
 * - 'solid'     : the user switched Liquid Glass off — flat, opaque controls
 */
export type GlassMode = 'native' | 'simulated' | 'solid';

let nativeAvailable: boolean | null = null;

export function isNativeLiquidGlassAvailable(): boolean {
  if (nativeAvailable === null) {
    try {
      nativeAvailable = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
    } catch {
      // Native module missing (e.g. Expo Go without the module) -> fallback.
      nativeAvailable = false;
    }
  }
  return nativeAvailable;
}

export function useGlassMode(): GlassMode {
  const enabled = useThemeStore((s) => s.liquidGlassEnabled);
  if (!enabled) return 'solid';
  return isNativeLiquidGlassAvailable() ? 'native' : 'simulated';
}
