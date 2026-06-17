import { apiClient } from './client';
import type { ChatRequest, ChatResponse, ChatSession, ChatMessage, SourceCitation } from '@/types/chat';

export function mapSource(source: any): SourceCitation {
  if (!source) return source;
  return {
    documentId: source.document_id || source.documentId,
    documentName: source.document_name || source.documentName,
    chunkIndex: source.chunk_index !== undefined ? source.chunk_index : source.chunkIndex,
    pageReference: source.page_reference || source.pageReference,
    relevanceScore: source.relevance_score !== undefined ? source.relevance_score : source.relevanceScore,
  };
}

export function mapMessage(msg: any): ChatMessage {
  if (!msg) return msg;
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    sources: msg.sources?.map(mapSource),
    createdAt: msg.created_at || msg.createdAt,
  };
}

export function mapSession(session: any): ChatSession {
  if (!session) return session;
  return {
    id: session.id,
    title: session.title,
    createdAt: session.created_at || session.createdAt,
    updatedAt: session.updated_at || session.updatedAt,
    messageCount: session.message_count !== undefined ? session.message_count : session.messageCount,
  };
}

export const chatApi = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post('/api/chat', request);
    const data = response.data;
    return {
      sessionId: data.session_id || data.sessionId,
      message: mapMessage(data.message),
    };
  },

  getSessions: async (params?: { limit?: number; offset?: number }) => {
    const response = await apiClient.get('/api/chat/history', { params });
    const data = response.data;
    return {
      sessions: data.sessions?.map(mapSession) || [],
      totalCount: data.total_count !== undefined ? data.total_count : data.totalCount,
      limit: data.limit,
      offset: data.offset,
    };
  },

  getSessionHistory: async (
    sessionId: string,
    params?: { limit?: number; offset?: number }
  ) => {
    const response = await apiClient.get(`/api/chat/${sessionId}`, { params });
    const data = response.data;
    return {
      sessionId: data.session_id || data.sessionId,
      messages: data.messages?.map(mapMessage) || [],
      totalCount: data.total_count !== undefined ? data.total_count : data.totalCount,
      limit: data.limit,
      offset: data.offset,
    };
  },

  deleteSession: async (sessionId: string) => {
    const response = await apiClient.delete(`/api/chat/${sessionId}`);
    return response.data;
  },

  clearSessionMessages: async (sessionId: string) => {
    const response = await apiClient.delete(`/api/chat/${sessionId}/clear`);
    return response.data;
  },

  createSession: async (): Promise<ChatSession> => {
    const response = await apiClient.post('/api/chat/session');
    return mapSession(response.data);
  },
};
