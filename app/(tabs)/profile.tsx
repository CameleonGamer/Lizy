import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  Platform 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores/useThemeStore';
import { useGamingStore, INITIAL_BADGES } from '@/stores/useGamingStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { GlassCard } from '@/components/glass/GlassCard';
import { THEME_PRESETS } from '@/core/theme/presets';
import { ThemePresetName } from '@/types';
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  Palette, 
  ShieldCheck, 
  Trash2, 
  Target, 
  CheckCircle2, 
  Award,
  Zap,
  Lock
} from 'lucide-react-native';

const THEME_OPTIONS: { name: ThemePresetName; color: string; desc: string }[] = [
  { name: 'Midnight', color: '#6366F1', desc: 'Espace Profond & Indigo' },
  { name: 'Ocean', color: '#0EA5E9', desc: 'Abysses & Cyan Électrique' },
  { name: 'Sakura', color: '#F43F5E', desc: 'Fleurs de Cerisier & Rose' },
  { name: 'Forest', color: '#10B981', desc: 'Forêt d’Émeraude & Sauge' },
  { name: 'Gold', color: '#F59E0B', desc: 'Or Impérial & Onyx' },
  { name: 'Minimal', color: '#E4E4E7', desc: 'Monochrome Pur' },
];

export default function ProfileScreen() {
  const { currentTheme, setPreset } = useThemeStore();
  const { xp, level, streakDays, unlockedBadges, addXp } = useGamingStore();
  const logout = useAuthStore((s) => s.logout);

  const [focusActive, setFocusActive] = useState(false);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60);

  const handleSelectTheme = (name: ThemePresetName) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setPreset(name);
  };

  const handleCompleteFocusSession = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    addXp(50); // +50 XP for completed Pomodoro focus
    Alert.alert('Session Terminée ! 🎉', 'Tu as gagné +50 XP pour cette session Focus.');
  };

  const handleWipeData = () => {
    Alert.alert(
      'Effacer toutes les données',
      'Cette action supprime définitivement tous les caches, identifiants et données locales chiffrées de cet appareil.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            Alert.alert('Données effacées', 'Toutes les données ont été détruites.');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: currentTheme.colors.textMuted }]}>
            ESPACE PERSONNEL & GAMING
          </Text>
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>Profil</Text>
        </View>

        {/* Level & XP Card */}
        <GlassCard style={styles.profileHeroCard}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatarCircle, { backgroundColor: currentTheme.colors.primary }]}>
              <Trophy size={32} color="#FFFFFF" />
            </View>

            <View style={styles.heroInfo}>
              <View style={styles.levelRow}>
                <Text style={[styles.levelTitle, { color: currentTheme.colors.text }]}>
                  Niveau {level}
                </Text>
                <View style={styles.streakPill}>
                  <Flame size={14} color="#F59E0B" />
                  <Text style={styles.streakText}>{streakDays} jours</Text>
                </View>
              </View>

              <Text style={[styles.rankTitle, { color: currentTheme.colors.primary }]}>
                {level >= 5 ? 'Maître des Études' : level >= 3 ? 'Initié Studieux' : 'Apprenti'}
              </Text>

              <Text style={[styles.xpCount, { color: currentTheme.colors.textMuted }]}>
                {xp} XP Total
              </Text>
            </View>
          </View>

          {/* XP Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabel, { color: currentTheme.colors.textMuted }]}>
                Niveau {level + 1}
              </Text>
              <Text style={[styles.progressLabel, { color: currentTheme.colors.textMuted }]}>
                {xp % 100} / 100 XP
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${xp % 100}%`,
                    backgroundColor: currentTheme.colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        </GlassCard>

        {/* Quick Focus Session Card */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.focusHeader}>
            <View style={styles.focusTitleRow}>
              <Target size={20} color={currentTheme.colors.accent} />
              <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
                Mode Focus Pomodoro
              </Text>
            </View>
            <View style={styles.focusRewardPill}>
              <Sparkles size={12} color="#F59E0B" />
              <Text style={styles.focusRewardText}>+50 XP</Text>
            </View>
          </View>

          <Text style={[styles.focusDesc, { color: currentTheme.colors.textMuted }]}>
            Booste ta concentration en éliminant les distractions. 25 minutes de travail intense.
          </Text>

          <TouchableOpacity
            onPress={handleCompleteFocusSession}
            style={[styles.focusButton, { backgroundColor: currentTheme.colors.primary }]}
          >
            <Text style={styles.focusButtonText}>Démarrer / Valider Focus (25 min)</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Badges & Achievements */}
        <GlassCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            Succès & Badges Débloqués
          </Text>

          <View style={styles.badgeGrid}>
            {INITIAL_BADGES.map((b) => {
              const isUnlocked = unlockedBadges.includes(b.id) || b.id === 'first_homework';
              return (
                <View
                  key={b.id}
                  style={[
                    styles.badgeItem,
                    {
                      backgroundColor: isUnlocked ? currentTheme.colors.surfaceGlass : 'rgba(255,255,255,0.03)',
                      borderColor: isUnlocked ? currentTheme.colors.borderGlass : 'rgba(255,255,255,0.05)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.badgeIconCircle,
                      {
                        backgroundColor: isUnlocked
                          ? 'rgba(99, 102, 241, 0.2)'
                          : 'rgba(255,255,255,0.05)',
                      },
                    ]}
                  >
                    {isUnlocked ? (
                      <Award size={20} color={currentTheme.colors.primary} />
                    ) : (
                      <Lock size={18} color={currentTheme.colors.textMuted} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.badgeTitle,
                      { color: isUnlocked ? currentTheme.colors.text : currentTheme.colors.textMuted },
                    ]}
                  >
                    {b.title}
                  </Text>
                  <Text style={[styles.badgeDesc, { color: currentTheme.colors.textMuted }]}>
                    {b.description}
                  </Text>
                </View>
              );
            })}
          </View>
        </GlassCard>

        {/* Theme Customizer Presets */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.themeHeaderRow}>
            <Palette size={20} color={currentTheme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              Thèmes & Apple Glass
            </Text>
          </View>

          <View style={styles.themesList}>
            {THEME_OPTIONS.map((t) => {
              const isSelected = currentTheme.preset === t.name;
              return (
                <TouchableOpacity
                  key={t.name}
                  onPress={() => handleSelectTheme(t.name)}
                  style={[
                    styles.themeRow,
                    {
                      backgroundColor: isSelected ? currentTheme.colors.surfaceGlass : 'transparent',
                      borderColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.borderGlass,
                    },
                  ]}
                >
                  <View style={[styles.colorDot, { backgroundColor: t.color }]} />
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeName, { color: currentTheme.colors.text }]}>
                      {t.name}
                    </Text>
                    <Text style={[styles.themeDesc, { color: currentTheme.colors.textMuted }]}>
                      {t.desc}
                    </Text>
                  </View>
                  {isSelected && (
                    <CheckCircle2 size={20} color={currentTheme.colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Privacy & Security Zero-Trust Actions */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.privacyHeader}>
            <ShieldCheck size={20} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              Sécurité & Confidentialité 100%
            </Text>
          </View>

          <Text style={[styles.privacyDesc, { color: currentTheme.colors.textMuted }]}>
            Lizy ne dispose d'aucun serveur distant, aucun tracker et aucun système d'analyse. Toutes vos notes et identifiants sont chiffrés sur la puce sécurisée de ce téléphone.
          </Text>

          <TouchableOpacity
            onPress={handleWipeData}
            style={[styles.wipeButton, { borderColor: currentTheme.colors.danger }]}
          >
            <Trash2 size={16} color={currentTheme.colors.danger} />
            <Text style={[styles.wipeText, { color: currentTheme.colors.danger }]}>
              Détruire toutes les données locales
            </Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 16,
  },
  header: {
    marginTop: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  profileHeroCard: {
    marginBottom: 0,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    gap: 4,
  },
  streakText: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 12,
  },
  rankTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  xpCount: {
    fontSize: 12,
    marginTop: 2,
  },
  progressSection: {
    marginTop: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionCard: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  focusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusRewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  focusRewardText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  focusDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  focusButton: {
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  badgeItem: {
    width: '48%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  badgeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  themeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  themesList: {
    gap: 8,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '700',
  },
  themeDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  privacyDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  wipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  wipeText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
