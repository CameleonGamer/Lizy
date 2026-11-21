import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Storage from 'expo-sqlite/kv-store';
import { AppTheme, AppearanceSettings, ThemePresetName } from '@/types';
import { THEME_PRESETS } from '@/core/theme/presets';

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  presetName: 'Jungle',
  customBackground: null,
  leafColor: '#3E9B4F',
  vineColor: '#6B5232',
  jungleDecorEnabled: true,
  liquidGlassEnabled: true,
};

interface ThemeState extends AppearanceSettings {
  /** Resolved theme (preset + user overrides). Read this in components. */
  currentTheme: AppTheme;
  setPreset: (preset: ThemePresetName) => void;
  updateCustomTheme: (partial: Partial<AppTheme>) => void;
  setCustomBackground: (color: string | null) => void;
  setLeafColor: (color: string) => void;
  setVineColor: (color: string) => void;
  setJungleDecorEnabled: (enabled: boolean) => void;
  setLiquidGlassEnabled: (enabled: boolean) => void;
  resetAppearance: () => void;
}

function buildTheme(settings: Pick<AppearanceSettings, 'presetName' | 'customBackground'>): AppTheme {
  const base = THEME_PRESETS[settings.presetName] || THEME_PRESETS.Jungle;
  if (!settings.customBackground) return base;
  return {
    ...base,
    colors: { ...base.colors, background: settings.customBackground },
  };
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_APPEARANCE,
      currentTheme: buildTheme(DEFAULT_APPEARANCE),

      setPreset: (preset) => {
        const presetName = THEME_PRESETS[preset] ? preset : 'Jungle';
        set({ presetName, currentTheme: buildTheme({ presetName, customBackground: get().customBackground }) });
      },

      updateCustomTheme: (partial) => {
        set((state) => ({
          currentTheme: {
            ...state.currentTheme,
            ...partial,
            colors: {
              ...state.currentTheme.colors,
              ...(partial.colors || {}),
            },
          },
        }));
      },

      setCustomBackground: (customBackground) => {
        set({ customBackground, currentTheme: buildTheme({ presetName: get().presetName, customBackground }) });
      },

      setLeafColor: (leafColor) => set({ leafColor }),
      setVineColor: (vineColor) => set({ vineColor }),
      setJungleDecorEnabled: (jungleDecorEnabled) => set({ jungleDecorEnabled }),
      setLiquidGlassEnabled: (liquidGlassEnabled) => set({ liquidGlassEnabled }),

      resetAppearance: () => set({ ...DEFAULT_APPEARANCE, currentTheme: buildTheme(DEFAULT_APPEARANCE) }),
    }),
    {
      name: 'lizy-appearance',
      version: 1,
      storage: createJSONStorage(() => Storage),
      partialize: (s): AppearanceSettings => ({
        presetName: s.presetName,
        customBackground: s.customBackground,
        leafColor: s.leafColor,
        vineColor: s.vineColor,
        jungleDecorEnabled: s.jungleDecorEnabled,
        liquidGlassEnabled: s.liquidGlassEnabled,
      }),
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<AppearanceSettings>) };
        return { ...merged, currentTheme: buildTheme(merged) };
      },
    }
  )
);
