import * as SecureStore from 'expo-secure-store';

const PRONOTE_URL_KEY = 'lizy_sec_pronote_url';
const PRONOTE_USERNAME_KEY = 'lizy_sec_pronote_username';
const PRONOTE_PASSWORD_KEY = 'lizy_sec_pronote_password';
const PRONOTE_ENT_KEY = 'lizy_sec_pronote_ent';

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

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

  async wipeAllSecureData(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(PRONOTE_URL_KEY, SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(PRONOTE_USERNAME_KEY, SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(PRONOTE_PASSWORD_KEY, SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(PRONOTE_ENT_KEY, SECURE_STORE_OPTIONS),
    ]);
  },
};
