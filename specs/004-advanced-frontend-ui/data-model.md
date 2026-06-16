# Data Model: Advanced Frontend UI/UX

**Feature**: 004-advanced-frontend-ui  
**Date**: 2026-05-12  
**Purpose**: Define TypeScript types and interfaces for frontend data structures

---

## Core Data Types

### User & Authentication

```typescript
/**
 * Authenticated user information
 */
interface User {
  id: string;              // UUID
  email: string;           // User email address
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
}

/**
 * Authentication credentials for login
 */
interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data for new users
 */
interface SignupData {
  email: string;
  password: string;
}

/**
 * Authentication response from backend
 */
interface AuthResponse {
  accessToken: string;     // JWT token
  tokenType: 'bearer';
  expiresIn: number;       // Seconds until expiration
}

/**
 * Authentication state in Zustand store
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

---

### Chat & Messaging

```typescript
/**
 * Chat message role
 */
type MessageRole = 'user' | 'assistant';

/**
 * Source citation for AI responses
 */
interface SourceCitation {
  documentId: string;      // UUID of source document
  documentName: string;    // Filename of source document
  chunkIndex: number;      // Index of chunk within document
  pageReference?: string;  // Optional page number or section
  relevanceScore: number;  // 0.0 to 1.0 relevance score
}

/**
 * Individual chat message
 */
interface ChatMessage {
  id: string;              // UUID
  role: MessageRole;
  content: string;         // Message text (markdown for assistant)
  sources?: SourceCitation[]; // Only present for assistant messages
  createdAt: string;       // ISO 8601 timestamp
}

/**
 * Chat session/conversation
 */
interface ChatSession {
  id: string;              // UUID
  title?: string;          // Optional session title
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
  messageCount: number;    // Total messages in session
}

/**
 * Chat request payload
 */
interface ChatRequest {
  query: string;           // User's question
  sessionId?: string;      // Optional session ID for multi-turn
  stream: boolean;         // Enable streaming response
}

/**
 * Chat response (non-streaming)
 */
interface ChatResponse {
  sessionId: string;       // Session ID (new or existing)
  message: ChatMessage;    // AI response message
}

/**
 * Streaming event types
 */
type StreamEventType = 'token' | 'done' | 'error';

/**
 * Streaming token event
 */
interface StreamTokenEvent {
  type: 'token';
  content: string;         // Single token or word
}

/**
 * Streaming completion event
 */
interface StreamDoneEvent {
  type: 'done';
  sources: SourceCitation[];
  messageId: string;       // UUID of completed message
}

/**
 * Streaming error event
 */
interface StreamErrorEvent {
  type: 'error';
  message: string;
}

/**
 * Union type for all stream events
 */
type StreamEvent = StreamTokenEvent | StreamDoneEvent | StreamErrorEvent;

/**
 * Chat UI state in Zustand store
 */
interface ChatState {
  currentSessionId: string | null;
  messages: ChatMessage[];
  streamingMessage: string;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  setCurrentSession: (sessionId: string) => void;
  addMessage: (message: ChatMessage) => void;
  appendStreamingToken: (token: string) => void;
  completeStreaming: (sources: SourceCitation[], messageId: string) => void;
  clearMessages: () => void;
}
```

---

### Documents

```typescript
/**
 * Document file type
 */
type FileType = 'pdf' | 'docx' | 'txt';

/**
 * Document processing status
 */
type DocumentStatus = 'uploaded' | 'processing' | 'completed' | 'failed';

/**
 * Uploaded document metadata
 */
interface Document {
  id: string;              // UUID
  filename: string;        // Original filename
  fileSize: number;        // Size in bytes
  fileType: FileType;
  status: DocumentStatus;
  createdAt: string;       // ISO 8601 timestamp
  processedAt?: string;    // ISO 8601 timestamp (when completed)
  errorMessage?: string;   // Error details if status is 'failed'
}

/**
 * Document with chunk count (detailed view)
 */
interface DocumentDetail extends Document {
  chunkCount: number;      // Number of chunks created
}

/**
 * Document list response with pagination
 */
interface DocumentListResponse {
  documents: Document[];
  total: number;           // Total count across all pages
  limit: number;           // Page size
  offset: number;          // Current offset
}

/**
 * Upload progress tracking
 */
interface UploadProgress {
  filename: string;
  fileSize: number;
  bytesUploaded: number;
  percentage: number;      // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'failed';
  error?: string;
}

/**
 * Upload state in Zustand store
 */
interface UploadState {
  uploads: Map<string, UploadProgress>; // Key: filename
  addUpload: (filename: string, fileSize: number) => void;
  updateProgress: (filename: string, bytesUploaded: number) => void;
  setStatus: (filename: string, status: UploadProgress['status']) => void;
  setError: (filename: string, error: string) => void;
  removeUpload: (filename: string) => void;
}
```

---

### Analytics

```typescript
/**
 * Usage statistics summary
 */
