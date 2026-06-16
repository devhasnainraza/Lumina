/**
 * Authenticated user information (matches backend UserResponse schema)
 */
export interface User {
  id: string;
  email: string;
  created_at: string;
  gemini_api_key?: string;
}


/**
 * Authentication credentials for login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data for new users
 */
export interface SignupData {
  email: string;
  password: string;
}

/**
 * Authentication response from backend — snake_case matches backend JSON exactly
 * Bug fix: was wrongly "accessToken" (camelCase) but backend sends "access_token"
 */
export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

/**
 * Login form errors
 */
export interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

/**
 * Signup form errors
 */
export interface SignupFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}
