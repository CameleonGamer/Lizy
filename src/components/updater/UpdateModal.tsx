import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores/useThemeStore';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { ReleaseInfo, installGithubUpdate } from '@/core/updater/githubUpdater';
import { GITHUB_RELEASES_URL } from '@/constants/version';
import {
  Rocket,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
  HardDriveDownload,
  Calendar,
} from 'lucide-react-native';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  isLoading?: boolean;
  currentVersion: string;
  release?: ReleaseInfo | null;
  error?: string | null;
}

export function UpdateModal({
  visible,
  onClose,
  isLoading = false,
  currentVersion,
  release,
  error,
}: UpdateModalProps) {
  const { currentTheme } = useThemeStore();
  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleInstall = async () => {
    if (!release?.apkDownloadUrl) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setDownloadStarted(true);
    const success = await installGithubUpdate(release.apkDownloadUrl);

    if (success) {
      Alert.alert(
        'Téléchargement lancé 📥',
        'Le téléchargement du paquet Lizy-Beta.apk a démarré dans votre navigateur/gestionnaire de téléchargement.\n\nUne fois le téléchargement terminé, cliquez sur la notification pour valider l’installation.',
        [{ text: 'Compris' }]
      );
    } else {
      Alert.alert(
        'Erreur de téléchargement',
        'Impossible de lancer automatiquement le téléchargement. Vous allez être redirigé vers la page GitHub.',
        [{ text: 'OK' }]
      );
    }
  };

  const isUpToDate = !isLoading && !error && release && !release.isNewer;
  const isUpdateAvailable = !isLoading && !error && release && release.isNewer;

  // Format date
  const formattedDate = release?.publishedAt
    ? new Date(release.publishedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <GlassCard style={styles.card} foliage="vine">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {isLoading ? (
                <ActivityIndicator size="small" color={currentTheme.colors.primary} />
              ) : isUpdateAvailable ? (
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Rocket size={20} color="#F59E0B" />
                </View>
              ) : isUpToDate ? (
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <CheckCircle2 size={20} color="#10B981" />
                </View>
              ) : (
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <AlertCircle size={20} color="#EF4444" />
                </View>
              )}
              <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                {isLoading
                  ? 'Recherche de mise à jour...'
                  : isUpdateAvailable
                  ? 'Mise à jour disponible !'
                  : isUpToDate
                  ? 'Lizy est à jour'
                  : 'Vérification impossible'}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={currentTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentTheme.colors.primary} />
              <Text style={[styles.loadingText, { color: currentTheme.colors.textMuted }]}>
                Interrogation des releases GitHub en direct...
              </Text>
            </View>
          )}

          {error && !isLoading && (
            <View style={styles.stateContainer}>
              <Text style={[styles.errorDesc, { color: currentTheme.colors.textMuted }]}>
                Impossible de vérifier les mises à jour sur GitHub. Vérifiez votre connexion internet ou consultez directement le dépôt.
              </Text>
              <Text style={[styles.errorDetail, { color: currentTheme.colors.danger }]}>
                {error}
              </Text>
              <GlassButton
                onPress={() => installGithubUpdate(GITHUB_RELEASES_URL)}
                style={[styles.primaryBtn, { backgroundColor: currentTheme.colors.primary }]}
              >
                <ExternalLink size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Ouvrir les Releases GitHub</Text>
              </GlassButton>
            </View>
          )}

          {isUpToDate && !isLoading && (
            <View style={styles.stateContainer}>
              <Text style={[styles.upToDateDesc, { color: currentTheme.colors.textMuted }]}>
                Vous utilisez actuellement la version la plus récente de Lizy. Aucune nouvelle version n'est disponible.
              </Text>
              <View style={[styles.versionPill, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}>
                <Sparkles size={14} color="#10B981" />
                <Text style={[styles.versionPillText, { color: currentTheme.colors.text }]}>
                  Version active : <Text style={{ color: '#10B981', fontWeight: '800' }}>{currentVersion}</Text>
                </Text>
              </View>

              <GlassButton
                onPress={onClose}
                style={[styles.primaryBtn, { backgroundColor: currentTheme.colors.primary, marginTop: 14 }]}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Fermer</Text>
              </GlassButton>
            </View>
          )}

          {isUpdateAvailable && release && !isLoading && (
            <View style={styles.updateAvailableContainer}>
              {/* Version Comparison Bar */}
              <View style={[styles.versionCompareRow, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}>
                <View style={styles.versionCol}>
                  <Text style={[styles.versionLabel, { color: currentTheme.colors.textMuted }]}>Actuelle</Text>
                  <Text style={[styles.versionVal, { color: currentTheme.colors.text }]}>{currentVersion}</Text>
                </View>
                <ArrowRight size={16} color={currentTheme.colors.primary} />
                <View style={styles.versionCol}>
                  <Text style={[styles.versionLabel, { color: currentTheme.colors.textMuted }]}>Nouvelle</Text>
                  <Text style={[styles.versionVal, { color: '#F59E0B', fontWeight: '800' }]}>{release.tagName}</Text>
                </View>
              </View>

              {/* Meta tags (Date & Size) */}
              <View style={styles.metaRow}>
                {formattedDate ? (
                  <View style={[styles.metaBadge, { backgroundColor: currentTheme.colors.surfaceGlass }]}>
                    <Calendar size={12} color={currentTheme.colors.textMuted} />
                    <Text style={[styles.metaBadgeText, { color: currentTheme.colors.textMuted }]}>
                      {formattedDate}
                    </Text>
                  </View>
                ) : null}
                {release.apkSizeMB ? (
                  <View style={[styles.metaBadge, { backgroundColor: currentTheme.colors.surfaceGlass }]}>
                    <HardDriveDownload size={12} color={currentTheme.colors.textMuted} />
                    <Text style={[styles.metaBadgeText, { color: currentTheme.colors.textMuted }]}>
                      {release.apkSizeMB}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Release Notes */}
              <Text style={[styles.notesSectionTitle, { color: currentTheme.colors.text }]}>
                Nouveautés & Améliorations :
              </Text>
              <ScrollView style={styles.notesScroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.notesContent, { color: currentTheme.colors.textMuted }]}>
                  {release.body}
                </Text>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <GlassButton
                  onPress={handleInstall}
                  style={[styles.primaryBtn, { backgroundColor: '#10B981' }]}
                >
                  <Download size={16} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>
                    {downloadStarted ? 'Relancer le téléchargement' : 'Télécharger & Installer'}
                  </Text>
                </GlassButton>

                <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                  <Text style={[styles.cancelBtnText, { color: currentTheme.colors.textMuted }]}>
                    Plus tard
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    padding: 20,
  },
  card: {
    maxHeight: '85%',
    padding: 20,
    borderRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  closeBtn: {
    padding: 6,
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stateContainer: {
    paddingVertical: 12,
  },
  errorDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
  },
  upToDateDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  versionPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  updateAvailableContainer: {
    gap: 10,
  },
  versionCompareRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  versionCol: {
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  versionVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notesSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  notesScroll: {
    maxHeight: 180,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
  },
  notesContent: {
    fontSize: 12,
    lineHeight: 18,
  },
  actionRow: {
    marginTop: 10,
    gap: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
