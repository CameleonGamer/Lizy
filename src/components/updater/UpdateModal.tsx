import React, { useEffect, useRef, useState } from 'react';
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
import { File } from 'expo-file-system';
import { useThemeStore } from '@/stores/useThemeStore';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import {
  ReleaseInfo,
  DownloadProgressInfo,
  downloadUpdateApk,
  launchApkInstaller,
  openUnknownSourcesSettings,
  openReleaseInBrowser,
} from '@/core/updater/githubUpdater';
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
  ShieldAlert,
  Play,
} from 'lucide-react-native';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  isLoading?: boolean;
  currentVersion: string;
  release?: ReleaseInfo | null;
  error?: string | null;
}

function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgressInfo | null>(null);
  const [downloadedEntry, setDownloadedEntry] = useState<{ file: File; tag: string } | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Abort any ongoing transfer cleanly if the modal becomes hidden externally
  useEffect(() => {
    if (!visible) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    }
  }, [visible]);

  const handleClose = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsDownloading(false);
    setDownloadProgress(null);
    setInstallError(null);
    onClose();
  };

  const cachedFileForRelease =
    release?.tagName &&
    downloadedEntry?.tag === release.tagName &&
    downloadedEntry.file.exists &&
    downloadedEntry.file.size > 1024 * 1024
      ? downloadedEntry.file
      : null;

  const triggerInstaller = async (file: File) => {
    setInstallError(null);
    try {
      await launchApkInstaller(file);
    } catch (err: any) {
      const msg =
        err?.message ||
        "Android a bloqué l'ouverture de l'installateur. Autorisez « Installer des applis inconnues » pour Lizy.";
      setInstallError(msg);
    }
  };

  const handleDownloadAndInstall = async () => {
    if (!release?.apkDownloadUrl || isDownloading) return;

    if (Platform.OS !== 'android') {
      await openReleaseInBrowser(release.apkDownloadUrl);
      return;
    }

    if (cachedFileForRelease) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      await triggerInstaller(cachedFileForRelease);
      return;
    }

    setInstallError(null);
    setIsDownloading(true);
    setDownloadProgress({ bytesWritten: 0, totalBytes: 0, progress: 0 });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const file = await downloadUpdateApk(
        release.apkDownloadUrl,
        release.tagName,
        (info) => setDownloadProgress(info),
        controller.signal
      );

      setDownloadedEntry({ file, tag: release.tagName });
      setIsDownloading(false);
      abortControllerRef.current = null;

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      await triggerInstaller(file);
    } catch (err: any) {
      setIsDownloading(false);
      abortControllerRef.current = null;

      if (err?.name === 'AbortError' || String(err?.message).toLowerCase().includes('cancel')) {
        setDownloadProgress(null);
        return;
      }

      setInstallError(err?.message || 'Erreur lors du téléchargement de la mise à jour.');
    }
  };

  const handleCancelDownload = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsDownloading(false);
    setDownloadProgress(null);
  };

  const handleOpenSettings = async () => {
    try {
      await openUnknownSourcesSettings();
    } catch {
      Alert.alert(
        'Réglages',
        "Ouvrez les paramètres Android de l'application Lizy puis activez « Installer des applis inconnues »."
      );
    }
  };

  const isUpToDate = !isLoading && !error && (!release || !release.isNewer);
  const isUpdateAvailable = !isLoading && !error && !!release && release.isNewer;
  const pct = downloadProgress ? Math.round(downloadProgress.progress * 100) : 0;

  const formattedDate = release?.publishedAt
    ? new Date(release.publishedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
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

            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={currentTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Loading */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentTheme.colors.primary} />
              <Text style={[styles.loadingText, { color: currentTheme.colors.textMuted }]}>
                Interrogation des releases GitHub en direct...
              </Text>
            </View>
          )}

          {/* Network/API Error */}
          {error && !isLoading && (
            <View style={styles.stateContainer}>
              <Text style={[styles.errorDesc, { color: currentTheme.colors.textMuted }]}>
                Impossible de vérifier les mises à jour sur GitHub. Vérifiez votre connexion internet ou consultez directement le dépôt.
              </Text>
              <Text style={[styles.errorDetail, { color: currentTheme.colors.danger }]}>
                {error}
              </Text>
              <GlassButton
                onPress={() => openReleaseInBrowser(GITHUB_RELEASES_URL)}
                style={[styles.primaryBtn, { backgroundColor: currentTheme.colors.primary }]}
              >
                <ExternalLink size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Ouvrir les Releases GitHub</Text>
              </GlassButton>
            </View>
          )}

          {/* Already up to date */}
          {isUpToDate && (
            <View style={styles.stateContainer}>
              <Text style={[styles.upToDateDesc, { color: currentTheme.colors.textMuted }]}>
                {"Vous utilisez actuellement la version la plus récente de Lizy. Aucune nouvelle version n'est disponible."}
              </Text>
              <View style={[styles.versionPill, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}>
                <Sparkles size={14} color="#10B981" />
                <Text style={[styles.versionPillText, { color: currentTheme.colors.text }]}>
                  Version active : <Text style={{ color: '#10B981', fontWeight: '800' }}>{currentVersion}</Text>
                </Text>
              </View>

              <GlassButton
                onPress={handleClose}
                style={[styles.primaryBtn, { backgroundColor: currentTheme.colors.primary, marginTop: 14 }]}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Fermer</Text>
              </GlassButton>
            </View>
          )}

          {/* Update Available */}
          {isUpdateAvailable && release && (
            <View style={styles.updateAvailableContainer}>
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

              <Text style={[styles.notesSectionTitle, { color: currentTheme.colors.text }]}>
                Nouveautés & Améliorations :
              </Text>
              <ScrollView style={styles.notesScroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.notesContent, { color: currentTheme.colors.textMuted }]}>
                  {release.body}
                </Text>
              </ScrollView>

              {/* In-App Download Progress */}
              {isDownloading && (
                <View style={[styles.progressCard, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: currentTheme.colors.text }]}>
                      Téléchargement en cours...
                    </Text>
                    <Text style={[styles.progressPct, { color: currentTheme.colors.primary }]}>
                      {downloadProgress && downloadProgress.totalBytes > 0 ? `${pct}%` : '...'}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: '#10B981',
                          width: `${downloadProgress && downloadProgress.totalBytes > 0 ? pct : 15}%`,
                        },
                      ]}
                    />
                  </View>
                  {downloadProgress && (
                    <Text style={[styles.progressBytes, { color: currentTheme.colors.textMuted }]}>
                      {formatMB(downloadProgress.bytesWritten)}
                      {downloadProgress.totalBytes > 0 ? ` / ${formatMB(downloadProgress.totalBytes)}` : ''}
                    </Text>
                  )}
                </View>
              )}

              {/* Install Error / Permission Helper */}
              {installError && (
                <View style={styles.installErrorBox}>
                  <Text style={styles.installErrorText}>{installError}</Text>
                  {Platform.OS === 'android' && (
                    <TouchableOpacity onPress={handleOpenSettings} style={styles.permLinkRow}>
                      <ShieldAlert size={14} color="#F59E0B" />
                      <Text style={styles.permLinkText}>
                        Autoriser les sources inconnues dans Android
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {isDownloading ? (
                  <GlassButton
                    onPress={handleCancelDownload}
                    style={[styles.primaryBtn, { backgroundColor: '#EF4444' }]}
                  >
                    <X size={16} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Annuler le téléchargement</Text>
                  </GlassButton>
                ) : (
                  <GlassButton
                    onPress={handleDownloadAndInstall}
                    style={[styles.primaryBtn, { backgroundColor: '#10B981' }]}
                  >
                    {cachedFileForRelease ? (
                      <Play size={16} color="#FFFFFF" />
                    ) : (
                      <Download size={16} color="#FFFFFF" />
                    )}
                    <Text style={styles.primaryBtnText}>
                      {cachedFileForRelease ? 'Installer maintenant' : 'Mettre à jour maintenant'}
                    </Text>
                  </GlassButton>
                )}

                {!isDownloading && (
                  <TouchableOpacity
                    onPress={() => openReleaseInBrowser(release.apkDownloadUrl)}
                    style={styles.browserFallbackBtn}
                  >
                    <ExternalLink size={12} color={currentTheme.colors.textMuted} />
                    <Text style={[styles.browserFallbackText, { color: currentTheme.colors.textMuted }]}>
                      Télécharger via le navigateur
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
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
    maxHeight: '88%',
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
    marginBottom: 4,
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
    marginBottom: 4,
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
    marginTop: 2,
  },
  notesScroll: {
    maxHeight: 150,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
  },
  notesContent: {
    fontSize: 12,
    lineHeight: 18,
  },
  progressCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  progressBytes: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  installErrorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  installErrorText: {
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 17,
  },
  permLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  permLinkText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  actionRow: {
    marginTop: 6,
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
  browserFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  browserFallbackText: {
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
