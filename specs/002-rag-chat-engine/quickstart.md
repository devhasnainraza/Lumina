# Quickstart Guide: RAG Engine & Chat System

**Feature**: 002-rag-chat-engine  
**Date**: 2026-05-07  
**Estimated Setup Time**: 15 minutes (assumes Spec 1 already deployed)

## Prerequisites

Before starting, ensure you have:

- **Spec 1 (RAG Ingestion Foundation) deployed and running**:
  - Backend service running on port 8001
  - PostgreSQL database with user and document tables
  - Vector database (ChromaDB or Pinecone) with embedded documents
  - At least one document uploaded and processed
- **OpenAI API key** with access to GPT-4 or GPT-4o
- **Docker and Docker Compose** installed (if using containerized deployment)
- **Python 3.11+** (if running locally without Docker)
- **Valid JWT token** from authentication system

## Quick Start (5 Minutes)

### 1. Configure Environment Variables

Add the following to your `.env` file (or create if it doesn't exist):

```bash
# Existing from Spec 1
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/ragdb
GEMINI_API_KEY=your_gemini_key_here
JWT_SECRET=your_secret_key_here
VECTOR_DB_PATH=/app/data/chromadb
UPLOAD_DIR=/app/uploads

# NEW: LLM Configuration for RAG Engine
OPENAI_API_KEY=sk-your-openai-api-key-here
MODEL_NAME=gpt-4o
TEMPERATURE=0.1
TOP_K=5
MAX_CONTEXT_TOKENS=6000
MAX_RESPONSE_TOKENS=1000
MIN_RELEVANCE_SCORE=0.7
```

### 2. Run Database Migration

Apply the new chat tables migration:

```bash
# If using Docker
docker-compose exec backend alembic upgrade head

# If running locally
cd backend
alembic upgrade head
```

### 3. Restart Backend Service

```bash
# If using Docker
docker-compose restart backend

# If running locally
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Verify Deployment

Check that the backend is running with chat endpoints:

```bash
curl http://localhost:8001/health
```

Expected response:
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

### 5. Test RAG Query

Send your first query:

```bash
# 1. Get JWT token (if you don't have one)
TOKEN=$(curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}' \
  | jq -r '.access_token')

# 2. Send a query
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the main topic of the uploaded documents?",
    "stream": false
  }' | jq
```

Expected response:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "role": "assistant",
    "content": "Based on the uploaded documents, the main topic is...",
    "sources": [
      {
        "document_id": "770e8400-e29b-41d4-a716-446655440002",
        "document_name": "document.pdf",
        "chunk_index": 0,
        "page_reference": "Page 1",
        "relevance_score": 0.92
      }
    ],
    "created_at": "2026-05-07T10:00:00Z"
  }
}
```

## Complete Workflow Example

### Scenario: Multi-Turn Conversation About Python

```bash
# Set your token
TOKEN="your_jwt_token_here"

# 1. Start conversation with initial query
SESSION_ID=$(curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is a list comprehension in Python?"}' \
  | jq -r '.session_id')

echo "Session ID: $SESSION_ID"

# 2. Follow-up question (uses same session)
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"Can you show me an example?\",
    \"session_id\": \"$SESSION_ID\"
  }" | jq

# 3. Another follow-up
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"What about error handling in list comprehensions?\",
    \"session_id\": \"$SESSION_ID\"
  }" | jq

# 4. Retrieve full conversation history
curl -X GET "http://localhost:8001/api/chat/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. List all your chat sessions
curl -X GET "http://localhost:8001/api/chat/history" \
  -H "Authorization: Bearer $TOKEN" | jq

# 6. Delete the session when done
curl -X DELETE "http://localhost:8001/api/chat/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN"
```

## Verification Tests

### Test 1: Single-Turn RAG Query

**Objective**: Verify that the system retrieves relevant chunks and generates grounded responses.

```bash
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the main concept explained in the documents?",
    "stream": false
  }' | jq
```

**Expected**:
- Response includes `session_id`
- Response includes `message` with `content` and `sources`
- Sources array is non-empty
- Response is relevant to uploaded documents

### Test 2: Multi-Turn Conversation

**Objective**: Verify that follow-up questions maintain context.

```bash
# First query
SESSION_ID=$(curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is a decorator?"}' \
  | jq -r '.session_id')

# Follow-up (should understand "it" refers to decorator)
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"Can you explain how it works?\",
    \"session_id\": \"$SESSION_ID\"
  }" | jq
```

**Expected**:
- Second response understands "it" refers to decorator
- Response maintains conversational context

### Test 3: Streaming Response

**Objective**: Verify that streaming delivers tokens progressively.

```bash
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Explain the key concepts in detail",
    "stream": true
  }'
```

**Expected**:
- Response arrives as Server-Sent Events
- Tokens appear progressively (not all at once)
- Final event includes sources

### Test 4: Multi-Tenant Isolation

**Objective**: Verify that users cannot access each other's chat sessions.

