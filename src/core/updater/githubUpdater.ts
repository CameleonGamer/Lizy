import { Linking } from 'react-native';
import { APP_VERSION, GITHUB_API_RELEASES_URL, GITHUB_RELEASES_URL, GITHUB_REPO } from '@/constants/version';

export interface ReleaseInfo {
  tagName: string;
  name: string;
  body: string;
  publishedAt: string;
  apkDownloadUrl: string;
  apkSizeMB?: string;
  isNewer: boolean;
}

export interface CheckUpdateResult {
  success: boolean;
  updateAvailable: boolean;
  currentVersion: string;
  release?: ReleaseInfo;
  error?: string;
}

/**
 * Compares two version strings (e.g. "v1.0.0-beta.12" vs "v1.0.0-beta.13")
 * Returns true if latestVersion is strictly newer than currentVersion.
 */
export function isVersionNewer(currentVersion: string, latestVersion: string): boolean {
  if (!latestVersion) return false;
  if (currentVersion === latestVersion) return false;

  const parse = (v: string) => {
    const clean = v.replace(/^v/i, '').trim();
    const betaMatch = clean.match(/beta\.?(\d+)/i);
    // If not a beta, consider it final release (high priority)
    const betaNum = betaMatch ? parseInt(betaMatch[1], 10) : 999999;

    const parts = clean.split('-')[0].split('.').map((p) => parseInt(p, 10) || 0);
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;

    return { major, minor, patch, beta: betaNum };
  };

  const curr = parse(currentVersion);
  const lat = parse(latestVersion);

  if (lat.major > curr.major) return true;
  if (lat.major < curr.major) return false;

  if (lat.minor > curr.minor) return true;
  if (lat.minor < curr.minor) return false;

  if (lat.patch > curr.patch) return true;
  if (lat.patch < curr.patch) return false;

  if (lat.beta > curr.beta) return true;
  return false;
}

/**
 * Queries GitHub API to check for new releases in CameleonGamer/Lizy
 */
export async function checkForGithubUpdate(): Promise<CheckUpdateResult> {
  try {
    const response = await fetch(GITHUB_API_RELEASES_URL, {
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

    const latestRelease = releases[0];
    const tagName = latestRelease.tag_name || '';
    const isNewer = isVersionNewer(APP_VERSION, tagName);

    // Find the APK asset
    const apkAsset = Array.isArray(latestRelease.assets)
      ? latestRelease.assets.find((a: any) => typeof a.name === 'string' && a.name.endsWith('.apk'))
      : null;

    const apkDownloadUrl =
      apkAsset?.browser_download_url ||
      `https://github.com/${GITHUB_REPO}/releases/download/${tagName}/Lizy-Beta.apk`;

    const apkSizeMB = apkAsset?.size
      ? `${(apkAsset.size / (1024 * 1024)).toFixed(1)} Mo`
      : undefined;

    return {
      success: true,
      updateAvailable: isNewer,
      currentVersion: APP_VERSION,
      release: {
        tagName,
        name: latestRelease.name || tagName,
        body: latestRelease.body || 'Mise à jour et améliorations de Lizy.',
        publishedAt: latestRelease.published_at || new Date().toISOString(),
        apkDownloadUrl,
        apkSizeMB,
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
 * Initiates the download and installation of the APK
 */
export async function installGithubUpdate(apkDownloadUrl: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(apkDownloadUrl);
    if (supported) {
      await Linking.openURL(apkDownloadUrl);
      return true;
    } else {
      // Fallback direct open
      await Linking.openURL(`https://github.com/${GITHUB_REPO}/releases/latest`);
      return true;
    }
  } catch (e) {
    console.error('Error opening APK download URL:', e);
    return false;
  }
}
