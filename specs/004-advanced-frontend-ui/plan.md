# Implementation Plan: Advanced Frontend UI/UX & AI SaaS Experience

**Branch**: `004-advanced-frontend-ui` | **Date**: 2026-05-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-advanced-frontend-ui/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a premium, production-grade frontend experience for the AI Knowledge Chatbot (RAG+) that delivers a modern AI SaaS product feel with advanced UI/UX, smooth animations, responsive layouts, and tasteful 3D interactions. The frontend will provide authentication, real-time streaming chat with source citations, document management with drag-and-drop uploads, conversation history management, and usage analytics. The interface must feel comparable to high-end AI products (OpenAI, Perplexity, Linear) while maintaining accessibility (WCAG AA), performance (Lighthouse > 90), and responsive design across desktop, tablet, and mobile devices.

**Technical Approach**: Next.js 16+ App Router with TypeScript, Tailwind CSS, and ShadCN UI for the component foundation. Framer Motion for animations and micro-interactions. React Query (TanStack Query) for server state management and Zustand for client state. EventSource API for Server-Sent Events streaming. React Markdown with syntax highlighting for chat messages. Glassmorphism design system with dark theme (#0B1020 background, #7C3AED primary accent). Multi-stage Docker build for production deployment.

## Technical Context

**Language/Version**: TypeScript 5.0+ (strict mode), Node.js 18+  
**Primary Dependencies**: Next.js 16+, React 18+, Tailwind CSS 3.4+, ShadCN UI, Framer Motion 11+, TanStack Query 5+, Zustand 4+, React Markdown, Prism.js (syntax highlighting), Lucide React (icons)  
**Storage**: Browser localStorage for auth tokens, sessionStorage for temporary UI state, IndexedDB for offline draft messages (optional)  
**Testing**: Vitest for unit tests, React Testing Library for component tests, Playwright for E2E tests, Lighthouse CI for performance validation  
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+), responsive design for desktop (1920px+), tablet (768-1024px), mobile (320-767px)  
**Project Type**: Web application (frontend only, consumes existing FastAPI backend)  
**Performance Goals**: Lighthouse performance score > 90, accessibility score > 90, initial page load < 2s (p95), streaming first token < 1s (p95), 60fps animations, bundle size < 500KB (initial), < 2MB (total with code splitting)  
**Constraints**: Must work with existing backend API (FastAPI at port 8001), must support SSE streaming, must handle JWT authentication, must be deployable via Docker, must support reduced motion preferences, must maintain WCAG AA contrast ratios  
**Scale/Scope**: ~50 React components, ~15 pages/routes, ~20 API integration points, ~10 animation variants, ~5 state stores, support 100+ concurrent users, handle 100+ documents per user, support 100+ messages per chat session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle VII: Frontend & User Experience ✅ PASS
- **Requirement**: ChatGPT-like conversational experience with real-time streaming responses
- **Implementation**: EventSource API for SSE streaming, incremental markdown rendering, token-by-token display
- **Requirement**: All UI interactions reflect actual backend state
- **Implementation**: React Query for server state synchronization, optimistic updates with rollback on failure
- **Requirement**: Loading and error states handled gracefully
- **Implementation**: Skeleton loaders, error boundaries, retry mechanisms, user-friendly error messages
- **Requirement**: Responsive design on desktop and tablet minimum
- **Implementation**: Tailwind responsive utilities, mobile-first approach, tested on 320px to 2560px widths
- **Requirement**: Clear visual separation between user and AI messages
- **Implementation**: Distinct message bubbles, color coding, avatar indicators

### Principle VIII: Deployment & Configuration ✅ PASS
- **Requirement**: System runs via Docker Compose with single command
- **Implementation**: Multi-stage Dockerfile for frontend, integrated into existing docker-compose.yml
- **Requirement**: All configuration via environment variables
- **Implementation**: NEXT_PUBLIC_API_URL for backend endpoint, no hardcoded URLs
- **Requirement**: No hardcoded secrets in code or containers
- **Implementation**: Environment variables for all sensitive config, .env.example documentation

### Principle IX: Authentication & Authorization ✅ PASS
- **Requirement**: JWT tokens validated on every request
- **Implementation**: Axios interceptors add Authorization header, handle 401 responses with redirect to login
- **Requirement**: Session expiration redirects to login
- **Implementation**: Token expiration detection, automatic redirect, session restoration after re-login
- **Requirement**: Cross-user data access prevented
- **Implementation**: User ID extracted from validated JWT, all API calls include auth header

### Frontend Performance Targets ✅ PASS
- **Requirement**: Initial page load < 2 seconds (p95)
- **Implementation**: Code splitting, lazy loading, optimized bundle size, Next.js automatic optimization
- **Requirement**: Time to interactive < 3 seconds (p95)
- **Implementation**: Server-side rendering for initial content, progressive hydration
- **Requirement**: Streaming token render < 100ms per token
- **Implementation**: Optimized React rendering, virtual scrolling for long conversations
- **Requirement**: UI responsiveness - no blocking during streaming
- **Implementation**: Web Workers for heavy computations, async rendering, requestIdleCallback for non-critical updates
- **Requirement**: Document upload feedback immediate
- **Implementation**: Optimistic UI updates, progress tracking, real-time status updates

