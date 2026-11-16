import { create } from 'zustand';
import { PronoteUser } from '@/types';
import { SecureStorage } from '@/core/security/secureStorage';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: PronoteUser | null;
  sessionToken: string | null; // Purely in RAM!
  error: string | null;
  setSession: (user: PronoteUser, sessionToken: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  sessionToken: null,
  error: null,

  setSession: (user: PronoteUser, sessionToken: string) => {
    set({
      isAuthenticated: true,
      user,
      sessionToken,
      error: null,
      isLoading: false,
    });
  },

  setError: (error: string | null) => set({ error, isLoading: false }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  logout: async () => {
    // Flush RAM & flush hardware secure store
    await SecureStorage.wipeAllSecureData();
    set({
      isAuthenticated: false,
      user: null,
      sessionToken: null,
      error: null,
      isLoading: false,
    });
  },
}));
