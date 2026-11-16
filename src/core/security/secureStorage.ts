import * as SecureStore from 'expo-secure-store';

const PRONOTE_URL_KEY = 'lizy_sec_pronote_url';
const PRONOTE_USERNAME_KEY = 'lizy_sec_pronote_username';
const PRONOTE_PASSWORD_KEY = 'lizy_sec_pronote_password';
const PRONOTE_ENT_KEY = 'lizy_sec_pronote_ent';

/**
 * Hardware-level encrypted storage (Android Keystore / iOS Keychain)
 * Zero Plaintext Leaks.
 */
export const SecureStorage = {
  async saveCredentials(params: {
    url: string;
    username: string;
    password: string;
    ent?: string;
  }): Promise<void> {
    await SecureStore.setItemAsync(PRONOTE_URL_KEY, params.url);
    await SecureStore.setItemAsync(PRONOTE_USERNAME_KEY, params.username);
    await SecureStore.setItemAsync(PRONOTE_PASSWORD_KEY, params.password);
    if (params.ent) {
      await SecureStore.setItemAsync(PRONOTE_ENT_KEY, params.ent);
    } else {
      await SecureStore.deleteItemAsync(PRONOTE_ENT_KEY);
    }
  },

  async getCredentials(): Promise<{
    url: string | null;
    username: string | null;
    password: string | null;
    ent: string | null;
  }> {
    const [url, username, password, ent] = await Promise.all([
      SecureStore.getItemAsync(PRONOTE_URL_KEY),
      SecureStore.getItemAsync(PRONOTE_USERNAME_KEY),
      SecureStore.getItemAsync(PRONOTE_PASSWORD_KEY),
      SecureStore.getItemAsync(PRONOTE_ENT_KEY),
    ]);
    return { url, username, password, ent };
  },

  async hasCredentials(): Promise<boolean> {
    const username = await SecureStore.getItemAsync(PRONOTE_USERNAME_KEY);
    const password = await SecureStore.getItemAsync(PRONOTE_PASSWORD_KEY);
    return Boolean(username && password);
  },

  async wipeAllSecureData(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(PRONOTE_URL_KEY),
      SecureStore.deleteItemAsync(PRONOTE_USERNAME_KEY),
      SecureStore.deleteItemAsync(PRONOTE_PASSWORD_KEY),
      SecureStore.deleteItemAsync(PRONOTE_ENT_KEY),
    ]);
  },
};
