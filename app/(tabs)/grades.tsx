import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Platform } from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { useDataStore } from '@/stores/useDataStore';
import { GlassCard } from '@/components/glass/GlassCard';
import { 
  TrendingUp, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Calendar 
} from 'lucide-react-native';

export default function GradesScreen() {
  const { currentTheme } = useThemeStore();
  const { generalAverage, averages, grades } = useDataStore();

  const strongSubjects = averages.filter((a) => a.average >= 15);
  const weakSubjects = averages.filter((a) => a.average < 14);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: currentTheme.colors.textMuted }]}>
            PERFORMANCE ACADÉMIQUE
          </Text>
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>Notes & Stats</Text>
        </View>

        {/* General Average & Prediction Card */}
        <GlassCard style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroLabel, { color: currentTheme.colors.textMuted }]}>
                MOYENNE GÉNÉRALE
              </Text>
              <Text style={[styles.heroGrade, { color: currentTheme.colors.text }]}>
                {generalAverage > 0 ? generalAverage.toFixed(2) : '--'}
                <Text style={styles.outOf}> / 20</Text>
              </Text>
            </View>

            <View style={[styles.predictionPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
              <TrendingUp size={14} color="#10B981" />
              <Text style={styles.predictionText}>
                {generalAverage > 0 ? "Synchronisé Pronote" : "En attente"}
              </Text>
            </View>
          </View>

          <View style={styles.predictionBox}>
            <Zap size={16} color={currentTheme.colors.accent} />
            <Text style={[styles.predictionExpl, { color: currentTheme.colors.textMuted }]}>
              {generalAverage > 0 
                ? `Moyenne générale officielle calculée sur vos évaluations récentes.`
                : `Connectez-vous à Pronote pour afficher vos vraies notes et moyennes.`}
            </Text>
          </View>
        </GlassCard>

        {/* Points Forts & Faibles (Widget Performance) */}
        {averages.length > 0 && (
          <View style={styles.performanceRow}>
            {/* Strong */}
            <GlassCard style={styles.halfCard}>
              <View style={styles.cardHeaderSmall}>
                <ArrowUpRight size={16} color="#10B981" />
                <Text style={[styles.perfTitle, { color: '#10B981' }]}>Points Forts</Text>
              </View>
              {strongSubjects.length > 0 ? (
                strongSubjects.map((s) => (
                  <View key={s.subject} style={styles.perfItem}>
                    <Text numberOfLines={1} style={[styles.perfSubject, { color: currentTheme.colors.text }]}>
                      {s.subject}
                    </Text>
                    <Text style={[styles.perfGrade, { color: '#10B981' }]}>
                      {s.average.toFixed(1)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.perfSubject, { color: currentTheme.colors.textMuted }]}>-</Text>
              )}
            </GlassCard>

            {/* Weak / To Improve */}
            <GlassCard style={styles.halfCard}>
              <View style={styles.cardHeaderSmall}>
                <ArrowDownRight size={16} color="#F59E0B" />
                <Text style={[styles.perfTitle, { color: '#F59E0B' }]}>À renforcer</Text>
              </View>
              {weakSubjects.length > 0 ? (
                weakSubjects.map((s) => (
                  <View key={s.subject} style={styles.perfItem}>
                    <Text numberOfLines={1} style={[styles.perfSubject, { color: currentTheme.colors.text }]}>
                      {s.subject}
                    </Text>
                    <Text style={[styles.perfGrade, { color: '#F59E0B' }]}>
                      {s.average.toFixed(1)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.perfSubject, { color: currentTheme.colors.textMuted }]}>-</Text>
              )}
            </GlassCard>
          </View>
        )}

        {/* Subject Breakdown with Visual Bars */}
        <GlassCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            Moyennes par Matière
          </Text>

          {averages.map((item) => (
            <View key={item.subject} style={styles.subjectRow}>
              <View style={styles.subjectHeader}>
                <Text style={[styles.subjectName, { color: currentTheme.colors.text }]}>
                  {item.subject}
                </Text>
                <View style={styles.gradeComparison}>
                  <Text style={[styles.subjectAvg, { color: currentTheme.colors.text }]}>
                    {item.average.toFixed(1)}
                  </Text>
                  <Text style={[styles.classAvg, { color: currentTheme.colors.textMuted }]}>
                    (classe: {item.classAverage?.toFixed(1)})
                  </Text>
                </View>
              </View>

              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${(item.average / 20) * 100}%`,
                      backgroundColor: item.color || currentTheme.colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </GlassCard>

        {/* Recent Grades History */}
        <GlassCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            Dernières Notes Reçues
          </Text>

          {grades.map((grade) => (
            <View key={grade.id} style={styles.gradeHistoryItem}>
              <View style={styles.gradeInfoCol}>
                <Text style={[styles.gradeSubject, { color: currentTheme.colors.text }]}>
                  {grade.subject}
                </Text>
                <Text style={[styles.gradeDesc, { color: currentTheme.colors.textMuted }]}>
                  {grade.description}
                </Text>
                <View style={styles.gradeDateRow}>
                  <Calendar size={11} color={currentTheme.colors.textMuted} />
                  <Text style={[styles.gradeDate, { color: currentTheme.colors.textMuted }]}>
                    {grade.date} • Coeff {grade.coefficient}
                  </Text>
                </View>
              </View>

              <View style={styles.gradeScoreCol}>
                <Text style={[styles.historyScore, { color: currentTheme.colors.primary }]}>
                  {grade.value}
                  <Text style={styles.historyOutOf}>/{grade.outOf}</Text>
                </Text>
                <Text style={[styles.historyClassAvg, { color: currentTheme.colors.textMuted }]}>
                  Moy. {grade.classAverage}
                </Text>
              </View>
            </View>
          ))}
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
  heroCard: {
    marginBottom: 0,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  heroGrade: {
    fontSize: 38,
    fontWeight: '800',
    marginTop: 4,
  },
  outOf: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  predictionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  predictionText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 12,
  },
  predictionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  predictionExpl: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  performanceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  perfTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  perfItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  perfSubject: {
    fontSize: 12,
    fontWeight: '500',
  },
  perfGrade: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  subjectRow: {
    marginBottom: 12,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '600',
  },
  gradeComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subjectAvg: {
    fontSize: 13,
    fontWeight: '700',
  },
  classAvg: {
    fontSize: 11,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  gradeHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  gradeInfoCol: {
    flex: 1,
  },
  gradeSubject: {
    fontSize: 14,
    fontWeight: '700',
  },
  gradeDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  gradeDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  gradeDate: {
    fontSize: 11,
  },
  gradeScoreCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  historyScore: {
    fontSize: 18,
    fontWeight: '800',
  },
  historyOutOf: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyClassAvg: {
    fontSize: 11,
    marginTop: 2,
  },
});
