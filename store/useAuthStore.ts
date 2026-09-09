import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserProfile {
  pubId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  selectedOrgPubId: string | null;
  selectedOrgSlug: string | null;
  backendUrl: string;

  setAuth: (payload: { accessToken: string; refreshToken: string; user?: UserProfile | null }) => void;
  setTokens: (payload: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: UserProfile | null) => void;
  setSelectedOrg: (orgPubId: string | null, orgSlug: string | null) => void;
  setSelectedOrgPubId: (selectedOrgPubId: string | null) => void;
  setBackendUrl: (url: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      selectedOrgPubId: null,
      selectedOrgSlug: null,
      backendUrl: 'http://localhost:8000/graphql',

      setAuth: ({ accessToken, refreshToken, user }) =>
        set((state) => ({
          accessToken,
          refreshToken,
          user: user !== undefined ? user : state.user,
        })),

      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      setSelectedOrg: (selectedOrgPubId, selectedOrgSlug) =>
        set({ selectedOrgPubId, selectedOrgSlug }),

      setSelectedOrgPubId: (selectedOrgPubId) =>
        set({ selectedOrgPubId }),

      setBackendUrl: (backendUrl) => set({ backendUrl }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          selectedOrgPubId: null,
          selectedOrgSlug: null,
        }),
    }),
    {
      name: 'nexora-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
