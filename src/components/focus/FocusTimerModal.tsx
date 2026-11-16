import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  Alert 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/glass/GlassCard';
import { useThemeStore } from '@/stores/useThemeStore';
import { useGamingStore } from '@/stores/useGamingStore';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2 
} from 'lucide-react-native';

interface FocusTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

const DEFAULT_FOCUS_SECONDS = 25 * 60; // 25 minutes Pomodoro

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({ visible, onClose }) => {
  const { currentTheme } = useThemeStore();
  const { addXp, unlockBadge } = useGamingStore();

  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      handleSessionComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  const handleSessionComplete = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    const { leveledUp, newLevel } = addXp(50);
    unlockBadge('focus_master');

    Alert.alert(
      'Session Focus Terminée ! 🎯',
      leveledUp
        ? `Félicitations ! Tu passes au Niveau ${newLevel} (+50 XP).`
        : 'Super travail ! Tu as gagné +50 XP et débloqué le badge Maître du Focus.'
    );
    setSecondsLeft(DEFAULT_FOCUS_SECONDS);
  };

  const toggleRunning = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setIsRunning(false);
    setSecondsLeft(DEFAULT_FOCUS_SECONDS);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((DEFAULT_FOCUS_SECONDS - secondsLeft) / DEFAULT_FOCUS_SECONDS) * 100;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <GlassCard style={styles.timerCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={20} color={currentTheme.colors.accent} />
              <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                Mode Focus
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={currentTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Distraction-free badge */}
          <View style={[styles.dndBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
            <ShieldAlert size={14} color={currentTheme.colors.primary} />
            <Text style={[styles.dndText, { color: currentTheme.colors.primary }]}>
              Concentration maximale • Notifications en sourdine
            </Text>
          </View>

          {/* Big Digital Clock */}
          <View style={styles.clockContainer}>
            <Text style={[styles.clockText, { color: currentTheme.colors.text }]}>
              {timeFormatted}
            </Text>
            <Text style={[styles.statusText, { color: currentTheme.colors.textMuted }]}>
              {isRunning ? 'Session en cours...' : 'Prêt à travailler'}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%`, backgroundColor: currentTheme.colors.primary },
              ]}
            />
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              onPress={resetTimer}
              style={[styles.secondaryBtn, { borderColor: currentTheme.colors.borderGlass }]}
            >
              <RotateCcw size={20} color={currentTheme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleRunning}
              style={[styles.primaryBtn, { backgroundColor: currentTheme.colors.primary }]}
            >
              {isRunning ? (
                <Pause size={24} color="#FFFFFF" />
              ) : (
                <Play size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSessionComplete}
              style={[styles.secondaryBtn, { borderColor: currentTheme.colors.borderGlass }]}
            >
              <CheckCircle2 size={20} color={currentTheme.colors.success} />
            </TouchableOpacity>
          </View>

          {/* Reward Footnote */}
          <Text style={[styles.rewardFootnote, { color: currentTheme.colors.textMuted }]}>
            Termine 25 minutes de focus pour remporter <Text style={{ color: '#F59E0B', fontWeight: '700' }}>+50 XP</Text>
          </Text>
        </GlassCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 24,
  },
  timerCard: {
    padding: 24,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  dndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  dndText: {
    fontSize: 11,
    fontWeight: '700',
  },
  clockContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  clockText: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 28,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  primaryBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardFootnote: {
    fontSize: 12,
    textAlign: 'center',
  },
});