```bash
# User A creates session
USER_A_TOKEN="token_for_user_a"
SESSION_A=$(curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Test query"}' \
  | jq -r '.session_id')

# User B tries to access User A's session
USER_B_TOKEN="token_for_user_b"
curl -X GET "http://localhost:8001/api/chat/$SESSION_A" \
  -H "Authorization: Bearer $USER_B_TOKEN"
```

**Expected**:
- User B receives 404 Not Found error
- No cross-user data leakage

### Test 5: Fallback Response

**Objective**: Verify safe fallback when no relevant context found.

```bash
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the weather today?",
    "stream": false
  }' | jq
```

**Expected**:
- Response indicates no relevant information found
- Sources array is empty
- Message explains limitation to uploaded documents

## Troubleshooting

### Issue: "OpenAI API key not configured"

**Solution**: Ensure `OPENAI_API_KEY` is set in `.env` file and backend is restarted.

```bash
# Check if environment variable is loaded
docker-compose exec backend env | grep OPENAI_API_KEY

# If missing, add to .env and restart
docker-compose restart backend
```

### Issue: "No relevant chunks retrieved"

**Possible Causes**:
1. No documents uploaded (run Spec 1 document upload first)
2. Query unrelated to uploaded documents
3. Relevance threshold too high

**Solution**:
```bash
# Check if documents exist
curl -X GET http://localhost:8001/api/docs \
  -H "Authorization: Bearer $TOKEN"

# Lower relevance threshold in .env
MIN_RELEVANCE_SCORE=0.5

# Restart backend
docker-compose restart backend
```

### Issue: "Streaming response not working"

**Possible Causes**:
1. Client doesn't support Server-Sent Events
2. Proxy/load balancer buffering responses

**Solution**:
```bash
# Test with curl (supports SSE)
curl -N -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Test", "stream": true}'

# For proxies, ensure buffering is disabled
# Nginx: proxy_buffering off;
# Apache: SetEnv proxy-sendcl 1
```

### Issue: "Context window exceeded"

**Possible Causes**:
1. Conversation history too long
2. Retrieved chunks too large
3. MAX_CONTEXT_TOKENS too low

**Solution**:
```bash
# Increase context window in .env
MAX_CONTEXT_TOKENS=8000

# Or start a new session
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Your question"}' # Omit session_id
```

### Issue: "Rate limit exceeded"

**Solution**: Wait for rate limit reset or contact administrator to increase limits.

```bash
# Check rate limit headers in response
curl -i -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Test"}'

# Look for:
# X-RateLimit-Remaining: 0
# X-RateLimit-Reset: 1620000000
```

## Development Mode (Without Docker)

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Environment Variables

```bash
export DATABASE_URL="postgresql+asyncpg://localhost:5432/ragdb"
export OPENAI_API_KEY="sk-your-key"
export MODEL_NAME="gpt-4o"
export TEMPERATURE="0.1"
export TOP_K="5"
export MAX_CONTEXT_TOKENS="6000"
```

### 3. Run Database Migration

```bash
alembic upgrade head
```

### 4. Start Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Run Tests

```bash
# Unit tests
pytest tests/unit/ -v

# Integration tests
pytest tests/integration/ -v

# Specific test
pytest tests/integration/test_chat_flow.py -v
```

## Production Deployment Considerations

### Environment Configuration

```bash
# Production .env
OPENAI_API_KEY=sk-prod-key
MODEL_NAME=gpt-4o
TEMPERATURE=0.1
TOP_K=5
MAX_CONTEXT_TOKENS=6000
MAX_RESPONSE_TOKENS=1000
MIN_RELEVANCE_SCORE=0.7

# Rate limiting (requests per minute)
CHAT_RATE_LIMIT=10
HISTORY_RATE_LIMIT=60
DELETE_RATE_LIMIT=20

# Monitoring
LOG_LEVEL=INFO
ENABLE_METRICS=true
```

### Scaling Considerations

- **Horizontal scaling**: Backend is stateless, can run multiple instances behind load balancer
- **Database connection pooling**: Configure SQLAlchemy pool size based on load
- **Vector DB optimization**: Ensure vector DB can handle concurrent queries
- **LLM API rate limits**: Monitor OpenAI API usage and implement queuing if needed

### Monitoring

Key metrics to track:
- Retrieval latency (p50, p95, p99)
- LLM API latency (p50, p95, p99)
- Full pipeline latency (p50, p95, p99)
- Streaming first token latency
- Error rates by type
- Token usage per request
- Active chat sessions

## Next Steps

After verifying the RAG engine works:

1. **Integrate with Frontend** (Spec 3): Build chat UI that consumes these APIs
2. **Optimize Retrieval**: Experiment with Top-K values and relevance thresholds
3. **Improve Prompts**: Refine system prompts for better response quality
4. **Add Analytics**: Track user queries and response quality
5. **Implement Feedback**: Add thumbs up/down for response quality

## Additional Resources

- **API Documentation**: See `contracts/endpoints.md` for complete API reference
- **Data Model**: See `data-model.md` for database schema details
- **Research**: See `research.md` for technology decisions and rationale
- **Spec 1 Documentation**: Refer to `specs/001-rag-ingestion-foundation/` for document upload
