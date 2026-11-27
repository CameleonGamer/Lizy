import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Platform,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Linking,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores/useThemeStore';
import { GlassButton } from '@/components/glass/GlassButton';
import { JungleBackground } from '@/components/jungle/JungleBackground';
import { useGamingStore, INITIAL_BADGES } from '@/stores/useGamingStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSecurityStore } from '@/stores/useSecurityStore';
import { GlassCard } from '@/components/glass/GlassCard';
import { THEME_PRESETS } from '@/core/theme/presets';
import { isNativeLiquidGlassAvailable } from '@/components/glass/glassMode';
import { ColorPicker } from '@/components/settings/ColorPicker';
import { DEFAULT_APPEARANCE } from '@/stores/useThemeStore';
import { ThemePresetName, WindIntensity } from '@/types';
import { withAlpha } from '@/core/theme/color';
import { LocalNotifications } from '@/core/notifications/notifications';
import { APP_VERSION, GITHUB_RELEASES_URL, GITHUB_REPO } from '@/constants/version';
import { checkForGithubUpdate, ReleaseInfo } from '@/core/updater/githubUpdater';
import { UpdateModal } from '@/components/updater/UpdateModal';
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
  Lock,
  EyeOff,
  Key,
  Shield,
  Smartphone,
  X,
  LogOut,
  Leaf,
  Droplets,
  RotateCcw,
  Bell,
  BellRing,
  RefreshCw,
  Rocket,
  ExternalLink,
  Download,
  Wind
} from 'lucide-react-native';

const THEME_OPTIONS: { name: ThemePresetName; color: string; desc: string }[] = [
  { name: 'Jungle', color: '#5DBB46', desc: 'Feuillages, Lianes & Lumière Dorée' },
  { name: 'Midnight', color: '#6366F1', desc: 'Espace Profond & Indigo' },
  { name: 'Ocean', color: '#0EA5E9', desc: 'Abysses & Cyan Électrique' },
  { name: 'Sakura', color: '#F43F5E', desc: 'Fleurs de Cerisier & Rose' },
  { name: 'Forest', color: '#10B981', desc: 'Forêt d’Émeraude & Sauge' },
  { name: 'Gold', color: '#F59E0B', desc: 'Or Impérial & Onyx' },
  { name: 'Minimal', color: '#E4E4E7', desc: 'Monochrome Pur' },
];

const WIND_INTENSITIES: { value: WindIntensity; label: string; icon: string; desc: string }[] = [
  { value: 'gentle', label: 'Brise', icon: '🍃', desc: 'Légère' },
  { value: 'breeze', label: 'Modéré', icon: '🌬️', desc: 'Naturelle' },
  { value: 'strong', label: 'Rafale', icon: '💨', desc: 'Dynamique' },
];

const LEAF_SWATCHES = ['#3E9B4F', '#5DBB46', '#2F7D32', '#86C232', '#1F6F5C', '#4FB0A5', '#B5C335', '#C2703D', '#C93F5B', '#8E6CC9'];
const VINE_SWATCHES = ['#6B5232', '#8A6B3D', '#4E3B24', '#5E7A3A', '#3E5C34', '#9C8A6A'];
const BACKGROUND_SWATCHES = ['#07170F', '#0B1F14', '#0E1A12', '#101C1F', '#1A1A12', '#1B1410', '#12101C', '#0A0F0D', '#16201A'];

