import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform 
} from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useGamingStore } from '@/stores/useGamingStore';
import { useDataStore } from '@/stores/useDataStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { GlassCard } from '@/components/glass/GlassCard';
import { FocusTimerModal } from '@/components/focus/FocusTimerModal';
import { WidgetEditorModal } from '@/components/widgets/WidgetEditorModal';
import { LayoutPreset } from '@/types';
import { 
  Flame, 
  Sparkles, 
  Clock, 
  BookOpen, 
  SlidersHorizontal,
  CheckCircle2,
  Calendar,
  Target,
  BarChart2
} from 'lucide-react-native';

const LAYOUT_PRESETS: { label: string; value: LayoutPreset }[] = [
  { label: 'Complète', value: 'complete' },
  { label: 'Minimaliste', value: 'minimalist' },
  { label: 'Performance', value: 'performance' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Agenda', value: 'agenda' },
];

export default function DashboardScreen() {
  const { currentTheme } = useThemeStore();
  const { activeLayout, setLayoutPreset } = useWidgetStore();
  const { xp, level, streakDays } = useGamingStore();
  const { generalAverage, homework, timetable, toggleHomework } = useDataStore();
  const { user } = useAuthStore();

  const [focusModalVisible, setFocusModalVisible] = useState(false);
  const [editorModalVisible, setEditorModalVisible] = useState(false);

  const nextLesson = timetable[0];
  const pendingHomework = homework.filter((h) => !h.completed);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.greeting, { color: currentTheme.colors.textMuted }]}>
              BONJOUR, {user?.name ? user.name.toUpperCase() : 'ÉLÈVE'}
            </Text>
            <Text numberOfLines={1} style={[styles.appName, { color: currentTheme.colors.text }]}>
              {user?.establishment || 'Lizy Workspace'}
            </Text>
            {user?.studentClass && (
              <Text style={[styles.classSubtitle, { color: currentTheme.colors.accent }]}>
                {user.studentClass}
              </Text>
            )}
          </View>

          {/* Action Pills */}
          <View style={styles.headerPills}>
            <TouchableOpacity
              onPress={() => setEditorModalVisible(true)}
              style={[styles.editorPill, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}
            >
              <SlidersHorizontal size={14} color={currentTheme.colors.primary} />
            </TouchableOpacity>

            <View style={[styles.streakPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
              <Flame size={16} color="#F59E0B" />
              <Text style={styles.streakText}>{streakDays}j</Text>
            </View>

            <View style={[styles.levelPill, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}>
              <Sparkles size={14} color={currentTheme.colors.primary} />
              <Text style={[styles.levelText, { color: currentTheme.colors.text }]}>Niv. {level}</Text>
            </View>
          </View>
        </View>

        {/* Layout Selector Chips */}
        <View style={styles.layoutSelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {LAYOUT_PRESETS.map((p) => {
              const isSelected = activeLayout === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setLayoutPreset(p.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.surfaceGlass,
                      borderColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.borderGlass,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? '#FFFFFF' : currentTheme.colors.textMuted },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Dynamic Widgets Grid */}
        <View style={styles.grid}>
          {/* Quick Focus Mode Trigger Banner */}
          <TouchableOpacity activeOpacity={0.9} onPress={() => setFocusModalVisible(true)}>
            <GlassCard style={styles.focusBanner}>
              <View style={styles.focusBannerContent}>
                <View style={[styles.focusIconCircle, { backgroundColor: currentTheme.colors.primary }]}>
                  <Target size={22} color="#FFFFFF" />
                </View>
                <View style={styles.focusTextCol}>
                  <Text style={[styles.focusTitle, { color: currentTheme.colors.text }]}>
                    Lancer une Session Focus
                  </Text>
                  <Text style={[styles.focusSub, { color: currentTheme.colors.textMuted }]}>
                    25 min de concentration sans distraction • +50 XP
                  </Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* Gaming XP Banner */}
          {(activeLayout === 'complete' || activeLayout === 'gaming') && (
            <GlassCard style={styles.card}>
              <View style={styles.widgetHeader}>
                <View style={styles.titleRow}>
                  <Sparkles size={18} color={currentTheme.colors.primary} />
                  <Text style={[styles.widgetTitle, { color: currentTheme.colors.text }]}>Progression XP</Text>
                </View>
                <Text style={[styles.badgeText, { color: currentTheme.colors.primary }]}>Niveau {level}</Text>
              </View>

              <Text style={[styles.xpText, { color: currentTheme.colors.textMuted }]}>
                {xp % 100} / 100 XP vers le Niveau {level + 1}
              </Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${xp % 100}%`,
                      backgroundColor: currentTheme.colors.primary,
                    },
                  ]}
                />
              </View>
            </GlassCard>
          )}

          {/* General Average Widget */}
          {(activeLayout === 'complete' || activeLayout === 'performance') && (
            <GlassCard style={styles.card}>
              <View style={styles.widgetHeader}>
                <View style={styles.titleRow}>
                  <BarChart2 size={18} color={currentTheme.colors.success} />
                  <Text style={[styles.widgetTitle, { color: currentTheme.colors.text }]}>Moyenne Générale</Text>
                </View>
                <Text style={[styles.gradeValue, { color: currentTheme.colors.success }]}>
                  {generalAverage > 0 ? generalAverage.toFixed(2) : '--'}
                  <Text style={styles.gradeOutOf}>/20</Text>
                </Text>
              </View>
              <Text style={[styles.subText, { color: currentTheme.colors.textMuted }]}>
                {generalAverage > 0 ? "Moyenne synchronisée avec Pronote" : "En attente des premières notes synchronisées"}
              </Text>
            </GlassCard>
          )}

          {/* Next Lesson Widget */}
          {activeLayout !== 'gaming' && (
            <GlassCard style={styles.card}>
              <View style={styles.widgetHeader}>
                <View style={styles.titleRow}>
                  <Calendar size={18} color={currentTheme.colors.accent} />
                  <Text style={[styles.widgetTitle, { color: currentTheme.colors.text }]}>Prochain Cours</Text>
                </View>
                {nextLesson && (
                  <View style={[styles.timeBadge, { backgroundColor: currentTheme.colors.surfaceGlass }]}>
                    <Clock size={12} color={currentTheme.colors.accent} />
                    <Text style={[styles.timeText, { color: currentTheme.colors.accent }]}>
                      {nextLesson.startTime} - {nextLesson.endTime}
                    </Text>
                  </View>
                )}
              </View>

              {nextLesson ? (
                <>
                  <Text style={[styles.subjectName, { color: currentTheme.colors.text }]}>
                    {nextLesson.subject}
                  </Text>
                  <Text style={[styles.lessonDetails, { color: currentTheme.colors.textMuted }]}>
                    Salle {nextLesson.room} • {nextLesson.teacher}
                  </Text>
                </>
              ) : (
                <Text style={[styles.subText, { color: currentTheme.colors.textMuted }]}>
                  Aucun cours programmé pour le moment
                </Text>
              )}
            </GlassCard>
          )}

          {/* Pending Homework Widget */}
          <GlassCard style={styles.card}>
            <View style={styles.widgetHeader}>
              <View style={styles.titleRow}>
                <BookOpen size={18} color={currentTheme.colors.secondary} />
                <Text style={[styles.widgetTitle, { color: currentTheme.colors.text }]}>Devoirs à faire</Text>
              </View>
              <Text style={[styles.countBadge, { color: currentTheme.colors.secondary }]}>
                {pendingHomework.length} restants
              </Text>
            </View>

            {pendingHomework.length === 0 ? (
              <Text style={[styles.subText, { color: currentTheme.colors.textMuted, paddingVertical: 8 }]}>
                Aucun devoir à faire pour le moment ✨
              </Text>
            ) : (
              pendingHomework.map((hw) => (
                <TouchableOpacity
                  key={hw.id}
                  onPress={() => toggleHomework(hw.id)}
                  style={styles.hwRow}
                >
                  <CheckCircle2
                    size={20}
                    color={hw.completed ? currentTheme.colors.success : currentTheme.colors.textMuted}
                  />
                  <View style={styles.hwInfo}>
                    <Text style={[styles.hwTitle, { color: currentTheme.colors.text }]}>
                      {hw.title}
                    </Text>
                    <Text style={[styles.hwMeta, { color: currentTheme.colors.textMuted }]}>
                      {hw.subject} • Pour {hw.dueDate}
                    </Text>
                  </View>
                  {hw.isPersonal && (
                    <View style={styles.persoBadge}>
                      <Text style={styles.persoText}>Perso</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </GlassCard>
        </View>
      </ScrollView>

      {/* Focus Pomodoro Modal */}
      <FocusTimerModal
        visible={focusModalVisible}
        onClose={() => setFocusModalVisible(false)}
      />

      {/* Widget Editor Modal */}
      <WidgetEditorModal
        visible={editorModalVisible}
        onClose={() => setEditorModalVisible(false)}
      />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  classSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  headerPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editorPill: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  streakText: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 13,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  levelText: {
    fontWeight: '700',
    fontSize: 13,
  },
  layoutSelectorContainer: {
    marginBottom: 16,
  },
  chipScroll: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    gap: 16,
  },
  focusBanner: {
    marginBottom: 0,
  },
  focusBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  focusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusTextCol: {
    flex: 1,
  },
  focusTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  focusSub: {
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    marginBottom: 0,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  xpText: {
    fontSize: 12,
    marginBottom: 8,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  gradeValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  gradeOutOf: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  subText: {
    fontSize: 12,
    lineHeight: 18,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subjectName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  lessonDetails: {
    fontSize: 13,
  },
  countBadge: {
    fontSize: 13,
    fontWeight: '600',
  },
  hwRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  hwInfo: {
    flex: 1,
  },
  hwTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  hwMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  persoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  persoText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
});
