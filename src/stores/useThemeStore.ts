import { create } from 'zustand';
import { AppTheme, ThemePresetName } from '@/types';
import { THEME_PRESETS } from '@/core/theme/presets';

interface ThemeState {
  currentTheme: AppTheme;
  setPreset: (preset: ThemePresetName) => void;
  updateCustomTheme: (partial: Partial<AppTheme>) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  currentTheme: THEME_PRESETS.Midnight,

  setPreset: (preset: ThemePresetName) => {
    const selected = THEME_PRESETS[preset] || THEME_PRESETS.Midnight;
    set({ currentTheme: selected });
  },

  updateCustomTheme: (partial: Partial<AppTheme>) => {
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
}));
