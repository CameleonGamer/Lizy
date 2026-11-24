// ==========================================
// LIZY TYPES DEFINITIONS
// ==========================================

export type ThemePresetName =
  | 'Jungle'
  | 'Midnight'
  | 'Ocean'
  | 'Sakura'
  | 'Forest'
  | 'Gold'
  | 'Minimal';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceGlass: string;
  border: string;
  borderGlass: string;
  text: string;
  textMuted: string;
  success: string;
  warning: string;
  danger: string;
}

export interface AppTheme {
  id: string;
  name: string;
  preset: ThemePresetName;
  colors: ThemeColors;
  glassBlurIntensity: number;
  borderRadius: number;
}

/**
 * User-tunable appearance settings (persisted on device).
 */
export interface AppearanceSettings {
  presetName: ThemePresetName;
  /** Overrides the preset background colour when set. */
  customBackground: string | null;
  /** Main colour of the jungle foliage. */
  leafColor: string;
  /** Colour of the hanging vines (lianes). */
  vineColor: string;
  /** Show leaves & vines decorations. */
  jungleDecorEnabled: boolean;
  /** Liquid Glass buttons / bars. When off, controls become solid. */
  liquidGlassEnabled: boolean;
}

// ------------------------------------------
// Pronote Models
// ------------------------------------------
export interface PronoteUser {
  id: string;
  name: string;
  establishment: string;
  studentClass: string;
}

export interface Grade {
  id: string;
  subject: string;
  value: number;
  outOf: number;
  coefficient: number;
  classAverage?: number;
  max?: number;
  min?: number;
  date: string;
  description?: string;
}

export interface SubjectAverage {
  id?: string;
  subject: string;
  average: number;
  classAverage?: number;
  color?: string;
}

export interface HomeworkSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Homework {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  isPersonal: boolean;
  completed: boolean;
  estimatedMinutes?: number;
  subtasks: HomeworkSubtask[];
}

export interface TimetableLesson {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  startTime: string; // "08:00"
  endTime: string;   // "09:00"
  date?: string;     // "YYYY-MM-DD" or "DD/MM/YYYY"
  status?: 'normal' | 'cancelled' | 'moved' | 'modified';
  color?: string;
  isCustomEvent?: boolean;
}

export interface PronoteMessage {
  id: string;
  author: string;
  subject: string;
  content: string;
  date: string;
  read: boolean;
  category?: string;
  avatarColor?: string;
}

// ------------------------------------------
// Widgets System
// ------------------------------------------
export type WidgetType =
  | 'timetable'
  | 'homework'
  | 'general_average'
  | 'grade_chart'
  | 'performance_radar'
  | 'gaming_stats'
  | 'quick_focus'
  | 'quick_note'
  | 'countdown';

export type WidgetSize = '1x1' | '2x1' | '2x2' | '4x2' | '4x4';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title?: string;
  size: WidgetSize;
  order: number;
  customBackgroundColor?: string;
  customTextColor?: string;
  customBorderRadius?: number;
  showGlass: boolean;
}

export type LayoutPreset = 'minimalist' | 'complete' | 'performance' | 'gaming' | 'agenda' | 'custom';

// ------------------------------------------
// Gamification
// ------------------------------------------
export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface GamificationState {
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string;
  unlockedBadges: string[];
  rewardedHomeworkIds: string[];
  levelUpAnimationEnabled: boolean;
  pendingLevelUp: number | null;
}
