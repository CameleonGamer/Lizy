import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useGamingStore } from '@/stores/useGamingStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { GlassCard } from '@/components/glass/GlassCard';
import { Trophy, Sparkles, Zap, ArrowRight, Check } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const LevelUpModal: React.FC = () => {
  const { currentTheme } = useThemeStore();
  const { pendingLevelUp, dismissLevelUp } = useGamingStore();

  if (pendingLevelUp === null) return null;

  const handleContinue = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    dismissLevelUp();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleContinue}>
      <View style={styles.overlay}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />

        <GlassCard style={styles.card} glowColor={currentTheme.colors.primary}>
          {/* Glowing Top Trophy Halo */}
          <View style={styles.iconHaloWrapper}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.trophyCircle}
            >
              <Trophy size={42} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.sparkleTop}>
              <Sparkles size={20} color="#FBBF24" />
            </View>
            <View style={styles.sparkleBottom}>
              <Zap size={18} color="#60A5FA" />
            </View>
          </View>

          {/* Badge */}
          <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
            <Sparkles size={12} color="#F59E0B" />
            <Text style={styles.badgeText}>PALIER DÉBLOQUÉ</Text>
          </View>

          {/* Titles */}
          <Text style={[styles.mainTitle, { color: currentTheme.colors.text }]}>
            Niveau {pendingLevelUp} Atteint !
          </Text>
          <Text style={[styles.subtitle, { color: currentTheme.colors.textMuted }]}>
            Félicitations ! Chaque devoir complété et session de travail te propulse vers l'excellence.
          </Text>

          {/* Level Perk Card */}
          <View style={[styles.perkBox, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}>
            <View style={styles.perkRow}>
              <View style={[styles.perkCheck, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Check size={14} color="#10B981" />
              </View>
              <Text style={[styles.perkText, { color: currentTheme.colors.text }]}>
                Nouveau rang élève validé
              </Text>
            </View>
            <View style={styles.perkRow}>
              <View style={[styles.perkCheck, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                <Sparkles size={14} color={currentTheme.colors.primary} />
              </View>
              <Text style={[styles.perkText, { color: currentTheme.colors.text }]}>
                Multiplicateur d'XP Pomodoro actif
              </Text>
            </View>
          </View>

          {/* Continue Action */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleContinue}
            style={[styles.continueButton, { backgroundColor: currentTheme.colors.primary }]}
          >
            <Text style={styles.continueButtonText}>Continuer</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={[styles.footnote, { color: currentTheme.colors.textMuted }]}>
            Cette animation peut être désactivée dans Profil › Paramètres
          </Text>
        </GlassCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 28,
  },
  iconHaloWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  trophyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  sparkleTop: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  sparkleBottom: {
    position: 'absolute',
    bottom: 2,
    left: -4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  perkBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 24,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footnote: {
    fontSize: 11,
    textAlign: 'center',
  },
});
