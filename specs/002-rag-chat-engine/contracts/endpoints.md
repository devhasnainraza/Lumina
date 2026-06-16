# API Endpoints: RAG Engine & Chat System

**Feature**: 002-rag-chat-engine  
**Date**: 2026-05-07  
**Base URL**: `http://localhost:8001`  
**API Version**: v1

## Authentication

All chat endpoints require JWT authentication via Bearer token in the Authorization header.

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained from the authentication endpoints (from Spec 1):
- POST `/auth/signup` - Create new user account
- POST `/auth/login` - Obtain JWT token

## Rate Limiting

- **Chat requests**: 10 requests per minute per user
- **History requests**: 60 requests per minute per user
- **Delete requests**: 20 requests per minute per user

Rate limit headers included in responses:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1620000000
```

## Endpoints

### 1. POST /api/chat

Send a query to the RAG system and receive a grounded response with source attribution.

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "query": "What is a list comprehension in Python?",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "stream": false
}
```

**Request Schema**:
- `query` (string, required): User's question (1-2000 characters)
- `session_id` (UUID, optional): Existing session ID. If omitted, creates new session.
- `stream` (boolean, optional): Enable streaming response. Default: false

**Response (Non-Streaming)** - Status 200:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "role": "assistant",
    "content": "A list comprehension is a concise way to create lists in Python. It provides a compact syntax for generating new lists by applying an expression to each item in an existing iterable. The basic syntax is [expression for item in iterable if condition].",
    "sources": [
      {
        "document_id": "770e8400-e29b-41d4-a716-446655440002",
        "document_name": "Python Basics.pdf",
        "chunk_index": 42,
        "page_reference": "Page 15",
        "relevance_score": 0.89
      },
      {
        "document_id": "770e8400-e29b-41d4-a716-446655440002",
        "document_name": "Python Basics.pdf",
        "chunk_index": 43,
        "page_reference": "Page 16",
        "relevance_score": 0.85
      }
    ],
    "created_at": "2026-05-07T10:30:00Z"
  }
}
```

**Response (Streaming)** - Status 200, Content-Type: text/event-stream:

Stream format using Server-Sent Events (SSE):

```
data: {"type": "token", "content": "A"}

data: {"type": "token", "content": " list"}

data: {"type": "token", "content": " comprehension"}

...

data: {"type": "done", "session_id": "550e8400-e29b-41d4-a716-446655440000", "message_id": "660e8400-e29b-41d4-a716-446655440001", "sources": [{"document_id": "770e8400-e29b-41d4-a716-446655440002", "document_name": "Python Basics.pdf", "chunk_index": 42, "page_reference": "Page 15", "relevance_score": 0.89}]}
```

**Error Responses**:

400 Bad Request - Invalid query:
```json
{
  "detail": "Query must be between 1 and 2000 characters"
}
```

401 Unauthorized - Missing or invalid token:
```json
{
  "detail": "Not authenticated"
}
```

404 Not Found - Session not found or doesn't belong to user:
```json
{
  "detail": "Chat session not found"
}
```

429 Too Many Requests - Rate limit exceeded:
```json
{
  "detail": "Rate limit exceeded. Try again in 30 seconds."
}
```

500 Internal Server Error - LLM API failure:
```json
{
  "detail": "Unable to generate response. Please try again."
}
```

503 Service Unavailable - No relevant context found:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "role": "assistant",
    "content": "I don't have information about that in the uploaded documents. Please try asking about topics covered in your documents.",
    "sources": [],
    "created_at": "2026-05-07T10:30:00Z"
  }
}
```

**Example cURL**:
```bash
# Non-streaming request
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is a list comprehension?",
    "stream": false
  }'

# Streaming request
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is a list comprehension?",
    "stream": true
  }'
```

---

### 2. GET /api/chat/history

List all chat sessions for the authenticated user, ordered by most recent activity.

**Authentication**: Required (JWT)

**Query Parameters**:
- `limit` (integer, optional): Number of sessions to return. Default: 20, Max: 100
- `offset` (integer, optional): Pagination offset. Default: 0

**Response** - Status 200:
```json
{
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Python List Comprehensions",
      "created_at": "2026-05-07T10:00:00Z",
      "updated_at": "2026-05-07T10:30:00Z",
      "message_count": 6
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": null,
      "created_at": "2026-05-06T15:20:00Z",
      "updated_at": "2026-05-06T15:45:00Z",
      "message_count": 4
    }
  ],
  "total": 2,
  "limit": 20,
  "offset": 0
}
```

**Error Responses**:

401 Unauthorized:
```json
{
  "detail": "Not authenticated"
}
```

**Example cURL**:
```bash
curl -X GET "http://localhost:8001/api/chat/history?limit=20&offset=0" \
  -H "Authorization: Bearer <token>"
```

---

### 3. GET /api/chat/{session_id}

Retrieve full conversation history for a specific chat session.

