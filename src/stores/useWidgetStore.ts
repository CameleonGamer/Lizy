import { create } from 'zustand';
import { WidgetConfig, LayoutPreset } from '@/types';

const PRESET_LAYOUTS: Record<LayoutPreset, WidgetConfig[]> = {
  minimalist: [
    { id: 'w-timetable', type: 'timetable', title: 'Planning du jour', size: '4x2', order: 0, showGlass: true },
    { id: 'w-homework', type: 'homework', title: 'Devoirs prioritaires', size: '4x2', order: 1, showGlass: true },
  ],
  complete: [
    { id: 'w-gaming', type: 'gaming_stats', title: 'Progression & XP', size: '2x1', order: 0, showGlass: true },
    { id: 'w-avg', type: 'general_average', title: 'Moyenne', size: '2x1', order: 1, showGlass: true },
    { id: 'w-timetable', type: 'timetable', title: 'Planning', size: '4x2', order: 2, showGlass: true },
    { id: 'w-homework', type: 'homework', title: 'Devoirs à faire', size: '4x2', order: 3, showGlass: true },
    { id: 'w-focus', type: 'quick_focus', title: 'Session Focus', size: '4x2', order: 4, showGlass: true },
    { id: 'w-radar', type: 'performance_radar', title: 'Radar de Performance', size: '4x2', order: 5, showGlass: true },
  ],
  performance: [
    { id: 'w-avg', type: 'general_average', title: 'Moyenne Générale', size: '4x2', order: 0, showGlass: true },
    { id: 'w-radar', type: 'performance_radar', title: 'Points Forts / Faibles', size: '4x2', order: 1, showGlass: true },
    { id: 'w-chart', type: 'grade_chart', title: 'Évolution des Notes', size: '4x2', order: 2, showGlass: true },
  ],
  gaming: [
    { id: 'w-gaming', type: 'gaming_stats', title: 'Niveau & Série de Jours', size: '4x2', order: 0, showGlass: true },
    { id: 'w-homework', type: 'homework', title: 'Devoirs (+10 XP)', size: '4x2', order: 1, showGlass: true },
    { id: 'w-focus', type: 'quick_focus', title: 'Mode Focus (+50 XP)', size: '4x2', order: 2, showGlass: true },
  ],
  agenda: [
    { id: 'w-timetable', type: 'timetable', title: 'Emploi du temps', size: '4x4', order: 0, showGlass: true },
    { id: 'w-homework', type: 'homework', title: 'Devoirs à rendre', size: '4x2', order: 1, showGlass: true },
  ],
  custom: [],
};

interface WidgetState {
  activeLayout: LayoutPreset;
  widgets: WidgetConfig[];
  setLayoutPreset: (preset: LayoutPreset) => void;
  updateWidget: (id: string, partial: Partial<WidgetConfig>) => void;
  reorderWidgets: (newWidgets: WidgetConfig[]) => void;
  removeWidget: (id: string) => void;
  addWidget: (widget: WidgetConfig) => void;
}

export const useWidgetStore = create<WidgetState>((set) => ({
  activeLayout: 'complete',
  widgets: PRESET_LAYOUTS.complete,

  setLayoutPreset: (preset: LayoutPreset) => {
    if (preset === 'custom') {
      set({ activeLayout: 'custom' });
    } else {
      set({
        activeLayout: preset,
        widgets: PRESET_LAYOUTS[preset] || PRESET_LAYOUTS.complete,
      });
    }
  },

  updateWidget: (id, partial) => {
    set((state) => ({
      widgets: state.widgets.map((w) => (w.id === id ? { ...w, ...partial } : w)),
    }));
  },

  reorderWidgets: (newWidgets) => {
    set({ widgets: newWidgets });
  },

  removeWidget: (id) => {
    set((state) => ({
      widgets: state.widgets.filter((w) => w.id !== id),
    }));
  },

  addWidget: (widget) => {
    set((state) => ({
      widgets: [...state.widgets, widget],
    }));
  },
}));
