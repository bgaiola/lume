import { type AuthSession, type AuthenticatedUser } from '@lume/protocol';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  accessTokenExpiresAt: string | null;

  setSession: (session: AuthSession) => void;
  setUser: (user: AuthenticatedUser) => void;
  clear: () => void;

  isAuthenticated: () => boolean;
}

/**
 * Persistent auth store. Tokens live in localStorage so reloads keep the
 * user logged in. We deliberately do not put the refresh token on the JS
 * side: it lives on the API as an HttpOnly cookie (planned). Phase 1 only
 * ships the access token.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      accessTokenExpiresAt: null,

      setSession: (session) =>
        set({
          user: session.user,
          accessToken: session.accessToken,
          accessTokenExpiresAt: session.accessTokenExpiresAt,
        }),

      setUser: (user) => set({ user }),

      clear: () => set({ user: null, accessToken: null, accessTokenExpiresAt: null }),

      isAuthenticated: () => {
        const { accessToken, accessTokenExpiresAt } = get();
        if (!accessToken || !accessTokenExpiresAt) {
          return false;
        }
        return Date.parse(accessTokenExpiresAt) > Date.now();
      },
    }),
    {
      name: 'lume-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
      }),
    },
  ),
);
