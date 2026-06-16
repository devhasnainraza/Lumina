# Research: RAG Ingestion Foundation

**Feature**: 001-rag-ingestion-foundation  
**Date**: 2026-05-06  
**Purpose**: Document technology choices, best practices, and architectural decisions for the document ingestion pipeline

## Technology Stack Decisions

### 1. Backend Framework: FastAPI

**Decision**: Use FastAPI 0.104+ as the web framework

**Rationale**:
- Native async/await support for non-blocking I/O operations (critical for file uploads and processing)
- Automatic OpenAPI documentation generation
- Built-in request/response validation with Pydantic
- High performance (comparable to Node.js and Go)
- Excellent type hints and IDE support
- Large ecosystem and active community

**Alternatives Considered**:
- Flask: Lacks native async support, requires extensions
- Django: Too heavyweight for API-only application, slower performance
- Starlette: Lower-level, FastAPI is built on top of it with better DX

**Best Practices**:
- Use dependency injection for database sessions and auth
- Separate routers by domain (auth, documents)
- Use background tasks for long-running operations
- Implement proper exception handlers for consistent error responses

### 2. Authentication: JWT with python-jose

**Decision**: Use JWT tokens with python-jose library and bcrypt for password hashing

**Rationale**:
- Stateless authentication (no server-side session storage)
- Scalable across multiple backend instances
- Industry standard for API authentication
- Easy to implement with FastAPI's security utilities

**Alternatives Considered**:
- Session-based auth: Requires session storage, not stateless
- OAuth2: Overkill for MVP, adds complexity
- API keys: Less secure, no user context

**Best Practices**:
- Use HS256 algorithm for token signing
- Set reasonable token expiration (1-24 hours)
- Include user_id in token payload
- Use bcrypt with cost factor 12 for password hashing
- Implement token refresh mechanism for production

### 3. Database: PostgreSQL 15+ with SQLAlchemy 2.0

**Decision**: PostgreSQL for metadata storage, SQLAlchemy 2.0 as ORM

**Rationale**:
- PostgreSQL: Robust, ACID-compliant, excellent for structured data
- Native support for row-level security (multi-tenant isolation)
- SQLAlchemy 2.0: Modern async support, type-safe queries
- Alembic integration for migrations

**Alternatives Considered**:
- MongoDB: Not ideal for relational data (users → documents → chunks)
- SQLite: Not suitable for concurrent writes in production
- Raw SQL: More error-prone, less maintainable

**Best Practices**:
- Use async SQLAlchemy session (AsyncSession)
- Define relationships with proper foreign keys
- Index user_id and document_id columns
- Use connection pooling
- Implement soft deletes for audit trail

### 4. Vector Database: ChromaDB (local) or Pinecone (cloud)

**Decision**: Support both ChromaDB (default for local dev) and Pinecone (optional for production)

**Rationale**:
- ChromaDB: Easy local setup, no external dependencies, good for MVP
- Pinecone: Managed service, better for production scale
- Both support metadata filtering (critical for multi-tenant isolation)

**Alternatives Considered**:
- Weaviate: More complex setup
- Milvus: Requires more infrastructure
- pgvector: Limited to PostgreSQL, less mature

**Best Practices**:
- Store user_id in vector metadata for filtering
- Use cosine similarity for retrieval
- Batch insert embeddings for performance
- Implement retry logic for API calls
- Abstract vector store behind interface for easy switching

### 5. Text Extraction Libraries

**Decision**: 
- PDF: PyMuPDF (fitz) as primary, pdfplumber as fallback
- DOCX: python-docx
- TXT: Built-in Python file I/O

**Rationale**:
- PyMuPDF: Fast, accurate, handles complex PDFs well
- pdfplumber: Better for tables, use as fallback
- python-docx: Standard library for DOCX, reliable

**Alternatives Considered**:
- PyPDF2: Slower, less accurate than PyMuPDF
- pdfminer: Complex API, slower
- Tika: Requires Java, adds deployment complexity

**Best Practices**:
- Implement fallback chain (PyMuPDF → pdfplumber)
- Normalize whitespace and encoding
- Handle extraction errors gracefully
- Log extraction quality metrics

### 6. Chunking Strategy: tiktoken with Overlap

**Decision**: Use tiktoken for token counting, implement sliding window chunking with 500-1000 tokens and 50-100 token overlap

**Rationale**:
- tiktoken: Official OpenAI tokenizer, accurate token counts
- Overlap: Preserves context across chunk boundaries
- Token-based: Aligns with embedding model limits

**Alternatives Considered**:
- Character-based: Inconsistent with token limits
- Sentence-based only: May exceed token limits
- Semantic chunking: Too complex for MVP

**Best Practices**:
- Split on sentence boundaries when possible
- Maintain chunk metadata (index, position)
- Make chunk size configurable
- Version chunking strategy for future changes

### 7. Embedding Generation: OpenAI text-embedding-3-small

