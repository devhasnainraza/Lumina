import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, LoginCredentials, SignupData } from '@/types/user';
import { authApi } from '@/lib/api/auth';
import { clearAuthStorage } from '@/lib/api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          // Step 1: Authenticate → get token
          // FIX: response uses snake_case "access_token", not "accessToken"
          const authResponse = await authApi.login(credentials);
          const token = authResponse.access_token;

          if (!token) {
            throw new Error('No token received from server');
          }

          // Step 2: Persist token to localStorage + cookie
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth-token', token);
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 1); // 24 h
            document.cookie = `auth-token=${token}; path=/; expires=${expiry.toUTCString()}; SameSite=Lax`;
          }

          // Step 3: Set authenticated state immediately (token first)
          set({ token, isAuthenticated: true, isLoading: false, _hasHydrated: true });

          // Step 4: Fetch the user profile
          try {
            const user = await authApi.getMe();
            set({ user });
          } catch {
            // Non-fatal: token works but profile fetch failed
            console.warn('Could not fetch user profile after login');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (data) => {
        set({ isLoading: true });
        try {
          const user = await authApi.signup(data);
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true });
        } catch {
          // Token invalid/expired — clear everything
          clearAuthStorage();
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      logout: async () => {
        // Fire-and-forget server logout (stateless JWT, but good practice)
        try { await authApi.logout(); } catch { /* ignore */ }

        // Clear all storage
        clearAuthStorage();

        // Reset store state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && typeof window !== 'undefined') {
          // Re-sync cookie in case it expired but localStorage still has the token
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + 1);
          document.cookie = `auth-token=${state.token}; path=/; expires=${expiry.toUTCString()}; SameSite=Lax`;
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
