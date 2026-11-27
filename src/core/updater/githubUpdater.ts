import { Linking, Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { APP_VERSION, GITHUB_API_RELEASES_URL, GITHUB_REPO } from '@/constants/version';

export interface ReleaseInfo {
  tagName: string;
  name: string;
  body: string;
  publishedAt: string;
  apkDownloadUrl: string;
  apkSizeMB?: string;
  hasApkAsset: boolean;
  isNewer: boolean;
}

export interface CheckUpdateResult {
  success: boolean;
  updateAvailable: boolean;
  currentVersion: string;
  release?: ReleaseInfo;
  error?: string;
}

export interface DownloadProgressInfo {
  bytesWritten: number;
  totalBytes: number;
  progress: number;
}

const APK_MIME = 'application/vnd.android.package-archive';
// Android Intent.FLAG_GRANT_READ_URI_PERMISSION = 1
const FLAG_GRANT_READ_URI_PERMISSION = 1;

/**
 * Compares two version strings (e.g. "v1.0.0-beta.12" vs "v1.0.0-beta.13")
 * Returns true if candidate is strictly newer than currentVersion.
 */
export function isVersionNewer(currentVersion: string, candidate: string): boolean {
  if (!candidate) return false;
  if (currentVersion === candidate) return false;

  const parse = (v: string) => {
    const clean = v.replace(/^v/i, '').trim();
    const betaMatch = clean.match(/beta\.?(\d+)/i);
    // Final releases rank above any beta of the same major.minor.patch
    const betaNum = betaMatch ? parseInt(betaMatch[1], 10) : 999999;

    const parts = clean.split('-')[0].split('.').map((p) => parseInt(p, 10) || 0);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
      beta: betaNum,
    };
  };

  const curr = parse(currentVersion);
  const lat = parse(candidate);

  if (lat.major !== curr.major) return lat.major > curr.major;
  if (lat.minor !== curr.minor) return lat.minor > curr.minor;
  if (lat.patch !== curr.patch) return lat.patch > curr.patch;
  return lat.beta > curr.beta;
}

function findApkAsset(release: any): { url: string; size?: number } | null {
  if (!Array.isArray(release?.assets)) return null;
  const asset = release.assets.find(
    (a: any) => typeof a?.name === 'string' && a.name.toLowerCase().endsWith('.apk') && a?.browser_download_url
  );
  if (!asset) return null;
  return { url: asset.browser_download_url, size: typeof asset.size === 'number' ? asset.size : undefined };
}

/**
 * Queries GitHub Releases and selects the highest semantic version (not just releases[0],
 * since GitHub API ordering can lag or reorder edited releases).
 */
export async function checkForGithubUpdate(): Promise<CheckUpdateResult> {
  try {
    const response = await fetch(`${GITHUB_API_RELEASES_URL}?per_page=30`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Lizy-Android-App',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API HTTP ${response.status}`);
    }

    const releases = await response.json();
    if (!Array.isArray(releases) || releases.length === 0) {
      return {
        success: true,
        updateAvailable: false,
        currentVersion: APP_VERSION,
      };
    }

    const published = releases.filter((r: any) => r && !r.draft && typeof r.tag_name === 'string');
    // Prefer releases that already have the compiled APK attached so users are not
    // prompted to install before CI finishes uploading Lizy-Beta.apk.
    const withApk = published.filter((r: any) => findApkAsset(r) !== null);
    const pool = withApk.length > 0 ? withApk : published;

    if (pool.length === 0) {
      return {
        success: true,
        updateAvailable: false,
        currentVersion: APP_VERSION,
      };
    }

    let bestRelease = pool[0];
    for (const candidate of pool.slice(1)) {
      if (isVersionNewer(bestRelease.tag_name, candidate.tag_name)) {
        bestRelease = candidate;
      }
    }

    const tagName: string = bestRelease.tag_name || '';
    const isNewer = isVersionNewer(APP_VERSION, tagName);
    const apkAsset = findApkAsset(bestRelease);
    const apkDownloadUrl =
      apkAsset?.url || `https://github.com/${GITHUB_REPO}/releases/download/${tagName}/Lizy-Beta.apk`;
    const apkSizeMB = apkAsset?.size ? `${(apkAsset.size / (1024 * 1024)).toFixed(1)} Mo` : undefined;

    return {
      success: true,
      updateAvailable: isNewer,
      currentVersion: APP_VERSION,
      release: {
        tagName,
        name: bestRelease.name || tagName,
        body: bestRelease.body || 'Mise à jour et améliorations de Lizy.',
        publishedAt: bestRelease.published_at || new Date().toISOString(),
        apkDownloadUrl,
        apkSizeMB,
        hasApkAsset: apkAsset !== null,
        isNewer,
      },
    };
  } catch (err: any) {
    console.warn('Failed to check GitHub update:', err?.message || err);
    return {
      success: false,
      updateAvailable: false,
      currentVersion: APP_VERSION,
      error: err?.message || 'Erreur réseau lors de la vérification des mises à jour.',
    };
  }
}

