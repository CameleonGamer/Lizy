import { create } from 'zustand';
import { Badge, GamificationState } from '@/types';

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_homework',
    title: 'Premier pas',
    description: 'Complète ton premier devoir sur Lizy',
    icon: 'CheckCircle2',
  },
  {
    id: 'streak_3',
    title: 'Régulier',
    description: 'Atteins 3 jours consécutifs d’utilisation',
    icon: 'Flame',
  },
  {
    id: 'streak_7',
    title: 'Inarrêtable',
    description: 'Atteins 7 jours consécutifs d’utilisation',
    icon: 'Zap',
  },
  {
    id: 'focus_master',
    title: 'Maître du Focus',
    description: 'Complète une session Pomodoro de 25 minutes',
    icon: 'Target',
  },
  {
    id: 'grade_ace',
    title: 'Major de Promo',
    description: 'Moyenne générale supérieure ou égale à 16/20',
    icon: 'Award',
  },
];

interface GamingStore extends GamificationState {
  addXp: (amount: number) => { newLevel: number; leveledUp: boolean };
  recordDailyActivity: () => void;
  unlockBadge: (badgeId: string) => boolean;
}

export const useGamingStore = create<GamingStore>((set, get) => ({
  xp: 45,
  level: 1,
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  unlockedBadges: [],

  addXp: (amount: number) => {
    const currentXp = get().xp;
    const currentLevel = get().level;
    const newXp = currentXp + amount;
    const newLevel = Math.floor(newXp / 100) + 1;
    const leveledUp = newLevel > currentLevel;

    set({ xp: newXp, level: newLevel });
    return { newLevel, leveledUp };
  },

  recordDailyActivity: () => {
    const today = new Date().toISOString().split('T')[0];
    const { lastActiveDate, streakDays } = get();

    if (lastActiveDate === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = lastActiveDate === yesterday ? streakDays + 1 : 1;

    set({
      streakDays: newStreak,
      lastActiveDate: today,
    });
    get().addXp(5); // +5 XP daily check-in
  },

  unlockBadge: (badgeId: string) => {
    const { unlockedBadges } = get();
    if (unlockedBadges.includes(badgeId)) return false;

    set({ unlockedBadges: [...unlockedBadges, badgeId] });
    get().addXp(20); // +20 XP bonus per badge
    return true;
  },
}));
