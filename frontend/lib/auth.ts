import { apiClient } from './api';
import { User, LoginRequest, RegisterRequest, AuthResponse } from './types';

/**
 * Authentication API functions
 */

/**
 * Register a new user
 */
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
    '/auth/register',
    data
  );
  return response.data;
};

/**
 * Login user
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
    '/auth/login',
    data
  );
  return response.data;
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
  apiClient.removeToken();
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<{ success: boolean; data: { user: User } }>(
    '/auth/me'
  );
  return response.data.user;
};