/**
 * Deletes stale cached update APKs so repeated updates do not fill device cache.
 */
function pruneCachedApks(keepFileName: string) {
  try {
    for (const entry of Paths.cache.list()) {
      if (entry instanceof File && entry.name.startsWith('Lizy-') && entry.name.endsWith('.apk') && entry.name !== keepFileName) {
        entry.delete();
      }
    }
  } catch {
    // Non-fatal cleanup failure
  }
}

/**
 * Downloads the APK directly inside the app cache directory with live progress updates.
 */
export async function downloadUpdateApk(
  apkDownloadUrl: string,
  tagName: string,
  onProgress?: (info: DownloadProgressInfo) => void,
  signal?: AbortSignal
): Promise<File> {
  const safeTag = (tagName || 'latest').replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `Lizy-${safeTag}.apk`;
  pruneCachedApks(fileName);

  const target = new File(Paths.cache, fileName);
  const downloaded = await File.downloadFileAsync(apkDownloadUrl, target, {
    idempotent: true,
    signal,
    headers: {
      'User-Agent': 'Lizy-Android-App',
      Accept: `application/octet-stream, ${APK_MIME}, */*`,
    },
    onProgress: onProgress
      ? ({ bytesWritten, totalBytes }) => {
          const progress = totalBytes > 0 ? Math.min(1, Math.max(0, bytesWritten / totalBytes)) : 0;
          onProgress({ bytesWritten, totalBytes, progress });
        }
      : undefined,
  });

  // Ensure a CDN/proxy HTML error page is not treated as an APK
  if (!downloaded.exists || downloaded.size < 1024 * 1024) {
    throw new Error('Fichier APK téléchargé invalide ou incomplet.');
  }

  return downloaded;
}

/**
 * Opens the native Android package installer directly for a downloaded APK file.
 */
export async function launchApkInstaller(apkFile: File): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('Installation APK disponible uniquement sur Android.');
  }

  try {
    await apkFile.preview({ mimeType: APK_MIME });
    return;
  } catch {
    // Fallback to explicit VIEW intent via Expo IntentLauncher
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: apkFile.contentUri,
      type: APK_MIME,
      flags: FLAG_GRANT_READ_URI_PERMISSION,
    });
  }
}

/**
 * Opens Android "Install unknown apps" settings directly on Lizy's package screen.
 */
export async function openUnknownSourcesSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const packageName = Constants.expoConfig?.android?.package || 'com.lizy.app';
  try {
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.MANAGE_UNKNOWN_APP_SOURCES, {
      data: `package:${packageName}`,
    });
  } catch {
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, {
      data: `package:${packageName}`,
    });
  }
}

/**
 * Opens the APK URL or release page in the external browser as a fallback.
 */
export async function openReleaseInBrowser(apkDownloadUrl: string): Promise<boolean> {
  try {
    await Linking.openURL(apkDownloadUrl);
    return true;
  } catch {
    try {
      await Linking.openURL(`https://github.com/${GITHUB_REPO}/releases/latest`);
      return true;
    } catch {
      return false;
    }
  }
}
