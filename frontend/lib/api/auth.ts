import { apiClient } from './client';
import type { LoginCredentials, SignupData, AuthResponse, User } from '@/types/user';

export const authApi = {
  signup: async (data: SignupData): Promise<User> => {
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors — logout should always succeed client-side
    }
  },

  updateProfile: async (email: string, geminiApiKey?: string, groqApiKey?: string): Promise<User> => {
    const response = await apiClient.put('/auth/profile', {
      email,
      gemini_api_key: geminiApiKey,
      groq_api_key: groqApiKey,
    });
    return response.data;
  },


  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/auth/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/auth/account');
  },

  forgotPassword: async (email: string): Promise<{ message: string; token: string | null }> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (email: string, token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', {
      email,
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};
