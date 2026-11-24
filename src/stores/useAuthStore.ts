import { create } from 'zustand';
import { PronoteUser } from '@/types';
import { SecureStorage, AuthMode } from '@/core/security/secureStorage';
import { useDataStore } from './useDataStore';
import { pronoteClient } from '@/core/pronote/client';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  user: PronoteUser | null;
  sessionToken: string | null;
  authType: AuthMode | null;
  error: string | null;
  setSession: (
    user: PronoteUser,
    sessionToken: string,
    authType?: AuthMode,
    schoolUrl?: string
  ) => Promise<void>;
  restoreSession: () => Promise<boolean>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  user: null,
  sessionToken: null,
  authType: null,
  error: null,

  setSession: async (
    user: PronoteUser,
    sessionToken: string,
    authType: AuthMode = 'direct',
    schoolUrl?: string
  ) => {
    set({
      isAuthenticated: true,
      user,
      sessionToken,
      authType,
      error: null,
      isLoading: false,
      isInitialized: true,
    });

    try {
      await SecureStorage.saveSession({
        user,
        token: sessionToken,
        authType,
        schoolUrl,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('Failed to persist session to SecureStore:', e);
    }
  },

  restoreSession: async () => {
    try {
      const session = await SecureStorage.getSession();
      if (session && session.user && session.token) {
        set({
          isAuthenticated: true,
          user: session.user,
          sessionToken: session.token,
          authType: session.authType,
          isInitialized: true,
          isLoading: false,
        });

        // If direct credentials exist, attempt silent background refresh
        if (session.authType === 'direct') {
          SecureStorage.getCredentials().then((creds) => {
            if (creds.url && creds.username && creds.password) {
              pronoteClient
                .login({
                  url: creds.url,
                  username: creds.username,
                  password: creds.password,
                  ent: creds.ent || undefined,
                })
                .then((freshUser) => {
                  const s = pronoteClient.getSession();
                  if (s) {
                    get().setSession(
                      {
                        ...freshUser,
                        establishment: session.user.establishment || freshUser.establishment,
                      },
                      s.token,
                      'direct',
                      creds.url || undefined
                    );
                  }
                })
                .catch(() => {
                  // Offline or server unreachable: keep the restored local session
                });
            }
          });
        }

        return true;
      }
    } catch (err) {
      console.warn('Failed to restore session from SecureStore:', err);
    }

    set({
      isAuthenticated: false,
      user: null,
      sessionToken: null,
      authType: null,
      isInitialized: true,
      isLoading: false,
    });
    return false;
  },

  setError: (error: string | null) => set({ error, isLoading: false }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  logout: async () => {
    await SecureStorage.wipeAllSecureData();
    useDataStore.getState().clearDataForRealUser();
    set({
      isAuthenticated: false,
      user: null,
      sessionToken: null,
      authType: null,
      error: null,
      isLoading: false,
      isInitialized: true,
    });
  },
}));
