import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import type { StreamEvent } from '@/types/chat';
import { isStreamTokenEvent, isStreamDoneEvent, isStreamErrorEvent } from '@/types/chat';

export function useStreaming(sessionId: string | null) {
  const router = useRouter();
  const { appendStreamingToken, completeStreaming, setError, resetStreamingState, activeModel, temperature, topK, isStreaming } = useChatStore();

  const startStreaming = useCallback(
    async (query: string) => {
      // Reset any previous streaming state before starting
      resetStreamingState();

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      // Try to get token from localStorage first, then from cookie
      let token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;

      // If not in localStorage, try to get from cookie
      if (!token && typeof window !== 'undefined') {
        const cookies = document.cookie.split(';');
        const authCookie = cookies.find(c => c.trim().startsWith('auth-token='));
        if (authCookie) {
          token = authCookie.split('=')[1];
          console.log('Token found in cookie, syncing to localStorage');
          localStorage.setItem('auth-token', token);
        }
      }

      console.log('Starting stream with token:', token ? 'Token present' : 'No token');

      if (!token) {
        console.error('No auth token found in localStorage or cookies');
        setError('Please login to continue');
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            query,
            session_id: sessionId,
            stream: true,
            model: activeModel,
            temperature: temperature,
            top_k: topK,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Streaming failed:', response.status, errorText);
          throw new Error(`Failed to start streaming: ${response.status} - ${errorText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const lines = part.split('\n');
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                try {
                  const data: StreamEvent = JSON.parse(trimmedLine.slice(6));

                  if (isStreamTokenEvent(data)) {
                    appendStreamingToken(data.content);
                  } else if (isStreamDoneEvent(data)) {
                    console.log('Stream Done Event parsed:', data);
                    const mappedSources = data.sources?.map((source: any) => ({
                      documentId: source.document_id || source.documentId,
                      documentName: source.document_name || source.documentName,
                      chunkIndex: source.chunk_index !== undefined ? source.chunk_index : source.chunkIndex,
                      pageReference: source.page_reference || source.pageReference,
                      relevanceScore: source.relevance_score !== undefined ? source.relevance_score : source.relevanceScore,
                    })) || [];
                    completeStreaming(mappedSources, data.message_id || data.messageId || Math.random().toString(36));

                    // If a new session was created (original sessionId was null), redirect to it
                    const newSessionId = data.session_id || data.sessionId;
                    console.log('Redirect check:', { newSessionId, sessionId, shouldRedirect: !!(newSessionId && newSessionId !== sessionId) });
                    if (newSessionId && newSessionId !== sessionId) {
                      console.log('Redirecting to new session:', newSessionId);
                      useChatStore.getState().setCurrentSession(newSessionId);
                      router.push(`/chat/${newSessionId}`);
                    }
                  } else if (isStreamErrorEvent(data)) {
                    setError(data.message);
                  }
                } catch (e) {
                  console.error('Failed to parse SSE event:', e, 'Line:', trimmedLine);
                }
              }
            }
          }
        }

        // Process any leftover content in the buffer
        if (buffer.trim()) {
          const lines = buffer.split('\n');
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data: ')) {
              try {
                const data: StreamEvent = JSON.parse(trimmedLine.slice(6));

                if (isStreamTokenEvent(data)) {
                  appendStreamingToken(data.content);
                } else if (isStreamDoneEvent(data)) {
                  console.log('Stream Done Event parsed (leftover):', data);
                  const mappedSources = data.sources?.map((source: any) => ({
                    documentId: source.document_id || source.documentId,
                    documentName: source.document_name || source.documentName,
                    chunkIndex: source.chunk_index !== undefined ? source.chunk_index : source.chunkIndex,
                    pageReference: source.page_reference || source.pageReference,
                    relevanceScore: source.relevance_score !== undefined ? source.relevance_score : source.relevanceScore,
                  })) || [];
                  completeStreaming(mappedSources, data.message_id || data.messageId || Math.random().toString(36));

                  const newSessionId = data.session_id || data.sessionId;
                  console.log('Redirect check (leftover):', { newSessionId, sessionId, shouldRedirect: !!(newSessionId && newSessionId !== sessionId) });
                  if (newSessionId && newSessionId !== sessionId) {
                    console.log('Redirecting to new session (leftover):', newSessionId);
                    useChatStore.getState().setCurrentSession(newSessionId);
                    router.push(`/chat/${newSessionId}`);
                  }
                } else if (isStreamErrorEvent(data)) {
                  setError(data.message);
                }
              } catch (e) {
                console.error('Failed to parse leftover SSE event:', e, 'Line:', trimmedLine);
              }
            }
          }
        }
      } catch (error) {
        console.error('Streaming error:', error);
        setError('Failed to stream response');
        // Reset streaming state in store as well
        resetStreamingState();
      }
    },
    [sessionId, appendStreamingToken, completeStreaming, setError, resetStreamingState, activeModel, temperature, topK, router]
  );

  return { startStreaming, isStreaming };
}
