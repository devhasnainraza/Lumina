# Quickstart Guide: Advanced Frontend UI/UX

**Feature**: 004-advanced-frontend-ui  
**Date**: 2026-05-12  
**Purpose**: Get the frontend development environment up and running quickly

---

## Prerequisites

Before starting, ensure you have:

- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher (or yarn/pnpm)
- **Git**: For version control
- **Code Editor**: VS Code recommended with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features
- **Backend Running**: FastAPI backend at `http://localhost:8001`

---

## Initial Setup

### 1. Create Next.js Project

```bash
# Navigate to project root
cd E:/Projects/Rag-Chatbot

# Create Next.js app with TypeScript and Tailwind
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Navigate to frontend directory
cd frontend
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install axios zustand @tanstack/react-query framer-motion

# UI components (ShadCN)
npx shadcn-ui@latest init

# Additional UI libraries
npm install lucide-react react-markdown prismjs

# Development dependencies
npm install -D @types/prismjs
```

### 3. Configure Environment Variables

Create `.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8001

# Optional: Analytics
# NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

Create `.env.example`:

```bash
# Backend API URL (required)
NEXT_PUBLIC_API_URL=http://localhost:8001

# Optional: Analytics tracking
NEXT_PUBLIC_ANALYTICS_ID=
```

### 4. Configure Tailwind CSS

Update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1020',
        surface: '#111827',
        'surface-secondary': '#1F2937',
        primary: '#7C3AED',
        secondary: '#06B6D4',
        'text-primary': '#F9FAFB',
        'text-secondary': '#D1D5DB',
        'text-muted': '#9CA3AF',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### 5. Update Global Styles

Update `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: #0B1020;
    --foreground: #F9FAFB;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  .glass-card {
    @apply bg-surface/70 backdrop-blur-xl border border-white/10;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }
}
```

---

## Project Structure Setup

### 1. Create Directory Structure

```bash
# From frontend directory
mkdir -p lib/{api,hooks,utils,constants}
mkdir -p store
mkdir -p components/{ui,chat,dashboard,upload,animations,layout}
mkdir -p types
mkdir -p app/{auth,dashboard}
```

### 2. Install ShadCN Components

```bash
# Install commonly used components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add select
npx shadcn-ui@latest add skeleton
```

---

## Core Setup Files

### 1. API Client

Create `lib/api/client.ts`:

```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: Handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### 2. React Query Provider

Create `app/providers.tsx`:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

Update `app/layout.tsx`:

```typescript
import { Providers } from './providers';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 3. Auth Store

Create `store/authStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      setToken: (token) => {
        localStorage.setItem('auth-token', token);
        set({ token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('auth-token');
        set({ token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

---

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 2. Verify Backend Connection

Create a test page at `app/test/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export default function TestPage() {
  const [status, setStatus] = useState<string>('Checking...');

  useEffect(() => {
    apiClient
      .get('/health')
      .then(() => setStatus('✅ Backend connected'))
      .catch(() => setStatus('❌ Backend not available'));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Backend Connection Test</h1>
      <p className="mt-4">{status}</p>
    </div>
  );
}
```

Visit `http://localhost:3000/test` to verify backend connectivity.

---

## Building Features

### Priority Order (Based on Spec)

1. **P1 - Authentication & Basic Chat** (MVP)
   - Login/Signup pages
   - Chat interface with streaming
   - Source citations display

2. **P2 - Document Management**
   - Upload interface with drag-and-drop
   - Document list with status
   - Delete functionality

3. **P3 - Conversation History**
   - Session sidebar
   - Session switching
   - Session management

4. **P4 - UI Polish**
   - Animations and transitions
   - Glassmorphism effects
   - Micro-interactions

5. **P5 - Analytics**
   - Usage statistics
   - Activity charts
   - Document type breakdown

---

## Testing

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests (requires Playwright)
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

### Performance Testing

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run Lighthouse
lhci autorun
```

---

## Docker Deployment

### 1. Create Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### 2. Update docker-compose.yml

Add frontend service to root `docker-compose.yml`:

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    container_name: rag-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend
    networks:
      - rag-network
    restart: unless-stopped
```

### 3. Build and Run

```bash
# From project root
docker-compose up --build frontend
```

---

## Troubleshooting

### Backend Connection Issues

**Problem**: "Network Error" when calling API

**Solutions**:
1. Verify backend is running: `curl http://localhost:8001/health`
2. Check CORS settings in backend
3. Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Build Errors

**Problem**: TypeScript errors during build

**Solutions**:
1. Run `npm run type-check` to see all errors
2. Ensure all dependencies are installed
3. Clear `.next` directory: `rm -rf .next`

### Styling Issues

**Problem**: Tailwind classes not working

**Solutions**:
1. Verify `tailwind.config.ts` content paths
2. Restart dev server after config changes
3. Check `globals.css` imports Tailwind directives

---

## Next Steps

After completing the quickstart setup:

1. **Implement P1 Features** (MVP):
   - Create login/signup pages
   - Build chat interface
   - Implement streaming

2. **Add Tests**:
   - Write unit tests for utilities
   - Add component tests
   - Create E2E tests for critical flows

3. **Optimize Performance**:
   - Implement code splitting
   - Add lazy loading
   - Optimize bundle size

4. **Deploy**:
   - Build Docker image
   - Test in production mode
   - Deploy to hosting platform

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript check

# Testing
npm run test             # Run tests
npm run test:watch       # Watch mode
npm run test:e2e         # E2E tests

# Code Quality
npm run format           # Format with Prettier
npm run analyze          # Bundle analysis
```

---

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **ShadCN UI**: https://ui.shadcn.com
- **Framer Motion**: https://www.framer.com/motion
- **React Query**: https://tanstack.com/query/latest

---

## Support

For issues or questions:
- Check the [API contracts](./contracts/) for endpoint details
- Review the [data model](./data-model.md) for type definitions
- Consult the [research document](./research.md) for technology decisions
