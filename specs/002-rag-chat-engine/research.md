# Research: RAG Engine & Chat System

**Feature**: 002-rag-chat-engine  
**Date**: 2026-05-07  
**Purpose**: Document technology choices, best practices, and architectural decisions for the RAG engine and chat system

## Technology Stack Decisions

### 1. LLM Provider: OpenAI API

**Decision**: Use OpenAI API with GPT-4 or GPT-4o for response generation

**Rationale**:
- Industry-leading quality for context-grounded responses
- Native streaming support via API
- Consistent with embedding model choice (OpenAI text-embedding-3-small from Spec 1)
- Well-documented Python SDK with async support
- Reliable uptime and performance

**Alternatives Considered**:
- **Anthropic Claude**: Excellent quality but requires separate embedding solution
- **Google Gemini**: Good quality but less mature Python SDK
- **Open-source models (Llama, Mistral)**: Requires self-hosting infrastructure

**Configuration**:
- Model: `gpt-4` or `gpt-4o` (configurable via environment variable)
- Temperature: 0.0-0.3 (minimize hallucination)
- Max tokens: Configurable (default 1000)
- Top-p: 1.0 (use temperature for randomness control)

### 2. Streaming Implementation: Server-Sent Events (SSE)

**Decision**: Use FastAPI's `StreamingResponse` with Server-Sent Events format

**Rationale**:
- Native FastAPI support for streaming responses
- Simple client-side implementation (EventSource API in browsers)
- Unidirectional communication sufficient for token streaming
- No WebSocket overhead for simple streaming use case
- Compatible with standard HTTP infrastructure (proxies, load balancers)

**Alternatives Considered**:
- **WebSockets**: Bidirectional but overkill for one-way streaming
- **HTTP chunked transfer**: Less structured than SSE
- **gRPC streaming**: Requires additional infrastructure

**Implementation Pattern**:
```python
async def stream_response():
    async for chunk in openai_stream:
        yield f"data: {json.dumps({'token': chunk})}\n\n"
    yield f"data: {json.dumps({'done': True, 'sources': sources})}\n\n"
```

### 3. Vector Retrieval Strategy: Cosine Similarity with Top-K

**Decision**: Use cosine similarity search with configurable Top-K (default 5)

**Rationale**:
- Cosine similarity standard for normalized embeddings
- Top-K provides predictable result set size
- Simple threshold filtering for relevance (e.g., score > 0.7)
- Deterministic results for same query and vector DB state

**Alternatives Considered**:
- **Hybrid search (vector + keyword)**: Added complexity, defer to future iteration
- **Reranking**: Adds latency, defer to future iteration
- **MMR (Maximal Marginal Relevance)**: Useful for diversity but adds complexity

**Configuration**:
- Top-K: 5 (configurable via `TOP_K` environment variable)
- Minimum relevance score: 0.7 (configurable)
- User isolation: Always filter by `user_id` in metadata

### 4. Context Window Management: Token-Based Truncation

**Decision**: Use tiktoken for accurate token counting and simple truncation strategy

**Rationale**:
- tiktoken provides accurate token counts for OpenAI models
- Simple truncation (keep most recent messages) sufficient for MVP
- Predictable behavior and easy to debug
- Avoids complex summarization or compression

**Alternatives Considered**:
- **Conversation summarization**: Adds latency and complexity
- **Semantic compression**: Requires additional model calls
- **Sliding window with overlap**: More complex state management

**Implementation Strategy**:
1. Count tokens for system prompt, retrieved context, and user query (fixed)
2. Calculate remaining budget for conversation history
3. Include messages from most recent backward until budget exhausted
4. Always include at least the current user message

**Token Budget Allocation** (for 8K context model):
- System prompt: ~500 tokens
- Retrieved context: ~2000 tokens (5 chunks × 400 tokens avg)
- User query: ~200 tokens
- Response generation: ~1000 tokens
- Conversation history: ~4300 tokens remaining

