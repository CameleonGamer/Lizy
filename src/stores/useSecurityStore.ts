import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const SEC_APP_PIN_KEY = 'lizy_sec_app_pin_hash';
const SEC_APP_LOCK_ENABLED_KEY = 'lizy_sec_app_lock_enabled';
const SEC_PRIVACY_SHIELD_KEY = 'lizy_sec_privacy_shield_enabled';

interface SecurityState {
  isLockEnabled: boolean;
  isPrivacyShieldEnabled: boolean;
  isAppLocked: boolean;
  hasLoaded: boolean;
  pinLength: number;

  loadSecuritySettings: () => Promise<void>;
  enableAppPin: (pin: string) => Promise<boolean>;
  disableAppPin: (pin: string) => Promise<boolean>;
  verifyPin: (pin: string) => Promise<boolean>;
  setPrivacyShield: (enabled: boolean) => Promise<void>;
  lockApp: () => void;
  unlockApp: () => void;
  clearSecurityData: () => Promise<void>;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  isLockEnabled: false,
  isPrivacyShieldEnabled: true, // Enabled by default for anti-shoulder surfing
  isAppLocked: false,
  hasLoaded: false,
  pinLength: 4,

  loadSecuritySettings: async () => {
    try {
      const [lockVal, shieldVal, pinHash] = await Promise.all([
        SecureStore.getItemAsync(SEC_APP_LOCK_ENABLED_KEY),
        SecureStore.getItemAsync(SEC_PRIVACY_SHIELD_KEY),
        SecureStore.getItemAsync(SEC_APP_PIN_KEY),
      ]);

      const isLockEnabled = lockVal === 'true' && Boolean(pinHash);
      const isPrivacyShieldEnabled = shieldVal !== 'false'; // Default to true

      set({
        isLockEnabled,
        isPrivacyShieldEnabled,
        isAppLocked: isLockEnabled, // Lock immediately on fresh start if enabled
        hasLoaded: true,
      });
    } catch {
      set({ hasLoaded: true });
    }
  },

  enableAppPin: async (pin: string) => {
    if (!pin || pin.length < 4) return false;
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `lizy_salt_pin_${pin.trim()}`
      );
      await SecureStore.setItemAsync(SEC_APP_PIN_KEY, hash);
      await SecureStore.setItemAsync(SEC_APP_LOCK_ENABLED_KEY, 'true');
      set({ isLockEnabled: true, isAppLocked: false });
      return true;
    } catch {
      return false;
    }
  },

  disableAppPin: async (pin: string) => {
    const isValid = await get().verifyPin(pin);
    if (!isValid) return false;

    try {
      await SecureStore.deleteItemAsync(SEC_APP_PIN_KEY);
      await SecureStore.setItemAsync(SEC_APP_LOCK_ENABLED_KEY, 'false');
      set({ isLockEnabled: false, isAppLocked: false });
      return true;
    } catch {
      return false;
    }
  },

  verifyPin: async (pin: string) => {
    try {
      const storedHash = await SecureStore.getItemAsync(SEC_APP_PIN_KEY);
      if (!storedHash) return false;

      const inputHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `lizy_salt_pin_${pin.trim()}`
      );

      const success = storedHash === inputHash;
      if (success) {
        set({ isAppLocked: false });
      }
      return success;
    } catch {
      return false;
    }
  },

  setPrivacyShield: async (enabled: boolean) => {
    await SecureStore.setItemAsync(SEC_PRIVACY_SHIELD_KEY, enabled ? 'true' : 'false');
    set({ isPrivacyShieldEnabled: enabled });
  },

  lockApp: () => {
    if (get().isLockEnabled) {
      set({ isAppLocked: true });
    }
  },

  unlockApp: () => {
    set({ isAppLocked: false });
  },

  clearSecurityData: async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(SEC_APP_PIN_KEY),
        SecureStore.deleteItemAsync(SEC_APP_LOCK_ENABLED_KEY),
        SecureStore.deleteItemAsync(SEC_PRIVACY_SHIELD_KEY),
      ]);
    } catch {}
    set({
      isLockEnabled: false,
      isPrivacyShieldEnabled: true,
      isAppLocked: false,
    });
  },
}));