export default function ProfileScreen() {
  const {
    currentTheme,
    setPreset,
    leafColor,
    vineColor,
    customBackground,
    jungleDecorEnabled,
    liquidGlassEnabled,
    leafWindEnabled,
    leafWindIntensity,
    setLeafColor,
    setVineColor,
    setCustomBackground,
    setJungleDecorEnabled,
    setLiquidGlassEnabled,
    setLeafWindEnabled,
    setLeafWindIntensity,
    resetAppearance,
  } = useThemeStore();
  const nativeGlass = isNativeLiquidGlassAvailable();
  const { 
    xp, 
    level, 
    streakDays, 
    unlockedBadges, 
    addXp, 
    levelUpAnimationEnabled, 
    setLevelUpAnimationEnabled 
  } = useGamingStore();
  const logout = useAuthStore((s) => s.logout);
  const { 
    isLockEnabled, 
    isPrivacyShieldEnabled, 
    enableAppPin, 
    disableAppPin, 
    setPrivacyShield 
  } = useSecurityStore();

  const [focusActive, setFocusActive] = useState(false);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60);

  // Security PIN Modal states
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [disableModalVisible, setDisableModalVisible] = useState(false);
  const [disablePin, setDisablePin] = useState('');

  // GitHub Updater states
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [latestRelease, setLatestRelease] = useState<ReleaseInfo | null>(null);
  const [hasUpdateAvailable, setHasUpdateAvailable] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    // Subtle background check on mount
    checkForGithubUpdate().then((res) => {
      if (res.success && res.release) {
        setLatestRelease(res.release);
        setHasUpdateAvailable(res.updateAvailable);
      }
    });
  }, []);

  const handleCheckUpdate = async (silent = false) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setIsCheckingUpdate(true);
    setUpdateError(null);

    const res = await checkForGithubUpdate();
    setIsCheckingUpdate(false);

    if (res.success) {
      setLatestRelease(res.release ?? null);
      setHasUpdateAvailable(res.updateAvailable);
      if (!silent) {
        setUpdateModalVisible(true);
      }
    } else {
      setUpdateError(res.error || 'Erreur lors de la vérification.');
      if (!silent) {
        setUpdateModalVisible(true);
      }
    }
  };

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

  const handleTestNotifications = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const ok = await LocalNotifications.testNotification();
      if (ok) {
        Alert.alert(
          'Alerte envoyée ! 🔔',
          'Une notification de test a été déclenchée sur votre appareil. Lizy vous alertera automatiquement pour chaque nouvelle note, devoir ou sondage Pronote.'
        );
      } else {
        Alert.alert(
          'Autorisation requise',
          'Veuillez autoriser les notifications dans les réglages système de votre téléphone pour recevoir les alertes.'
        );
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de déclencher la notification de test.');
    }
  };

  const handleTogglePin = () => {
    if (isLockEnabled) {
      setDisablePin('');
      setDisableModalVisible(true);
    } else {
      setNewPin('');
      setConfirmPin('');
      setPinModalVisible(true);
    }
  };

  const handleSaveNewPin = async () => {
    if (newPin.length !== 4) {
      Alert.alert('Code PIN invalide', 'Le code PIN doit comporter exactement 4 chiffres.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Erreur', 'Les deux codes PIN saisis ne correspondent pas.');
      return;
    }
    const success = await enableAppPin(newPin);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sécurité activée 🔒', 'L’application est désormais verrouillée par votre code PIN.');
      setPinModalVisible(false);
      setNewPin('');
      setConfirmPin('');
    } else {
      Alert.alert('Erreur', 'Impossible d’enregistrer le code PIN dans le stockage sécurisé.');
    }
  };

  const handleConfirmDisablePin = async () => {
    if (disablePin.length !== 4) {
      Alert.alert('Code PIN requis', 'Veuillez saisir votre code PIN à 4 chiffres.');
      return;
    }
    const success = await disableAppPin(disablePin);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sécurité désactivée', 'Le verrouillage par code PIN a été désactivé.');
      setDisableModalVisible(false);
      setDisablePin('');
    } else {
      Alert.alert('Code PIN erroné', 'Le code PIN saisi est incorrect.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter de votre session Pronote ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
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
            router.replace('/(auth)/login');
            Alert.alert('Données effacées', 'Toutes les données ont été détruites.');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      <JungleBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: currentTheme.colors.textMuted }]}>
            ESPACE PERSONNEL & GAMING
          </Text>
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>Profil</Text>
        </View>

        {/* Level & XP Card */}
        <GlassCard style={styles.profileHeroCard} foliage="frame">
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

          <GlassButton
            onPress={handleCompleteFocusSession}
            style={[styles.focusButton, { backgroundColor: currentTheme.colors.primary }]}
          >
            <Text style={styles.focusButtonText}>Démarrer / Valider Focus (25 min)</Text>
          </GlassButton>
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
              Thèmes
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

        {/* Jungle appearance & Liquid Glass */}
        <GlassCard style={styles.sectionCard} foliage="vine">
          <View style={styles.themeHeaderRow}>
            <Leaf size={20} color={leafColor} />
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              Apparence Jungle
            </Text>
          </View>

          {/* Liquid Glass toggle */}
          <View style={[styles.secSettingRow, { borderColor: currentTheme.colors.borderGlass }]}>
            <View style={styles.secSettingLeft}>
              <Droplets size={18} color={liquidGlassEnabled ? currentTheme.colors.accent : currentTheme.colors.textMuted} />
              <View style={styles.secSettingTexts}>
                <Text style={[styles.secSettingTitle, { color: currentTheme.colors.text }]}>
                  Liquid Glass
                </Text>
                <Text style={[styles.secSettingSub, { color: currentTheme.colors.textMuted }]}>
                  {!liquidGlassEnabled
                    ? 'Désactivé • Boutons et barres pleins, sans transparence'
                    : nativeGlass
                      ? 'Activé • Verre liquide natif iOS'
                      : 'Activé • Verre liquide simulé (natif sur iOS 26+)'}
                </Text>
              </View>
            </View>
            <Switch
              value={liquidGlassEnabled}
              onValueChange={setLiquidGlassEnabled}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: currentTheme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Jungle decor toggle */}
          <View style={[styles.secSettingRow, { borderColor: currentTheme.colors.borderGlass }]}>
            <View style={styles.secSettingLeft}>
              <Leaf size={18} color={jungleDecorEnabled ? leafColor : currentTheme.colors.textMuted} />
              <View style={styles.secSettingTexts}>
                <Text style={[styles.secSettingTitle, { color: currentTheme.colors.text }]}>
                  Feuilles & lianes
                </Text>
                <Text style={[styles.secSettingSub, { color: currentTheme.colors.textMuted }]}>
                  {jungleDecorEnabled ? 'Affichées autour des écrans et des cartes' : 'Masquées • Interface épurée'}
                </Text>
              </View>
            </View>
            <Switch
              value={jungleDecorEnabled}
              onValueChange={setJungleDecorEnabled}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: leafColor }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Leaf Wind Sway toggle */}
          <View style={[styles.secSettingRow, { borderColor: currentTheme.colors.borderGlass }]}>
            <View style={styles.secSettingLeft}>
              <Wind size={18} color={leafWindEnabled ? (jungleDecorEnabled ? leafColor : currentTheme.colors.primary) : currentTheme.colors.textMuted} />
              <View style={styles.secSettingTexts}>
                <Text style={[styles.secSettingTitle, { color: currentTheme.colors.text }]}>
                  Vent sur les feuilles
                </Text>
                <Text style={[styles.secSettingSub, { color: currentTheme.colors.textMuted }]}>
                  {leafWindEnabled
                    ? 'Animation active • Feuilles et lianes oscillent doucement'
                    : 'Désactivé • Végétation statique (économie de batterie)'}
                </Text>
              </View>
            </View>
            <Switch
              value={leafWindEnabled}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLeafWindEnabled(val);
              }}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: jungleDecorEnabled ? leafColor : currentTheme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Wind Intensity Selector (visible when wind is enabled) */}
          {leafWindEnabled && (
            <View style={[styles.windIntensityContainer, { borderColor: currentTheme.colors.borderGlass }]}>
              <Text style={[styles.windIntensityLabel, { color: currentTheme.colors.textMuted }]}>
                Intensité du vent
              </Text>
              <View style={styles.windChipsRow}>
                {WIND_INTENSITIES.map((opt) => {
                  const isSelected = leafWindIntensity === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setLeafWindIntensity(opt.value);
                      }}
                      style={[
                        styles.windChip,
                        {
                          backgroundColor: isSelected
                            ? withAlpha(leafColor, 0.22)
                            : 'rgba(255, 255, 255, 0.04)',
                          borderColor: isSelected ? leafColor : currentTheme.colors.borderGlass,
                        },
                      ]}
                    >
                      <Text style={styles.windChipIcon}>{opt.icon}</Text>
                      <Text
                        style={[
                          styles.windChipLabel,
                          {
                            color: isSelected ? currentTheme.colors.text : currentTheme.colors.textMuted,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={[styles.windChipDesc, { color: currentTheme.colors.textMuted }]}>
                        {opt.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <ColorPicker
            label="Couleur des feuilles"
            value={leafColor}
            swatches={LEAF_SWATCHES}
            onChange={setLeafColor}
          />
          <ColorPicker
            label="Couleur des lianes"
            value={vineColor}
            swatches={VINE_SWATCHES}
            onChange={setVineColor}
          />
          <ColorPicker
            label="Couleur du fond"
            description={customBackground ? 'Personnalisée' : 'Celle du thème'}
            value={currentTheme.colors.background}
            swatches={BACKGROUND_SWATCHES}
            onChange={setCustomBackground}
            onReset={() => setCustomBackground(null)}
            isDefault={!customBackground}
          />

          <GlassButton
            variant="clear"
            onPress={resetAppearance}
            disabled={
              leafColor === DEFAULT_APPEARANCE.leafColor &&
              vineColor === DEFAULT_APPEARANCE.vineColor &&
              !customBackground &&
              jungleDecorEnabled &&
              liquidGlassEnabled &&
              leafWindEnabled &&
              leafWindIntensity === DEFAULT_APPEARANCE.leafWindIntensity
            }
            style={styles.resetAppearanceBtn}
          >
            <RotateCcw size={16} color={currentTheme.colors.text} />
            <Text style={[styles.resetAppearanceText, { color: currentTheme.colors.text }]}>
              Réinitialiser l'apparence
            </Text>
          </GlassButton>
        </GlassCard>

        {/* Gamification & Animations Settings */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.privacyHeader}>
            <Trophy size={20} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              Gamification & Animations
            </Text>
          </View>

          {/* Level Up Animation Switch */}
          <View style={[styles.secSettingRow, { borderColor: currentTheme.colors.borderGlass }]}>
            <View style={styles.secSettingLeft}>
              <Sparkles size={18} color={levelUpAnimationEnabled ? '#F59E0B' : currentTheme.colors.textMuted} />
              <View style={styles.secSettingTexts}>
                <Text style={[styles.secSettingTitle, { color: currentTheme.colors.text }]}>
                  Animation de montée de niveau
                </Text>
                <Text style={[styles.secSettingSub, { color: currentTheme.colors.textMuted }]}>
                  {levelUpAnimationEnabled
                    ? 'Activée • Célébration affichée lors des passages de niveau'
                    : 'Désactivée • Montée de niveau silencieuse'}
                </Text>
              </View>
            </View>
            <Switch
              value={levelUpAnimationEnabled}
              onValueChange={setLevelUpAnimationEnabled}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#F59E0B' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>

        {/* Notifications & Alertes Pronote */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.privacyHeader}>
            <Bell size={20} color={currentTheme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              Notifications Pronote & Alertes
            </Text>
          </View>

          <View style={styles.securityHighlights}>
            <View style={[styles.secBadge, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}>
              <BellRing size={14} color="#10B981" />
              <Text style={[styles.secBadgeText, { color: currentTheme.colors.text }]}>Alertes Immédiates</Text>
            </View>
            <View style={[styles.secBadge, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}>
              <Shield size={14} color={currentTheme.colors.accent} />
              <Text style={[styles.secBadgeText, { color: currentTheme.colors.text }]}>100% Local / Sans Serveur Tiers</Text>
            </View>
          </View>

          <View style={styles.notifInfoList}>
            <View style={styles.notifInfoItem}>
              <Text style={[styles.notifBullet, { color: currentTheme.colors.primary }]}>🎯</Text>
              <Text style={[styles.notifInfoText, { color: currentTheme.colors.textMuted }]}>
                <Text style={{ color: currentTheme.colors.text, fontWeight: '700' }}>Nouvelles Notes : </Text>
                Notification instantanée dès publication avec coefficient et moyenne de classe.
              </Text>
            </View>
            <View style={styles.notifInfoItem}>
              <Text style={[styles.notifBullet, { color: currentTheme.colors.primary }]}>📚</Text>
              <Text style={[styles.notifInfoText, { color: currentTheme.colors.textMuted }]}>
                <Text style={{ color: currentTheme.colors.text, fontWeight: '700' }}>Nouveaux Devoirs : </Text>
                Alerte dès qu’un devoir est assigné, avec date d'échéance et matière.
              </Text>
            </View>
            <View style={styles.notifInfoItem}>
              <Text style={[styles.notifBullet, { color: currentTheme.colors.primary }]}>📊</Text>
              <Text style={[styles.notifInfoText, { color: currentTheme.colors.textMuted }]}>
                <Text style={{ color: currentTheme.colors.text, fontWeight: '700' }}>Sondages & Infos : </Text>
                Alerte immédiate pour les sondages officiels et accusés de réception requis.
              </Text>
            </View>
          </View>

          <GlassButton
            onPress={handleTestNotifications}
            style={[styles.notifTestButton, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}
          >
            <Bell size={16} color={currentTheme.colors.primary} />
            <Text style={[styles.notifTestButtonText, { color: currentTheme.colors.text }]}>
              Envoyer une notification de test
            </Text>
          </GlassButton>
        </GlassCard>

        {/* Privacy & Security Zero-Trust Actions */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.privacyHeader}>
            <ShieldCheck size={20} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              Sécurité & Confidentialité 100%
            </Text>
          </View>

          {/* Security Architecture Highlights */}
          <View style={styles.securityHighlights}>
            <View style={[styles.secBadge, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}>
              <Key size={14} color={currentTheme.colors.primary} />
              <Text style={[styles.secBadgeText, { color: currentTheme.colors.text }]}>AES-256 Matériel</Text>
            </View>

            <View style={[styles.secBadge, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}>
              <Smartphone size={14} color="#10B981" />
              <Text style={[styles.secBadgeText, { color: currentTheme.colors.text }]}>Keystore / Keychain</Text>
            </View>

            <View style={[styles.secBadge, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}>
              <Shield size={14} color={currentTheme.colors.accent} />
              <Text style={[styles.secBadgeText, { color: currentTheme.colors.text }]}>Zéro Tiers / Zéro Cloud</Text>
            </View>
          </View>

          {/* App Lock PIN Toggle */}
          <View style={[styles.secSettingRow, { borderColor: currentTheme.colors.borderGlass }]}>
            <View style={styles.secSettingLeft}>
              <Lock size={18} color={isLockEnabled ? currentTheme.colors.primary : currentTheme.colors.textMuted} />
              <View style={styles.secSettingTexts}>
                <Text style={[styles.secSettingTitle, { color: currentTheme.colors.text }]}>
                  Verrouillage par code PIN
                </Text>
                <Text style={[styles.secSettingSub, { color: currentTheme.colors.textMuted }]}>
                  {isLockEnabled ? 'Actif • PIN requis à chaque ouverture' : 'Désactivé • Protège tes notes des regards'}
                </Text>
              </View>
            </View>
            <Switch
              value={isLockEnabled}
              onValueChange={handleTogglePin}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: currentTheme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Privacy Shield (Anti-Shoulder Surfing / Recent Apps) */}
          <View style={[styles.secSettingRow, { borderColor: currentTheme.colors.borderGlass }]}>
            <View style={styles.secSettingLeft}>
              <EyeOff size={18} color={isPrivacyShieldEnabled ? '#10B981' : currentTheme.colors.textMuted} />
              <View style={styles.secSettingTexts}>
                <Text style={[styles.secSettingTitle, { color: currentTheme.colors.text }]}>
                  Masquer en multitâche (Anti-regard)
                </Text>
                <Text style={[styles.secSettingSub, { color: currentTheme.colors.textMuted }]}>
                  Floute l'écran dans le sélecteur d'applications récentes
                </Text>
              </View>
            </View>
            <Switch
              value={isPrivacyShieldEnabled}
              onValueChange={setPrivacyShield}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Text style={[styles.privacyDesc, { color: currentTheme.colors.textMuted }]}>
            Lizy ne dispose d'aucun serveur distant, aucun tracker et aucun système d'analyse. Toutes vos notes, moyennes et devoirs sont stockés exclusivement sur la puce chiffrée de ce téléphone.
          </Text>

          <GlassButton variant="tinted" tint="#EF4444"
            onPress={handleLogout}
            style={[styles.logoutButton, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
          >
            <LogOut size={16} color="#EF4444" />
            <Text style={[styles.logoutText, { color: '#EF4444' }]}>
              Se déconnecter / Changer de compte
            </Text>
          </GlassButton>

          <GlassButton variant="tinted" tint={currentTheme.colors.danger}
            onPress={handleWipeData}
            style={[styles.wipeButton, { borderColor: currentTheme.colors.danger }]}
          >
            <Trash2 size={16} color={currentTheme.colors.danger} />
            <Text style={[styles.wipeText, { color: currentTheme.colors.danger }]}>
              Détruire toutes les données locales
            </Text>
          </GlassButton>
        </GlassCard>

        {/* Application & Mises à jour GitHub */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.privacyHeader}>
            <Sparkles size={20} color={currentTheme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              Mise à jour & Version
            </Text>
          </View>

          <View style={styles.updateStatusBox}>
            <View style={styles.updateVersionRow}>
              <View>
                <Text style={[styles.updateVersionLabel, { color: currentTheme.colors.textMuted }]}>
                  VERSION INSTALLÉE
                </Text>
                <Text style={[styles.updateVersionText, { color: currentTheme.colors.text }]}>
                  {APP_VERSION}
                </Text>
              </View>

              {hasUpdateAvailable ? (
                <View style={[styles.updateBadgeAlert, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' }]}>
                  <Rocket size={12} color="#F59E0B" />
                  <Text style={styles.updateBadgeAlertText}>Mise à jour dispo</Text>
                </View>
              ) : (
                <View style={[styles.updateBadgeOk, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}>
                  <CheckCircle2 size={12} color="#10B981" />
                  <Text style={styles.updateBadgeOkText}>À jour</Text>
                </View>
              )}
            </View>

            <Text style={[styles.updateDesc, { color: currentTheme.colors.textMuted }]}>
              Recherche les nouvelles versions publiées sur le dépôt GitHub officiel et installe directement la mise à jour APK sur votre appareil.
            </Text>

            <GlassButton
              onPress={() => handleCheckUpdate(false)}
              disabled={isCheckingUpdate}
              style={[
                styles.updateCheckButton,
                { backgroundColor: currentTheme.colors.primary }
              ]}
            >
              {isCheckingUpdate ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <RefreshCw size={16} color="#FFFFFF" />
              )}
              <Text style={styles.updateCheckButtonText}>
                {isCheckingUpdate ? 'Recherche sur GitHub...' : 'Rechercher une mise à jour'}
              </Text>
            </GlassButton>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Linking.openURL(GITHUB_RELEASES_URL)}
              style={styles.githubLinkRow}
            >
              <ExternalLink size={13} color={currentTheme.colors.textMuted} />
              <Text style={[styles.githubLinkText, { color: currentTheme.colors.textMuted }]}>
                Consulter les releases sur GitHub ({GITHUB_REPO})
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Modal Setup New PIN */}
        <Modal visible={pinModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalOverlay}
          >
            <GlassCard style={styles.modalCard} foliage="vine">
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Lock size={20} color={currentTheme.colors.primary} />
                  <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                    Créer un code PIN
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPinModalVisible(false)}>
                  <X size={20} color={currentTheme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalDesc, { color: currentTheme.colors.textMuted }]}>
                Choisissez un code PIN à 4 chiffres pour protéger l'accès à vos notes et devoirs.
              </Text>

              <TextInput
                style={[styles.pinInput, { color: currentTheme.colors.text, borderColor: currentTheme.colors.borderGlass }]}
                placeholder="Code PIN (4 chiffres)"
                placeholderTextColor={currentTheme.colors.textMuted}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                value={newPin}
                onChangeText={setNewPin}
              />

              <TextInput
                style={[styles.pinInput, { color: currentTheme.colors.text, borderColor: currentTheme.colors.borderGlass }]}
                placeholder="Confirmer le code PIN"
                placeholderTextColor={currentTheme.colors.textMuted}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                value={confirmPin}
                onChangeText={setConfirmPin}
              />

              <GlassButton
                onPress={handleSaveNewPin}
                style={[styles.pinSubmitBtn, { backgroundColor: currentTheme.colors.primary }]}
              >
                <Text style={styles.pinSubmitText}>Activer la protection</Text>
              </GlassButton>
            </GlassCard>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal Disable PIN */}
        <Modal visible={disableModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalOverlay}
          >
            <GlassCard style={styles.modalCard} foliage="vine">
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Lock size={20} color={currentTheme.colors.danger} />
                  <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                    Désactiver le code PIN
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setDisableModalVisible(false)}>
                  <X size={20} color={currentTheme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalDesc, { color: currentTheme.colors.textMuted }]}>
                Saisissez votre code PIN actuel pour désactiver le verrouillage.
              </Text>

              <TextInput
                style={[styles.pinInput, { color: currentTheme.colors.text, borderColor: currentTheme.colors.borderGlass }]}
                placeholder="Code PIN actuel"
                placeholderTextColor={currentTheme.colors.textMuted}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                value={disablePin}
                onChangeText={setDisablePin}
              />

              <GlassButton
                onPress={handleConfirmDisablePin}
                style={[styles.pinSubmitBtn, { backgroundColor: currentTheme.colors.danger }]}
              >
                <Text style={styles.pinSubmitText}>Désactiver le verrouillage</Text>
              </GlassButton>
            </GlassCard>
          </KeyboardAvoidingView>
        </Modal>

        {/* GitHub Update Modal */}
        <UpdateModal
          visible={updateModalVisible}
          onClose={() => setUpdateModalVisible(false)}
          isLoading={isCheckingUpdate}
          currentVersion={APP_VERSION}
          release={latestRelease}
          error={updateError}
        />
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
  resetAppearanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 14,
    marginTop: 8,
  },
  resetAppearanceText: {
    fontSize: 13,
    fontWeight: '700',
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
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
  securityHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  secBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  secBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notifInfoList: {
    gap: 10,
    marginBottom: 16,
  },
  notifInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  notifBullet: {
    fontSize: 14,
    marginTop: 1,
  },
  notifInfoText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  notifTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  notifTestButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  secSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  secSettingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  secSettingTexts: {
    flex: 1,
  },
  secSettingTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  secSettingSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  windIntensityContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  windIntensityLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  windChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  windChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  windChipIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  windChipLabel: {
    fontSize: 12.5,
    marginBottom: 2,
  },
  windChipDesc: {
    fontSize: 9.5,
    textAlign: 'center',
    lineHeight: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
  },
  modalCard: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  pinInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: '700',
  },
  pinSubmitBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  pinSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  updateStatusBox: {
    gap: 12,
  },
  updateVersionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  updateVersionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  updateVersionText: {
    fontSize: 16,
    fontWeight: '800',
  },
  updateBadgeAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  updateBadgeAlertText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  updateBadgeOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  updateBadgeOkText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  updateDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  updateCheckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
  },
  updateCheckButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  githubLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  githubLinkText: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