### 5. Memory Management: Database-Backed Conversation History

**Decision**: Store all messages in PostgreSQL with session-based retrieval

**Rationale**:
- PostgreSQL provides ACID guarantees for chat history
- Simple query patterns (fetch by session_id, order by timestamp)
- No need for separate memory store (Redis, etc.) at MVP scale
- Supports multi-tenant isolation via user_id filtering

**Alternatives Considered**:
- **Redis for recent messages**: Adds complexity, not needed at current scale
- **In-memory cache**: Loses data on restart, not acceptable
- **Vector-based memory retrieval**: Overkill for conversation history

**Schema Design**:
- ChatSession: Lightweight session metadata
- ChatMessage: Full message content with sources
- Indexed by (user_id, session_id, created_at) for fast retrieval

### 6. Prompt Engineering: Structured Template System

**Decision**: Use Jinja2-style templates with clear sections for system, context, history, and query

**Rationale**:
- Clear separation of prompt components
- Easy to modify and version prompts
- Supports variable injection safely
- Readable and maintainable

**Alternatives Considered**:
- **String concatenation**: Error-prone and hard to maintain
- **LangChain PromptTemplate**: Adds dependency, simple templates sufficient
- **Dynamic prompt generation**: Too flexible, prefer consistency

**Template Structure**:
```
System: You are a helpful assistant. Answer based ONLY on the provided context.

Context:
[Retrieved chunks with sources]

Conversation History:
[Previous messages]

User Query: [Current question]

Instructions:
- Answer only using information from the Context section
- Cite sources using [Document Name, Chunk X] format
- If context doesn't contain the answer, say "I don't have enough information"
```

### 7. Error Handling: Graceful Degradation with Fallbacks

**Decision**: Implement retry logic for API calls and safe fallback responses

**Rationale**:
- External API calls can fail (rate limits, timeouts, service issues)
- Users should receive informative error messages, not crashes
- Streaming errors require special handling (mid-stream failures)

**Error Handling Strategy**:
- **Retrieval failures**: Return empty context, trigger fallback response
- **LLM API failures**: Retry with exponential backoff (3 attempts), then return error message
- **Streaming interruptions**: Send error event in stream, close gracefully
- **Token limit exceeded**: Truncate context and retry, or return error if still too large

**Fallback Responses**:
- No relevant chunks: "I don't have information about that in the uploaded documents."
- API timeout: "I'm having trouble generating a response right now. Please try again."
- Token limit: "Your question is too complex. Please try breaking it into smaller questions."

### 8. Source Attribution: Inline Citation Format

**Decision**: Include sources in response payload with document name and chunk reference

**Rationale**:
- Users need to verify information and explore source documents
- Inline citations maintain context
- Simple format easy to parse and display

**Citation Format**:
```json
{
  "response": "List comprehensions are a concise way to create lists in Python...",
  "sources": [
    {
      "document_id": "uuid",
      "document_name": "Python Basics.pdf",
      "chunk_index": 42,
      "page_reference": "Page 15",
      "relevance_score": 0.89
    }
  ]
}
```

### 9. Concurrency: Async/Await with FastAPI

**Decision**: Use FastAPI's native async support for all I/O operations

**Rationale**:
- FastAPI built on Starlette with excellent async performance
- SQLAlchemy 2.0 supports async operations
- OpenAI SDK supports async API calls
- Enables handling multiple concurrent requests efficiently

**Async Operations**:
- Database queries (SQLAlchemy async session)
- Vector search (async vector DB client)
- LLM API calls (OpenAI async client)
- Streaming responses (async generators)

### 10. Testing Strategy: Unit + Integration with Mocked LLM

**Decision**: Mock LLM API calls in tests, use real vector DB for integration tests

**Rationale**:
- LLM API calls are expensive and non-deterministic
- Mocking allows testing prompt construction and error handling
- Real vector DB tests ensure retrieval logic works correctly
- Integration tests verify end-to-end flow without external API costs

