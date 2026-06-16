# Chat API Contract

**Base URL**: `${NEXT_PUBLIC_API_URL}/api/chat`  
**Version**: 1.0  
**Authentication**: Required (JWT Bearer token)

---

## POST /api/chat

Send a chat query and receive AI response (streaming or non-streaming).

### Request

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body**:
```typescript
{
  query: string;         // User's question (1-2000 characters)
  sessionId?: string;    // Optional UUID for multi-turn conversation
  stream: boolean;       // Enable streaming response
}
```

**Example (Non-Streaming)**:
```json
{
  "query": "What is retrieval-augmented generation?",
  "stream": false
}
```

**Example (Multi-Turn)**:
```json
{
  "query": "Can you explain that in simpler terms?",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "stream": false
}
```

### Response

**Non-Streaming Success (200 OK)**:
```typescript
{
  sessionId: string;     // UUID (new or existing)
  message: {
    id: string;          // UUID
    role: "assistant";
    content: string;     // Markdown-formatted response
    sources: Array<{
      documentId: string;
      documentName: string;
      chunkIndex: number;
      pageReference?: string;
      relevanceScore: number;  // 0.0 to 1.0
    }>;
    createdAt: string;   // ISO 8601
  }
}
```

**Example**:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "role": "assistant",
    "content": "Retrieval-Augmented Generation (RAG) is an AI technique that combines...",
    "sources": [
      {
        "documentId": "770e8400-e29b-41d4-a716-446655440002",
        "documentName": "rag-overview.pdf",
        "chunkIndex": 0,
        "pageReference": "Page 1",
        "relevanceScore": 0.92
      }
    ],
    "createdAt": "2026-05-12T14:35:00Z"
  }
}
```

**Streaming Response (200 OK)**:

Content-Type: `text/event-stream`

Stream format (Server-Sent Events):
```
data: {"type":"token","content":"Retrieval"}
data: {"type":"token","content":"-Augmented"}
data: {"type":"token","content":" Generation"}
...
data: {"type":"done","sources":[...],"messageId":"660e8400..."}
```

**Event Types**:

1. **Token Event**:
```typescript
{
  type: "token";
  content: string;       // Single token/word
}
```

2. **Done Event**:
```typescript
{
  type: "done";
  sources: SourceCitation[];
  messageId: string;     // UUID of completed message
}
```

3. **Error Event**:
```typescript
{
  type: "error";
  message: string;
}
```

**Errors**:
- `400 Bad Request`: Invalid query (empty, too long)
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Session ID not found or doesn't belong to user
- `500 Internal Server Error`: AI generation failed

---

## GET /api/chat/history

List user's chat sessions with pagination.

### Request

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
```typescript
{
  limit?: number;        // Page size (default 20, max 100)
  offset?: number;       // Skip count (default 0)
}
```

**Example**:
```
GET /api/chat/history?limit=20&offset=0
```

### Response

**Success (200 OK)**:
```typescript
{
  sessions: Array<{
    id: string;          // UUID
    title?: string;      // Optional session title
    createdAt: string;   // ISO 8601
    updatedAt: string;   // ISO 8601
    messageCount: number;
  }>;
  totalCount: number;
  limit: number;
  offset: number;
}
```

**Example**:
```json
{
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": null,
      "createdAt": "2026-05-12T14:30:00Z",
      "updatedAt": "2026-05-12T14:35:00Z",
      "messageCount": 4
    }
  ],
  "totalCount": 1,
  "limit": 20,
  "offset": 0
}
```

---

## GET /api/chat/{sessionId}

Retrieve full conversation history for a specific session.

### Request

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
- `sessionId`: UUID of the chat session

**Query Parameters**:
```typescript
{
  limit?: number;        // Messages per page (default 50, max 100)
  offset?: number;       // Skip count (default 0)
}
```

**Example**:
```
GET /api/chat/550e8400-e29b-41d4-a716-446655440000?limit=50&offset=0
```

### Response

**Success (200 OK)**:
```typescript
{
  sessionId: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: SourceCitation[];  // Only for assistant messages
    createdAt: string;
  }>;
  totalCount: number;
  limit: number;
  offset: number;
}
```

**Errors**:
- `404 Not Found`: Session not found or doesn't belong to user

---

## DELETE /api/chat/{sessionId}

Delete a chat session and all its messages.

### Request

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
- `sessionId`: UUID of the chat session

**Example**:
```
DELETE /api/chat/550e8400-e29b-41d4-a716-446655440000
```

### Response

**Success (200 OK)**:
```typescript
{
  success: boolean;
  message: string;
  sessionId: string;
}
```

**Example**:
```json
{
  "success": true,
  "message": "Session deleted successfully",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors**:
- `404 Not Found`: Session not found or doesn't belong to user

---

## Frontend Integration

### Non-Streaming Chat

```typescript
// lib/api/chat.ts
export const chatApi = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post('/api/chat', request);
    return response.data;
  },
};

// Usage with React Query
const { mutate: sendMessage, isLoading } = useMutation({
  mutationFn: chatApi.sendMessage,
  onSuccess: (data) => {
    // Add message to chat store
    chatStore.getState().addMessage(data.message);
  },
});
```

### Streaming Chat

```typescript
// hooks/useStreaming.ts
export function useStreaming(sessionId: string | null) {
  const [streamingMessage, setStreamingMessage] = useState('');
  const [sources, setSources] = useState<SourceCitation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStreaming = useCallback(async (query: string) => {
    setIsStreaming(true);
    setStreamingMessage('');
    
    const eventSource = new EventSource(
      `${API_URL}/api/chat?query=${encodeURIComponent(query)}&sessionId=${sessionId || ''}&stream=true`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    eventSource.onmessage = (event) => {
      const data: StreamEvent = JSON.parse(event.data);
      
      if (data.type === 'token') {
        setStreamingMessage((prev) => prev + data.content);
      } else if (data.type === 'done') {
        setSources(data.sources);
        setIsStreaming(false);
        eventSource.close();
      } else if (data.type === 'error') {
        console.error('Streaming error:', data.message);
        setIsStreaming(false);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setIsStreaming(false);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [sessionId, token]);

  return { streamingMessage, sources, isStreaming, startStreaming };
}
```

### Session Management

```typescript
// hooks/useChat.ts
export function useChatSessions() {
  return useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const response = await apiClient.get('/api/chat/history');
      return response.data;
    },
  });
}

export function useChatHistory(sessionId: string) {
  return useQuery({
    queryKey: ['chat-history', sessionId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/chat/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiClient.delete(`/api/chat/${sessionId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}
```

---

## Streaming Implementation Notes

### EventSource Limitations

- **No Custom Headers**: EventSource doesn't support custom headers in all browsers
- **Workaround**: Pass token as query parameter or use polyfill like `eventsource-polyfill`

### Alternative: Fetch with ReadableStream

```typescript
async function streamChat(query: string, sessionId: string | null) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, sessionId, stream: true }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        // Handle stream event
      }
    }
  }
}
```

---

## Error Handling

### Network Errors

```typescript
try {
  const response = await chatApi.sendMessage(request);
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      // Redirect to login
    } else if (error.response?.status === 404) {
      // Session not found
    } else {
      // Show generic error
    }
  }
}
```

### Streaming Errors

```typescript
eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
  
  // Attempt reconnection with exponential backoff
  const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
  setTimeout(() => startStreaming(query), retryDelay);
};
```