**Authentication**: Required (JWT)

**Path Parameters**:
- `session_id` (UUID, required): Chat session identifier

**Query Parameters**:
- `limit` (integer, optional): Number of messages to return. Default: 100, Max: 500
- `offset` (integer, optional): Pagination offset. Default: 0

**Response** - Status 200:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440010",
      "role": "user",
      "content": "What is a list comprehension?",
      "sources": null,
      "created_at": "2026-05-07T10:00:00Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440011",
      "role": "assistant",
      "content": "A list comprehension is a concise way to create lists in Python...",
      "sources": [
        {
          "document_id": "880e8400-e29b-41d4-a716-446655440020",
          "document_name": "Python Basics.pdf",
          "chunk_index": 42,
          "page_reference": "Page 15",
          "relevance_score": 0.89
        }
      ],
      "created_at": "2026-05-07T10:00:05Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440012",
      "role": "user",
      "content": "Can you show me an example?",
      "sources": null,
      "created_at": "2026-05-07T10:01:00Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440013",
      "role": "assistant",
      "content": "Here's an example: squares = [x**2 for x in range(10)]...",
      "sources": [
        {
          "document_id": "880e8400-e29b-41d4-a716-446655440020",
          "document_name": "Python Basics.pdf",
          "chunk_index": 43,
          "page_reference": "Page 16",
          "relevance_score": 0.87
        }
      ],
      "created_at": "2026-05-07T10:01:03Z"
    }
  ],
  "total_count": 4
}
```

**Error Responses**:

401 Unauthorized:
```json
{
  "detail": "Not authenticated"
}
```

404 Not Found - Session doesn't exist or doesn't belong to user:
```json
{
  "detail": "Chat session not found"
}
```

**Example cURL**:
```bash
curl -X GET "http://localhost:8001/api/chat/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>"
```

---

### 4. DELETE /api/chat/{session_id}

Delete a chat session and all its messages.

**Authentication**: Required (JWT)

**Path Parameters**:
- `session_id` (UUID, required): Chat session identifier

**Response** - Status 204 No Content

(Empty response body on success)

**Error Responses**:

401 Unauthorized:
```json
{
  "detail": "Not authenticated"
}
```

403 Forbidden - Session belongs to another user:
```json
{
  "detail": "Not authorized to delete this session"
}
```

404 Not Found - Session doesn't exist:
```json
{
  "detail": "Chat session not found"
}
```

**Example cURL**:
```bash
curl -X DELETE "http://localhost:8001/api/chat/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>"
```

---

## Common Response Headers

All responses include:
```
Content-Type: application/json (or text/event-stream for streaming)
X-Request-ID: <uuid>
X-RateLimit-Limit: <limit>
X-RateLimit-Remaining: <remaining>
X-RateLimit-Reset: <timestamp>
```

## Error Response Format

All error responses follow this structure:
```json
{
  "detail": "Human-readable error message",
  "error_code": "OPTIONAL_ERROR_CODE",
  "request_id": "uuid-for-debugging"
}
```

## Streaming Protocol Details

### Server-Sent Events (SSE) Format

Streaming responses use SSE with the following event types:

**Token Event** (during generation):
```
data: {"type": "token", "content": "text chunk"}
```

**Done Event** (stream complete):
```
data: {"type": "done", "session_id": "uuid", "message_id": "uuid", "sources": [...]}
```

**Error Event** (stream failure):
```
data: {"type": "error", "message": "Error description"}
```

### Client Implementation Example (JavaScript)

```javascript
const eventSource = new EventSource('/api/chat', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

let fullResponse = '';

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'token') {
    fullResponse += data.content;
    console.log(data.content); // Display token
  } else if (data.type === 'done') {
    console.log('Sources:', data.sources);
    eventSource.close();
  } else if (data.type === 'error') {
    console.error('Stream error:', data.message);
    eventSource.close();
  }
});

eventSource.onerror = (error) => {
  console.error('Connection error:', error);
  eventSource.close();
};
```

## Multi-Turn Conversation Example

```bash
# 1. Start new conversation
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is a decorator in Python?"}'
# Response includes session_id: "550e8400-..."

# 2. Follow-up question (same session)
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Can you show me an example?",
    "session_id": "550e8400-e29b-41d4-a716-446655440000"
  }'

# 3. Another follow-up
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What about error handling?",
    "session_id": "550e8400-e29b-41d4-a716-446655440000"
  }'

# 4. Retrieve full conversation
curl -X GET "http://localhost:8001/api/chat/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>"
```

## CORS Configuration

For frontend integration, the API supports CORS with the following configuration:

```
Access-Control-Allow-Origin: http://localhost:3000 (configurable)
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 3600
```

## Health Check

**GET /health** - Check API health (no authentication required)

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-07T10:00:00Z",
  "services": {
    "database": "up",
    "vector_db": "up",
    "llm_api": "up"
  }
}
```
