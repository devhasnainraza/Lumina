import { create } from 'zustand';
import type { ChatMessage, SourceCitation } from '@/types/chat';

interface ChatState {
  currentSessionId: string | null;
  messages: ChatMessage[];
  streamingMessage: string;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  activeModel: string;
  temperature: number;
  topK: number;
  setCurrentSession: (sessionId: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  appendStreamingToken: (token: string) => void;
  completeStreaming: (sources: SourceCitation[], messageId: string) => void;
  resetStreamingState: () => void;
  clearMessages: () => void;
  setError: (error: string | null) => void;
  setActiveModel: (model: string) => void;
  setTemperature: (temp: number) => void;
  setTopK: (k: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentSessionId: null,
  messages: [],
  streamingMessage: '',
  isStreaming: false,
  isLoading: false,
  error: null,
  activeModel: 'gemini-1.5-pro',
  temperature: 0.1,
  topK: 5,

  setCurrentSession: (sessionId) =>
    set((state) => ({
      currentSessionId: sessionId,
      // Only clear messages and state if switching to a different session or new chat
      ...(state.currentSessionId !== sessionId ? {
        messages: [],
        streamingMessage: '',
        isStreaming: false,
        error: null,
      } : {}),
    })),

  setMessages: (messages) =>
    set({
      messages,
    }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      streamingMessage: '',
      isStreaming: false,
    })),

  appendStreamingToken: (token) =>
    set((state) => ({
      streamingMessage: state.streamingMessage + token,
      isStreaming: true,
    })),

  completeStreaming: (sources, messageId) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: messageId,
          role: 'assistant' as const,
          content: state.streamingMessage,
          sources,
          createdAt: new Date().toISOString(),
        },
      ],
      streamingMessage: '',
      isStreaming: false,
    })),

  resetStreamingState: () =>
    set({
      streamingMessage: '',
      isStreaming: false,
    }),

  clearMessages: () =>
    set({
      messages: [],
      streamingMessage: '',
      isStreaming: false,
      error: null,
    }),

  setError: (error) =>
    set({ error, isLoading: false, isStreaming: false, streamingMessage: '' }),

  setActiveModel: (activeModel) => set({ activeModel }),
  setTemperature: (temperature) => set({ temperature }),
  setTopK: (topK) => set({ topK }),
}));
