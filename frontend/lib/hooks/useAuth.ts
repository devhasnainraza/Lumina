import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

/**
 * Primary auth hook — waits for Zustand to hydrate from localStorage,
 * then optionally revalidates the stored token against the backend.
 */
export function useAuth() {
  const { isAuthenticated, user, token, logout, _hasHydrated, fetchUser } = useAuthStore();

  useEffect(() => {
    // Once hydrated: if we have a token, verify it's still valid
    if (_hasHydrated && token) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated]);

  return {
    isAuthenticated,
    user,
    token,
    logout,
    // isLoading = true until Zustand has read localStorage
    isLoading: !_hasHydrated,
  };
}
