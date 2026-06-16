# Authentication API Contract

**Base URL**: `${NEXT_PUBLIC_API_URL}/auth`  
**Version**: 1.0  
**Authentication**: None (these endpoints establish authentication)

---

## POST /auth/signup

Register a new user account.

### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```typescript
{
  email: string;      // Valid email address
  password: string;   // Minimum 8 characters
}
```

**Example**:
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

### Response

**Success (201 Created)**:
```typescript
{
  id: string;         // UUID
  email: string;
  createdAt: string;  // ISO 8601
}
```

**Example**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "createdAt": "2026-05-12T14:30:00Z"
}
```

**Errors**:
- `409 Conflict`: Email already exists
- `400 Bad Request`: Invalid email or password format

---

## POST /auth/login

Authenticate user and receive JWT token.

### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```typescript
{
  email: string;
  password: string;
}
```

**Example**:
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

### Response

**Success (200 OK)**:
```typescript
{
  accessToken: string;  // JWT token
  tokenType: "bearer";
  expiresIn: number;    // Seconds (typically 86400 = 24 hours)
}
```

**Example**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer",
  "expiresIn": 86400
}
```

**Errors**:
- `401 Unauthorized`: Invalid email or password
- `400 Bad Request`: Missing required fields

---

## Implementation Notes

### Frontend Integration

```typescript
// lib/api/auth.ts
import { apiClient } from './client';

export const authApi = {
  signup: async (data: SignupData): Promise<User> => {
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
};
```

### Token Storage

Store JWT token in Zustand store with persistence:

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (credentials) => {
        const authResponse = await authApi.login(credentials);
        set({
          token: authResponse.accessToken,
          isAuthenticated: true,
        });
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
```

### Axios Interceptor

Add token to all authenticated requests:

```typescript
// lib/api/client.ts
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Validation Rules

### Email
- Must be valid email format
- Maximum 255 characters
- Case-insensitive

### Password
- Minimum 8 characters
- Maximum 128 characters
- No specific complexity requirements (backend may enforce)

---

## Error Response Format

All errors follow this structure:

```typescript
{
  error: {
    code: string;        // Error code (e.g., "VALIDATION_ERROR")
    message: string;     // User-friendly message
    details?: any;       // Optional additional details
  }
}
```

**Example**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email or password",
    "details": {
      "email": "Invalid email format"
    }
  }
}
```
