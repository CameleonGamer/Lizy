import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  Dimensions, 
  Platform 
} from 'react-native';
import { router } from 'expo-router';
import { useThemeStore } from '@/stores/useThemeStore';
import { GlassCard } from '@/components/glass/GlassCard';
import { 
  Sparkles, 
  ShieldCheck, 
  SlidersHorizontal, 
  Trophy, 
  ArrowRight, 
  Check 
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Bienvenue sur Lizy',
    subtitle: 'L’expérience Pronote réinventée avec un design luxueux et moderne façon Apple Glass.',
    icon: Sparkles,
    badge: 'NOUVELLE GÉNÉRATION',
  },
  {
    title: 'Widgets 100% Sur-Mesure',
    subtitle: 'Personnalise chaque widget, change les couleurs, arrondis, positions et choisis tes layouts.',
    icon: SlidersHorizontal,
    badge: 'CUSTOMISATION TOTALE',
  },
  {
    title: 'Zéro Serveur, 100% Privé',
    subtitle: 'Aucune donnée scolaire ne quitte jamais ton téléphone. Chiffrement local matériel AES-256.',
    icon: ShieldCheck,
    badge: 'CONFIDENTIALITÉ MAXIMALE',
  },
  {
    title: 'Gagne de l’XP au Quotidien',
    subtitle: 'Valide tes devoirs, active le mode Focus et débloque des badges et des thèmes exclusifs.',
    icon: Trophy,
    badge: 'GAMIFICATION INTÉGRÉE',
  },
];

export default function OnboardingScreen() {
  const { currentTheme } = useThemeStore();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleNext = () => {
    if (currentSlideIndex < SLIDES.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const currentSlide = SLIDES[currentSlideIndex];
  const IconComponent = currentSlide.icon;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      <View style={styles.container}>
        {/* Top skip */}
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={styles.skipButton}
        >
          <Text style={[styles.skipText, { color: currentTheme.colors.textMuted }]}>Passer</Text>
        </TouchableOpacity>

        {/* Central Glass Card Feature */}
        <View style={styles.slideContainer}>
          <GlassCard style={styles.card}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass },
              ]}
            >
              <IconComponent size={48} color={currentTheme.colors.primary} />
            </View>

            <View style={[styles.badge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Text style={[styles.badgeText, { color: currentTheme.colors.primary }]}>
                {currentSlide.badge}
              </Text>
            </View>

            <Text style={[styles.title, { color: currentTheme.colors.text }]}>
              {currentSlide.title}
            </Text>

            <Text style={[styles.subtitle, { color: currentTheme.colors.textMuted }]}>
              {currentSlide.subtitle}
            </Text>
          </GlassCard>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          {/* Dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      idx === currentSlideIndex
                        ? currentTheme.colors.primary
                        : 'rgba(255, 255, 255, 0.15)',
                    width: idx === currentSlideIndex ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextButton, { backgroundColor: currentTheme.colors.primary }]}
          >
            {currentSlideIndex === SLIDES.length - 1 ? (
              <>
                <Text style={styles.nextButtonText}>Se Connecter</Text>
                <Check size={18} color="#FFFFFF" />
              </>
            ) : (
              <>
                <Text style={styles.nextButtonText}>Suivant</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 32,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginTop: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomNav: {
    gap: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
