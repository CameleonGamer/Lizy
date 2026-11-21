import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores/useThemeStore';
import { GlassCard } from '@/components/glass/GlassCard';
import { SubjectAverage, Grade } from '@/types';
import { 
  PerformanceAnalyzer, 
  AcademicDiagnosis, 
  SubjectInsight 
} from '@/core/analytics/performanceAnalyzer';
import { 
  Target, 
  Sparkles, 
  TrendingUp, 
  Lightbulb, 
  CheckCircle2, 
  Zap, 
  Plus, 
  Minus,
  ChevronRight,
  Award
} from 'lucide-react-native';

interface ImprovementAdvisorCardProps {
  averages: SubjectAverage[];
  grades: Grade[];
  selectedSubject?: string | null;
  onSelectSubject?: (subject: string) => void;
}

export const ImprovementAdvisorCard: React.FC<ImprovementAdvisorCardProps> = ({
  averages,
  grades,
  selectedSubject: externalSelectedSubject,
  onSelectSubject,
}) => {
  const { currentTheme } = useThemeStore();
  const [internalSelected, setInternalSelected] = useState<string | null>(null);

  const diagnosis: AcademicDiagnosis = PerformanceAnalyzer.diagnose(averages, grades);

  const activeSubject = 
    externalSelectedSubject || 
    internalSelected || 
    diagnosis.top3StrategicLevers[0]?.subject || 
    averages[0]?.subject || 
    '';

  const selectedInsight: SubjectInsight | undefined = 
    [...diagnosis.top3StrategicLevers, ...diagnosis.strengths, ...diagnosis.solidSubjects, ...diagnosis.improvementPriorities]
      .find((i) => i.subject === activeSubject) || diagnosis.top3StrategicLevers[0];

  // Simulation state for selected subject
  const [simulatedOffset, setSimulatedOffset] = useState<number>(2.0);

  if (!averages || averages.length === 0) return null;

  const currentAvg = selectedInsight?.average ?? 12;
  const targetScore = Math.min(20, Math.max(0, Number((currentAvg + simulatedOffset).toFixed(1))));

  const simulation = PerformanceAnalyzer.simulateNewAverage(
    averages,
    activeSubject,
    targetScore,
    grades
  );

  const handleSelectSubject = (subject: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setInternalSelected(subject);
    setSimulatedOffset(2.0);
    if (onSelectSubject) {
      onSelectSubject(subject);
    }
  };

  const adjustSimulation = (delta: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSimulatedOffset((prev) => Math.max(-4, Math.min(6, prev + delta)));
  };

  return (
    <GlassCard style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <Target size={20} color={currentTheme.colors.primary} />
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>
            Stratégie & Pistes d'Amélioration
          </Text>
        </View>
        <View style={[styles.badgePill, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
          <Sparkles size={12} color={currentTheme.colors.primary} />
          <Text style={[styles.badgeText, { color: currentTheme.colors.primary }]}>IA Diagnostic</Text>
        </View>
      </View>

      {/* Synthesis Note */}
      <Text style={[styles.summaryText, { color: currentTheme.colors.textMuted }]}>
        {diagnosis.overallSummary}
      </Text>

      {/* Top 3 Strategic Levers Section */}
      <View style={styles.leversSection}>
        <Text style={[styles.sectionSubtitle, { color: currentTheme.colors.text }]}>
          🎯 3 Leviers Prioritaires d'Impact
        </Text>

        <View style={styles.leversList}>
          {diagnosis.top3StrategicLevers.map((lever, idx) => {
            const isSelected = lever.subject === activeSubject;
            return (
              <TouchableOpacity
                key={`lever-${lever.subject}-${idx}`}
                activeOpacity={0.8}
                onPress={() => handleSelectSubject(lever.subject)}
                style={[
                  styles.leverItem,
                  {
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : currentTheme.colors.surfaceGlass,
                    borderColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.borderGlass,
                  },
                ]}
              >
                <View style={styles.leverLeft}>
                  <View style={[styles.rankCircle, { backgroundColor: isSelected ? currentTheme.colors.primary : 'rgba(255, 255, 255, 0.1)' }]}>
                    <Text style={styles.rankText}>#{idx + 1}</Text>
                  </View>
                  <View>
                    <Text numberOfLines={1} style={[styles.leverSubject, { color: currentTheme.colors.text }]}>
                      {lever.subject}
                    </Text>
                    <Text style={[styles.leverScore, { color: currentTheme.colors.textMuted }]}>
                      Actuel : {lever.average.toFixed(1)}/20 (Coeff {lever.coefficient.toFixed(1)})
                    </Text>
                  </View>
                </View>

                <View style={styles.leverRight}>
                  <View style={[styles.impactPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <TrendingUp size={12} color="#10B981" />
                    <Text style={styles.impactText}>
                      +{lever.impactPotential.toFixed(2)} pt
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Subject Selector Horizontal Chips for exploring other subjects */}
      <View style={styles.chipScrollContainer}>
        <Text style={[styles.chipSectionLabel, { color: currentTheme.colors.textMuted }]}>
          Sélectionner une matière à analyser :
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {averages.map((a) => {
            const isSelected = a.subject === activeSubject;
            return (
              <TouchableOpacity
                key={`chip-${a.subject}`}
                onPress={() => handleSelectSubject(a.subject)}
                style={[
                  styles.subjectChip,
                  {
                    backgroundColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.surfaceGlass,
                    borderColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.borderGlass,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.subjectChipText,
                    { color: isSelected ? '#FFFFFF' : currentTheme.colors.text },
                  ]}
                >
                  {a.subject}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Detailed Methodological Advice for Selected Subject */}
      {selectedInsight && (
        <View style={[styles.adviceBox, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}>
          <View style={styles.adviceHeaderRow}>
            <Lightbulb size={18} color="#F59E0B" />
            <Text style={[styles.adviceHeaderTitle, { color: currentTheme.colors.text }]}>
              Conseils pour progresser en {selectedInsight.subject}
            </Text>
          </View>

          <Text style={[styles.adviceParagraph, { color: currentTheme.colors.textMuted }]}>
            {selectedInsight.advice}
          </Text>

          {/* Actionable checklists */}
          <View style={styles.actionItemsList}>
            {selectedInsight.actionItems.map((act, i) => (
              <View key={`act-${i}`} style={styles.actionRow}>
                <CheckCircle2 size={15} color={currentTheme.colors.primary} />
                <Text style={[styles.actionText, { color: currentTheme.colors.text }]}>
                  {act}
                </Text>
              </View>
            ))}
          </View>

          {/* Real-time What-If Average Simulator */}
          <View style={[styles.simulatorCard, { backgroundColor: 'rgba(0, 0, 0, 0.25)', borderColor: currentTheme.colors.borderGlass }]}>
            <View style={styles.simTopRow}>
              <View style={styles.simLabelGroup}>
                <Zap size={15} color={currentTheme.colors.accent} />
                <Text style={[styles.simTitle, { color: currentTheme.colors.text }]}>
                  Simulateur de moyenne
                </Text>
              </View>

              <View style={styles.simControls}>
                <TouchableOpacity onPress={() => adjustSimulation(-0.5)} style={styles.simBtn}>
                  <Minus size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={[styles.simTargetScore, { color: currentTheme.colors.accent }]}>
                  {targetScore.toFixed(1)}/20
                </Text>
                <TouchableOpacity onPress={() => adjustSimulation(0.5)} style={styles.simBtn}>
                  <Plus size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.simResultText, { color: currentTheme.colors.textMuted }]}>
              Si votre note passe de{' '}
              <Text style={{ color: currentTheme.colors.text, fontWeight: '700' }}>
                {currentAvg.toFixed(1)}
              </Text>{' '}
              à{' '}
              <Text style={{ color: currentTheme.colors.accent, fontWeight: '700' }}>
                {targetScore.toFixed(1)}/20
              </Text>
              , votre moyenne générale passe à{' '}
              <Text style={{ color: '#10B981', fontWeight: '800' }}>
                {simulation.simulatedAverage.toFixed(2)}/20
              </Text>{' '}
              ({simulation.diff >= 0 ? `+${simulation.diff.toFixed(2)}` : simulation.diff.toFixed(2)} pt).
            </Text>
          </View>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 19,
  },
  leversSection: {
    gap: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  leversList: {
    gap: 8,
  },
  leverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  leverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  leverSubject: {
    fontSize: 14,
    fontWeight: '700',
  },
  leverScore: {
    fontSize: 12,
    marginTop: 2,
  },
  leverRight: {
    alignItems: 'flex-end',
  },
  impactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  impactText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  chipScrollContainer: {
    gap: 8,
  },
  chipSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipRow: {
    gap: 8,
  },
  subjectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  subjectChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  adviceBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adviceHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  adviceParagraph: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionItemsList: {
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  actionText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  simulatorCard: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  simTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  simLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  simTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  simControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simTargetScore: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 55,
    textAlign: 'center',
  },
  simResultText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
