import * as SecureStore from 'expo-secure-store';
import { PronoteUser } from '@/types';

export type AuthMode = 'direct' | 'ent' | 'qrcode' | 'demo';

export interface StoredSession {
  user: PronoteUser;
  token: string;
  authType: AuthMode;
  schoolUrl?: string;
  timestamp: number;
}

const PRONOTE_URL_KEY = 'lizy_sec_pronote_url';
const PRONOTE_USERNAME_KEY = 'lizy_sec_pronote_username';
const PRONOTE_PASSWORD_KEY = 'lizy_sec_pronote_password';
const PRONOTE_ENT_KEY = 'lizy_sec_pronote_ent';
const PRONOTE_USER_KEY = 'lizy_sec_pronote_user_meta';
const PRONOTE_SESSION_TOKEN_KEY = 'lizy_sec_pronote_token';
const PRONOTE_AUTH_TYPE_KEY = 'lizy_sec_pronote_auth_type';

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/**
 * Hardware-level encrypted storage (Android Keystore / iOS Keychain)
 * Zero Plaintext Leaks. Zero-Trust Local Vault.
 */
export const SecureStorage = {
  async saveCredentials(params: {
    url: string;
    username: string;
    password: string;
    ent?: string;
  }): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(PRONOTE_URL_KEY, params.url.trim(), SECURE_STORE_OPTIONS),
      SecureStore.setItemAsync(PRONOTE_USERNAME_KEY, params.username.trim(), SECURE_STORE_OPTIONS),
      SecureStore.setItemAsync(PRONOTE_PASSWORD_KEY, params.password.trim(), SECURE_STORE_OPTIONS),
      params.ent
        ? SecureStore.setItemAsync(PRONOTE_ENT_KEY, params.ent, SECURE_STORE_OPTIONS)
        : SecureStore.deleteItemAsync(PRONOTE_ENT_KEY),
    ]);
  },

  async getCredentials(): Promise<{
    url: string | null;
    username: string | null;
    password: string | null;
    ent: string | null;
  }> {
    const [url, username, password, ent] = await Promise.all([
      SecureStore.getItemAsync(PRONOTE_URL_KEY, SECURE_STORE_OPTIONS),
      SecureStore.getItemAsync(PRONOTE_USERNAME_KEY, SECURE_STORE_OPTIONS),
      SecureStore.getItemAsync(PRONOTE_PASSWORD_KEY, SECURE_STORE_OPTIONS),
      SecureStore.getItemAsync(PRONOTE_ENT_KEY, SECURE_STORE_OPTIONS),
    ]);
    return { url, username, password, ent };
  },

  async hasCredentials(): Promise<boolean> {
    const username = await SecureStore.getItemAsync(PRONOTE_USERNAME_KEY, SECURE_STORE_OPTIONS);
    const password = await SecureStore.getItemAsync(PRONOTE_PASSWORD_KEY, SECURE_STORE_OPTIONS);
    return Boolean(username && password);
  },

  async saveSession(session: StoredSession): Promise<void> {
    const promises: Promise<any>[] = [
      SecureStore.setItemAsync(PRONOTE_USER_KEY, JSON.stringify(session.user), SECURE_STORE_OPTIONS),
      SecureStore.setItemAsync(PRONOTE_SESSION_TOKEN_KEY, session.token, SECURE_STORE_OPTIONS),
      SecureStore.setItemAsync(PRONOTE_AUTH_TYPE_KEY, session.authType, SECURE_STORE_OPTIONS),
    ];
    if (session.schoolUrl) {
      promises.push(
        SecureStore.setItemAsync(PRONOTE_URL_KEY, session.schoolUrl.trim(), SECURE_STORE_OPTIONS)
      );
    }
    await Promise.all(promises);
  },

  async getSession(): Promise<StoredSession | null> {
    try {
      const [userStr, token, authType, schoolUrl] = await Promise.all([
        SecureStore.getItemAsync(PRONOTE_USER_KEY, SECURE_STORE_OPTIONS),
        SecureStore.getItemAsync(PRONOTE_SESSION_TOKEN_KEY, SECURE_STORE_OPTIONS),
        SecureStore.getItemAsync(PRONOTE_AUTH_TYPE_KEY, SECURE_STORE_OPTIONS),
        SecureStore.getItemAsync(PRONOTE_URL_KEY, SECURE_STORE_OPTIONS),
      ]);

      if (!userStr || !token) {
        return null;
      }

      const user = JSON.parse(userStr) as PronoteUser;
      return {
        user,
        token,
        authType: (authType as AuthMode) || 'direct',
        schoolUrl: schoolUrl || undefined,
        timestamp: Date.now(),
      };
    } catch {
      return null;
    }
  },

  async hasSession(): Promise<boolean> {
    const [userStr, token] = await Promise.all([
      SecureStore.getItemAsync(PRONOTE_USER_KEY, SECURE_STORE_OPTIONS),
      SecureStore.getItemAsync(PRONOTE_SESSION_TOKEN_KEY, SECURE_STORE_OPTIONS),
    ]);
    return Boolean(userStr && token);
  },

  async wipeAllSecureData(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(PRONOTE_URL_KEY, SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(PRONOTE_USERNAME_KEY, SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(PRONOTE_PASSWORD_KEY, SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(PRONOTE_ENT_KEY, SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(PRONOTE_USER_KEY, SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(PRONOTE_SESSION_TOKEN_KEY, SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(PRONOTE_AUTH_TYPE_KEY, SECURE_STORE_OPTIONS),
    ]);
  },
};