**Decision**: Use OpenAI text-embedding-3-small model

**Rationale**:
- Cost-effective ($0.02 per 1M tokens)
- 1536 dimensions (good balance of quality and size)
- Fast inference
- Well-documented and reliable

**Alternatives Considered**:
- text-embedding-3-large: More expensive, overkill for MVP
- text-embedding-ada-002: Older model, being phased out
- Open-source models: Require hosting, more complexity

**Best Practices**:
- Batch API requests (up to 2048 chunks per request)
- Implement exponential backoff for rate limits
- Cache embeddings by content hash
- Monitor API costs and latency

### 8. Async Processing: FastAPI BackgroundTasks

**Decision**: Use FastAPI's BackgroundTasks for document processing pipeline

**Rationale**:
- Built-in to FastAPI, no external dependencies
- Simple API for fire-and-forget tasks
- Sufficient for MVP scale (10+ concurrent uploads)

**Alternatives Considered**:
- Celery: Overkill for MVP, requires Redis/RabbitMQ
- asyncio.create_task: Less structured, harder to test
- Threading: Not compatible with async code

**Best Practices**:
- Return immediately after upload validation
- Update document status in database
- Implement error handling and logging
- Consider Celery for production scale

### 9. Containerization: Docker + Docker Compose

**Decision**: Multi-container setup with Docker Compose

**Rationale**:
- Single-command deployment (docker-compose up)
- Consistent environment across dev/prod
- Easy service orchestration (backend, postgres, chromadb)

**Best Practices**:
- Use multi-stage builds for smaller images
- Mount volumes for persistent data
- Use .env file for configuration
- Implement health checks
- Use Docker networks for service isolation

### 10. File Validation: python-magic + size checks

**Decision**: Use python-magic for MIME type detection, implement size and content validation

**Rationale**:
- python-magic: Checks file content, not just extension
- Prevents malicious file uploads
- Enforces 10MB size limit

**Best Practices**:
- Validate MIME type against allowlist
- Check file size before reading content
- Sanitize filenames (remove path traversal)
- Reject executable content
- Log validation failures

## Architecture Patterns

### Multi-Tenant Isolation Strategy

**Pattern**: Row-Level Security (RLS) at application level

**Implementation**:
- All database queries include `WHERE user_id = :current_user_id`
- Vector store queries include user_id in metadata filter
- JWT token contains user_id claim
- Dependency injection provides current_user to all endpoints

**Validation**:
- Integration tests verify User A cannot access User B's documents
- Test with multiple users and cross-user access attempts

### Error Handling Strategy

**Pattern**: Centralized exception handlers with structured responses

**Implementation**:
- Custom exception classes (DocumentNotFound, InvalidFileType, etc.)
- FastAPI exception handlers return consistent JSON format
- Log all errors with context (user_id, document_id, stack trace)

**Response Format**:
```json
{
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "File type not supported. Allowed: PDF, DOCX, TXT",
    "details": {}
  }
}
```

### Logging Strategy

**Pattern**: Structured JSON logging with correlation IDs

**Implementation**:
- Use Python's logging module with JSON formatter
- Include request_id in all logs (from middleware)
- Log levels: DEBUG (dev), INFO (prod), ERROR (always)
- Log document processing stages (upload, parse, chunk, embed, store)

## Performance Optimizations

1. **Batch Embedding Generation**: Group chunks and send to OpenAI in batches
2. **Connection Pooling**: SQLAlchemy pool for database connections
3. **Async I/O**: All file and network operations use async/await
4. **Streaming Uploads**: Handle large files with streaming to avoid memory issues
5. **Lazy Loading**: Don't load full document content in list endpoints

## Security Considerations

1. **Input Validation**: Pydantic models validate all inputs
2. **SQL Injection**: SQLAlchemy parameterized queries prevent injection
3. **Path Traversal**: Sanitize filenames before storage
4. **Rate Limiting**: Implement per-user upload limits
5. **CORS**: Configure allowed origins for API access
6. **Secrets Management**: Use environment variables, never commit secrets

## Testing Strategy

1. **Unit Tests**: Test individual components (parser, chunker, embedder)
2. **Integration Tests**: Test full workflows (signup → upload → retrieve)
3. **Isolation Tests**: Verify multi-tenant data separation
4. **Performance Tests**: Measure processing latency and throughput
5. **Accuracy Tests**: Validate text extraction quality (>95%)

## Deployment Considerations

1. **Environment Variables**: DATABASE_URL, OPENAI_API_KEY, JWT_SECRET, VECTOR_DB_PATH
2. **Health Checks**: Implement /health endpoint for monitoring
3. **Graceful Shutdown**: Handle SIGTERM for clean container stops
4. **Log Aggregation**: Use structured logs for easy parsing
5. **Monitoring**: Track document processing metrics (count, latency, errors)

## Open Questions Resolved

All technical unknowns from the specification have been resolved through this research phase. The technology stack is well-defined and ready for implementation.