interface UsageStats {
  queryCount: number;      // Total queries sent
  documentCount: number;   // Total documents uploaded
  sessionCount: number;    // Total chat sessions
  tokenUsage?: number;     // Optional token usage tracking
}

/**
 * Activity data point for charts
 */
interface ActivityDataPoint {
  date: string;            // ISO 8601 date (YYYY-MM-DD)
  count: number;           // Activity count for that date
}

/**
 * Document type breakdown
 */
interface DocumentTypeStats {
  pdf: number;
  docx: number;
  txt: number;
}

/**
 * Analytics dashboard data
 */
interface AnalyticsDashboard {
  stats: UsageStats;
  activityTimeline: ActivityDataPoint[]; // Last 7 or 30 days
  documentTypes: DocumentTypeStats;
  storageUsed: number;     // Bytes
  storageLimit?: number;   // Optional bytes limit
}
```

---

### UI State

```typescript
/**
 * Sidebar state
 */
interface SidebarState {
  isOpen: boolean;
  isMobile: boolean;
}

/**
 * Modal state
 */
interface ModalState {
  isOpen: boolean;
  type: 'confirm' | 'alert' | 'custom' | null;
  title?: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

/**
 * Toast notification
 */
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;       // Milliseconds (default 5000)
}

/**
 * Global UI state in Zustand store
 */
interface UIState {
  sidebar: SidebarState;
  modal: ModalState;
  toasts: Toast[];
  theme: 'dark';           // Only dark theme for now
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  openModal: (modal: Omit<ModalState, 'isOpen'>) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}
```

---

## API Response Wrappers

### Success Response

```typescript
/**
 * Standard API success response wrapper
 */
interface ApiSuccessResponse<T> {
  data: T;
  status: number;
  message?: string;
}
```

### Error Response

```typescript
/**
 * Standard API error response
 */
interface ApiErrorResponse {
  error: {
    code: string;          // Error code (e.g., 'VALIDATION_ERROR')
    message: string;       // User-friendly error message
    details?: any;         // Optional error details
  };
  status: number;
}
```

---

## Form Validation Types

### Login Form

```typescript
interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;        // For non-field-specific errors
}
```

### Signup Form

```typescript
interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignupFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}
```

### Chat Input

```typescript
interface ChatInputData {
  query: string;
}

interface ChatInputErrors {
  query?: string;
}
```

---

## Utility Types

### Pagination

```typescript
interface PaginationParams {
  limit: number;           // Page size (default 20)
  offset: number;          // Skip count (default 0)
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;        // Computed: offset + limit < total
}
```

### Loading State

```typescript
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}
```

### Sort & Filter

```typescript
type SortOrder = 'asc' | 'desc';

interface SortParams {
  field: string;
  order: SortOrder;
}

interface FilterParams {
  [key: string]: string | number | boolean;
}
```

---

## Type Guards

```typescript
/**
 * Type guard for stream events
 */
function isStreamTokenEvent(event: StreamEvent): event is StreamTokenEvent {
  return event.type === 'token';
}

function isStreamDoneEvent(event: StreamEvent): event is StreamDoneEvent {
  return event.type === 'done';
}

function isStreamErrorEvent(event: StreamEvent): event is StreamErrorEvent {
  return event.type === 'error';
}

/**
 * Type guard for API errors
 */
function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as any).error === 'object'
  );
}
```

---

## Constants

```typescript
/**
 * File upload constraints
 */
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_TYPES: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'] as const,
  ALLOWED_EXTENSIONS: ['.pdf', '.docx', '.txt'] as const,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION_DEFAULTS = {
  LIMIT: 20,
  OFFSET: 0,
  MAX_LIMIT: 100,
} as const;

/**
 * Chat constraints
 */
export const CHAT_CONSTRAINTS = {
  MAX_QUERY_LENGTH: 2000,
  MIN_QUERY_LENGTH: 1,
  MAX_MESSAGES_PER_SESSION: 100,
} as const;

/**
 * Animation durations (milliseconds)
 */
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

/**
 * Toast durations (milliseconds)
 */
export const TOAST_DURATIONS = {
  SHORT: 3000,
  NORMAL: 5000,
  LONG: 8000,
} as const;
```

---

## Summary

This data model defines all TypeScript types and interfaces used throughout the frontend application. Key characteristics:

1. **Type Safety**: Comprehensive types for all API interactions and UI state
2. **Consistency**: Standard patterns for responses, errors, and state management
3. **Validation**: Form data types with corresponding error types
4. **Streaming**: Dedicated types for SSE streaming events
5. **State Management**: Store interfaces for Zustand (auth, chat, upload, UI)
6. **Utilities**: Reusable types for pagination, sorting, filtering, and async state

All types align with the backend API contracts and support the features defined in the specification.