**Test Coverage**:
- **Unit tests**: Retriever, context builder, memory manager, prompt templates (mocked LLM)
- **Integration tests**: Full RAG pipeline with mocked LLM, real DB and vector store
- **Contract tests**: API endpoint schemas and response formats

## Architecture Patterns

### RAG Pipeline Flow

```
1. User Query → JWT Validation
2. Create/Resume Chat Session
3. Generate Query Embedding (reuse embedder from Spec 1)
4. Vector Search (Top-K chunks filtered by user_id)
5. Retrieve Conversation History (last N messages within token budget)
6. Build Context Prompt (system + context + history + query)
7. Call LLM API (streaming or non-streaming)
8. Store User Message + Assistant Response
9. Return Response with Sources
```

### Streaming Pipeline Flow

```
1-6. [Same as above]
7. Call LLM API with stream=True
8. For each token chunk:
   - Yield SSE event with token
   - Accumulate full response
9. After stream complete:
   - Store User Message + Full Assistant Response
   - Yield final SSE event with sources
10. Close stream
```

### Memory Management Strategy

**Short-term memory**: Last N messages from current session (token-budget limited)
**Long-term memory**: All messages persisted in PostgreSQL (retrievable by session_id)

**Context Inclusion Logic**:
1. Always include current user query
2. Include retrieved document chunks (fixed budget)
3. Include previous messages from most recent backward until token budget exhausted
4. Truncate older messages if needed

### Hallucination Prevention

**Strategies**:
1. **Low temperature**: 0.0-0.3 reduces creative generation
2. **Explicit instructions**: System prompt emphasizes "answer ONLY from context"
3. **Relevance filtering**: Only include chunks above threshold score
4. **Fallback responses**: Return safe message when no relevant context found
5. **Source attribution**: Forces model to reference specific chunks

## Performance Optimizations

### Retrieval Optimization
- Index vector DB by user_id for fast filtering
- Cache query embeddings for identical queries (optional future enhancement)
- Batch multiple retrievals if needed (not required for MVP)

### Context Building Optimization
- Pre-compute token counts for system prompt and templates
- Use efficient string concatenation (list join, not repeated +=)
- Lazy load conversation history (only fetch when needed)

### LLM API Optimization
- Use streaming to reduce perceived latency
- Set reasonable timeout (30s for generation)
- Implement retry with exponential backoff
- Monitor token usage to optimize costs

## Security Considerations

### Multi-Tenant Isolation
- **Vector search**: Always filter by user_id in metadata
- **Chat history**: Always filter by user_id in queries
- **Session access**: Verify session ownership before retrieval/deletion

### Input Validation
- **Query length**: Limit to reasonable size (e.g., 2000 characters)
- **Session ID**: Validate UUID format
- **User ID**: Extract from JWT, never trust client input

### Rate Limiting
- Per-user rate limits on chat endpoints (e.g., 10 requests/minute)
- Prevent abuse of streaming endpoints
- Monitor token usage per user

## Monitoring and Observability

### Key Metrics
- **Retrieval latency**: p50, p95, p99
- **LLM API latency**: p50, p95, p99
- **Full pipeline latency**: p50, p95, p99
- **Streaming first token latency**: p50, p95, p99
- **Error rates**: By error type (retrieval, LLM, streaming)
- **Token usage**: Per request and per user

### Logging
- Log all queries with user_id and session_id
- Log retrieved chunks with relevance scores
- Log LLM API calls with token counts
- Log errors with full context for debugging

## Future Enhancements (Out of Scope for MVP)

- **Hybrid search**: Combine vector and keyword search
- **Reranking**: Improve retrieval quality with cross-encoder
- **Conversation summarization**: Compress long conversations
- **Query expansion**: Improve retrieval with query reformulation
- **Feedback loop**: Learn from user feedback (thumbs up/down)
- **Multi-model support**: Allow users to choose LLM
- **Advanced memory**: Semantic memory, episodic memory
