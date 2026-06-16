/**
 * Chat message role
 */
export type MessageRole = 'user' | 'assistant';

/**
 * Source citation for AI responses
 */
export interface SourceCitation {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  pageReference?: string;
  relevanceScore: number;
}

/**
 * Individual chat message
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources?: SourceCitation[];
  createdAt: string;
}

/**
 * Chat session/conversation
 */
export interface ChatSession {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

/**
 * Chat request payload
 */
export interface ChatRequest {
  query: string;
  sessionId?: string;
  stream: boolean;
}

/**
 * Chat response (non-streaming)
 */
export interface ChatResponse {
  sessionId: string;
  message: ChatMessage;
}

/**
 * Streaming event types
 */
export type StreamEventType = 'token' | 'done' | 'error';

/**
 * Streaming token event
 */
export interface StreamTokenEvent {
  type: 'token';
  content: string;
}

/**
 * Streaming completion event
 */
export interface StreamDoneEvent {
  type: 'done';
  sources: SourceCitation[];
  messageId?: string;
  message_id?: string;
  sessionId?: string;
  session_id?: string;
}

/**
 * Streaming error event
 */
export interface StreamErrorEvent {
  type: 'error';
  message: string;
}

/**
 * Union type for all stream events
 */
export type StreamEvent = StreamTokenEvent | StreamDoneEvent | StreamErrorEvent;

/**
 * Chat input data
 */
export interface ChatInputData {
  query: string;
}

/**
 * Chat input errors
 */
export interface ChatInputErrors {
  query?: string;
}

/**
 * Type guards for stream events
 */
export function isStreamTokenEvent(event: StreamEvent): event is StreamTokenEvent {
  return event.type === 'token';
}

export function isStreamDoneEvent(event: StreamEvent): event is StreamDoneEvent {
  return event.type === 'done';
}

export function isStreamErrorEvent(event: StreamEvent): event is StreamErrorEvent {
  return event.type === 'error';
}