### Accessibility Requirements ✅ PASS
- **Requirement**: WCAG AA contrast ratios
- **Implementation**: Design system colors validated for contrast, automated testing with axe-core
- **Requirement**: Keyboard navigation
- **Implementation**: Proper focus management, tab order, keyboard shortcuts for common actions
- **Requirement**: Screen reader compatibility
- **Implementation**: Semantic HTML, ARIA labels, live regions for dynamic content
- **Requirement**: Reduced motion support
- **Implementation**: Respect prefers-reduced-motion, disable/simplify animations when enabled

### Scale Targets ✅ PASS
- **Requirement**: Support 100+ concurrent users
- **Implementation**: Stateless frontend, efficient rendering, optimized API calls
- **Requirement**: Handle 100+ documents per user
- **Implementation**: Virtual scrolling, pagination, lazy loading
- **Requirement**: Support 100+ messages per chat session
- **Implementation**: Windowed rendering, infinite scroll, message batching

**Gate Status**: ✅ ALL CHECKS PASS - Proceed to Phase 0 Research

## Project Structure

### Documentation (this feature)

```text
specs/004-advanced-frontend-ui/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
│   ├── api-client.ts    # TypeScript API client types
│   ├── auth-api.md      # Authentication endpoints
│   ├── chat-api.md      # Chat endpoints
│   ├── documents-api.md # Document management endpoints
│   └── analytics-api.md # Analytics endpoints
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
frontend/
├── app/                          # Next.js 16+ App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/              # Protected route group
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── chat/
│   │   │   ├── page.tsx          # Main chat interface
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx      # Specific chat session
│   │   ├── documents/
│   │   │   └── page.tsx          # Document management
│   │   ├── analytics/
│   │   │   └── page.tsx          # Usage analytics
│   │   └── settings/
│   │       └── page.tsx          # User settings
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing/home page
│   └── globals.css               # Global styles
│
├── components/
│   ├── ui/                       # ShadCN UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── chat/                     # Chat-specific components
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── StreamingMessage.tsx
│   │   ├── SourceCitation.tsx
│   │   ├── ChatInput.tsx
│   │   └── TypingIndicator.tsx
│   ├── dashboard/                # Dashboard components
│   │   ├── Sidebar.tsx
│   │   ├── TopNav.tsx
│   │   ├── StatsCard.tsx
│   │   └── RecentActivity.tsx
│   ├── upload/                   # Upload components
│   │   ├── DropZone.tsx
│   │   ├── FileUploadCard.tsx
│   │   ├── UploadProgress.tsx
│   │   └── DocumentList.tsx
│   ├── animations/               # Animation components
│   │   ├── FadeIn.tsx
│   │   ├── SlideIn.tsx
│   │   ├── GlassCard.tsx
│   │   └── FloatingElement.tsx
│   └── layout/                   # Layout components
│       ├── Container.tsx
│       ├── Section.tsx
│       └── Grid.tsx
│
├── lib/
│   ├── api/                      # API client
│   │   ├── client.ts             # Axios instance with interceptors
│   │   ├── auth.ts               # Auth API calls
│   │   ├── chat.ts               # Chat API calls
│   │   ├── documents.ts          # Document API calls
│   │   └── analytics.ts          # Analytics API calls
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   ├── useDocuments.ts
│   │   ├── useStreaming.ts
│   │   └── useUpload.ts
│   ├── utils/                    # Utility functions
│   │   ├── cn.ts                 # Class name utility
│   │   ├── format.ts             # Formatting utilities
│   │   └── validation.ts         # Validation utilities
│   └── constants/                # Constants
│       ├── colors.ts
│       ├── animations.ts
│       └── routes.ts
│
├── store/                        # Zustand stores
│   ├── authStore.ts              # Authentication state
│   ├── chatStore.ts              # Chat UI state
│   ├── uiStore.ts                # Global UI state
│   └── uploadStore.ts            # Upload state
│
├── styles/
│   ├── animations.css            # Custom animations
│   └── glassmorphism.css         # Glass effect styles
│
├── types/
│   ├── api.ts                    # API response types
│   ├── chat.ts                   # Chat types
│   ├── document.ts               # Document types
│   └── user.ts                   # User types
│
├── public/
│   ├── fonts/                    # Custom fonts
│   └── images/                   # Static images
│
├── tests/
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # E2E tests with Playwright
│
├── .env.example                  # Environment variables template
├── .env.local                    # Local environment (gitignored)
├── Dockerfile                    # Multi-stage Docker build
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies
└── README.md                     # Frontend documentation
```

**Structure Decision**: Web application structure (Option 2) selected. Frontend is a separate Next.js application that consumes the existing FastAPI backend. The App Router structure provides clear separation between authenticated and public routes using route groups. Components are organized by feature (chat, dashboard, upload) with shared UI components from ShadCN. State management is split between React Query (server state) and Zustand (client state). The structure supports code splitting, lazy loading, and progressive enhancement.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution principles are satisfied by the proposed implementation.
