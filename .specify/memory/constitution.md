# AI Knowledge Chatbot (RAG+) Constitution

<!--
Sync Impact Report:
- Version: 1.0.0 → 1.1.0 (Minor version bump - new principles added)
- Modified principles: 
  - Embedding Model updated (OpenAI → Gemini)
  - Storage Architecture updated (vector DB specifics)
- Added sections:
  - Principle VII: Frontend & User Experience
  - Principle VIII: Deployment & Configuration
  - Principle IX: Authentication & Authorization
  - Frontend Technical Standards
  - Docker Deployment Architecture
  - Authentication Standards
- Removed sections: N/A
- Templates requiring updates:
  ✅ spec-template.md (reviewed - aligned with new frontend/deployment principles)
  ✅ plan-template.md (reviewed - constitution check includes new principles)
  ✅ tasks-template.md (reviewed - includes frontend and deployment task types)
- Follow-up TODOs: None
-->

## Core Principles

### I. Data Integrity (NON-NEGOTIABLE)

All uploaded documents MUST remain accurate and unaltered throughout the ingestion, processing, and retrieval pipeline. Text extraction accuracy MUST exceed 95%. Any transformation (chunking, embedding) MUST preserve semantic meaning and be reproducible.

**Rationale**: The system's value depends entirely on returning accurate information. Data corruption or loss undermines user trust and renders the RAG system unreliable.

**How to apply**: 
- Validate file integrity on upload (checksums, format verification)
- Log all document transformations with audit trails
- Implement extraction accuracy tests for each supported format
- Never modify source documents; store originals separately from processed chunks

### II. Security & Multi-Tenant Isolation (NON-NEGOTIABLE)

User data MUST be isolated at the database level. No cross-user data leakage is permitted. All file handling MUST be secure, with validation of file types, sizes, and content before processing.

**Rationale**: This is a multi-tenant system where data privacy is paramount. A single security breach or data leak destroys the product's viability.

**How to apply**:
- Enforce row-level security (RLS) in PostgreSQL for all user data
- Include user_id in all database queries and vector searches
- Validate file types against allowlist (PDF, DOCX, TXT only)
- Sanitize filenames and reject executable content
- Implement rate limiting per user to prevent abuse

### III. Scalability

The pipeline MUST support large files (up to 10MB in MVP, extensible) and multiple concurrent users (minimum 100 documents per user) without failure. All operations MUST be asynchronous where possible to prevent blocking.

**Rationale**: The system must handle real-world usage patterns where users upload multiple documents and expect responsive performance regardless of load.

**How to apply**:
- Use async/await patterns for I/O operations (file uploads, database writes, API calls)
- Implement background job processing for document ingestion
- Design for horizontal scalability (stateless services)
- Set and enforce resource limits per user (storage quotas, concurrent uploads)

### IV. Efficiency & Performance

Chunking and embedding generation MUST be optimized for speed and quality. Average embedding latency per document MUST be under 5 seconds. Chunk sizes MUST be consistent (500-1000 tokens with overlap) and reproducible.

**Rationale**: Users expect near-real-time document processing. Slow ingestion creates poor UX and limits system throughput.

**How to apply**:
- Use efficient text extraction libraries (not shell-out to external tools)
- Batch embedding API calls where possible
- Cache embeddings for identical chunks (content-addressed)
- Monitor and alert on p95 latency exceeding thresholds
- Use streaming for large file processing

### V. Validation & Standards

All inputs MUST be validated before processing. Supported formats are PDF, DOCX, and TXT only. Maximum file size is 10MB (MVP). Chunking strategy MUST be consistent and reproducible across identical inputs.

**Rationale**: Consistent validation prevents system abuse and ensures predictable behavior. Standardized chunking enables reliable retrieval and debugging.

**How to apply**:
- Reject files exceeding size limits at upload boundary
- Verify MIME types and magic bytes (not just extensions)
- Use deterministic chunking algorithms (same input → same chunks)
- Document chunking parameters (size, overlap, splitting strategy) in code
- Version chunking strategies to enable future migrations

### VI. Observability & Metadata

All documents MUST include metadata: document ID, user ID, upload timestamp, processing status. All operations MUST be logged with sufficient context for debugging and auditing.

**Rationale**: Without observability, debugging production issues is impossible. Metadata enables traceability, analytics, and compliance.

**How to apply**:
- Store metadata in PostgreSQL with foreign keys to documents
- Log all state transitions (uploaded → processing → embedded → indexed)
- Include request IDs in all logs for distributed tracing
- Expose metrics for monitoring (documents processed, errors, latency)
- Retain logs for minimum 30 days

### VII. Frontend & User Experience (NON-NEGOTIABLE)

The user interface MUST provide a ChatGPT-like conversational experience with real-time streaming responses. All UI interactions MUST reflect actual backend state. Loading and error states MUST be handled gracefully with clear user feedback.

**Rationale**: User experience determines product adoption. A clunky or unresponsive interface undermines the value of the underlying AI system. Real-time streaming creates perceived responsiveness and engagement.

**How to apply**:
- Implement Server-Sent Events (SSE) for streaming chat responses
- Render markdown incrementally as tokens arrive
- Display source citations clearly with document references
- Show loading states for all async operations (uploads, queries)
- Handle API failures with user-friendly error messages and retry options
- Ensure responsive design works on desktop and tablet (minimum)
- Maintain clear visual separation between user and AI messages

### VIII. Deployment & Configuration (NON-NEGOTIABLE)

The entire system MUST run via Docker Compose with a single command. All configuration MUST be externalized via environment variables. No hardcoded secrets or API keys are permitted in code or containers.

**Rationale**: Containerized deployment ensures consistency across development, staging, and production. Environment-based configuration enables secure secret management and easy deployment to different environments.

**How to apply**:
- Provide separate Docker containers for frontend, backend, database, and vector DB
- Use .env files for all configuration (API keys, database URLs, ports)
- Implement persistent volumes for uploads and database data
- Ensure containers can communicate via Docker network
- Document all required environment variables in .env.example
- Never commit .env files or secrets to version control
- Support docker-compose up as the primary deployment method

### IX. Authentication & Authorization (NON-NEGOTIABLE)

All authenticated routes MUST protect user data. JWT tokens MUST be validated on every request. Session expiration MUST redirect users to login. Cross-user data access MUST be prevented at both API and database levels.

**Rationale**: Authentication is the first line of defense for multi-tenant systems. Weak authentication or authorization enables data breaches and destroys user trust.

**How to apply**:
- Implement Better Auth for JWT-based authentication
- Validate JWT tokens in API middleware before processing requests
- Include user_id from validated token in all database queries
- Implement token refresh to handle expiration gracefully
- Redirect to login on 401 Unauthorized responses
- Never trust client-provided user_id; always extract from validated token
- Implement rate limiting per authenticated user

## Technical Standards

### Supported File Formats
- **PDF**: Text extraction via PyPDF2 or pdfplumber
- **DOCX**: Text extraction via python-docx
- **TXT**: Direct UTF-8 reading

### Chunking Strategy
- **Chunk size**: 500-1000 tokens (configurable per document type)
- **Overlap**: 50-100 tokens to preserve context across boundaries
- **Splitting**: Sentence-aware (prefer natural boundaries)
- **Reproducibility**: Deterministic algorithm with versioning

### Embedding Model
- **Provider**: Google Gemini API (via LangChain)
- **Model**: text-embedding-004
- **Dimensions**: 768 (standard for Gemini)
- **Normalization**: L2 normalization for cosine similarity
- **Free tier**: Available for development and testing

### Storage Architecture
- **Metadata**: PostgreSQL 15+ (user_id, document_id, timestamps, status, chat sessions)
- **Embeddings**: ChromaDB (local) or Pinecone (cloud) for vector storage
- **Source files**: Local filesystem (MVP) with path sanitization
- **Chat history**: PostgreSQL with JSONB for source references

### Frontend Stack
- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS for utility-first styling
- **Components**: ShadCN UI for accessible, customizable components
- **State Management**: React hooks and server components
- **API Client**: Fetch API with TypeScript types
- **Markdown Rendering**: react-markdown for chat messages
- **Streaming**: EventSource API for Server-Sent Events

### Authentication
- **Provider**: Better Auth
- **Method**: JWT-based authentication
- **Token Storage**: HTTP-only cookies (secure)
- **Token Validation**: Middleware on all protected routes
- **Session Management**: Automatic refresh with expiration handling

## Docker Deployment Architecture

### Container Structure
- **frontend**: Next.js application (port 3000)
- **backend**: FastAPI application (port 8001)
- **postgres**: PostgreSQL 15 database (port 5432)
- **chromadb**: ChromaDB vector database (port 8000)

### Network Configuration
- All containers communicate via Docker internal network
- Only frontend and backend expose ports to host
- Database and vector DB are internal-only

### Volume Management
- **uploads_data**: Persistent storage for uploaded documents
- **postgres_data**: Persistent database storage
- **chroma_data**: Persistent vector database storage

### Environment Variables
Required in .env file:
- DATABASE_URL: PostgreSQL connection string
- GEMINI_API_KEY: Google Gemini API key
- JWT_SECRET: Secret for JWT token signing
- NEXT_PUBLIC_API_URL: Backend API URL for frontend
- MODEL_NAME: Gemini model name (default: gemini-1.5-pro)
- VECTOR_DB_PATH: Path to ChromaDB storage

## Performance Requirements

### Backend Latency Targets
- **Upload validation**: < 500ms
- **Text extraction**: < 3 seconds per document (average)
- **Embedding generation**: < 5 seconds per document (average)
- **Retrieval query**: < 1 second (p95)
- **Chat response (non-streaming)**: < 3 seconds (average)
- **Streaming first token**: < 1 second (p95)

### Frontend Performance Targets
- **Initial page load**: < 2 seconds (p95)
- **Time to interactive**: < 3 seconds (p95)
- **Streaming token render**: < 100ms per token
- **UI responsiveness**: No blocking during streaming
- **Document upload feedback**: Immediate progress indication

### Accuracy Targets
- **Text extraction**: > 95% accuracy (measured against ground truth samples)
- **Retrieval relevance**: Top-3 results include correct answer in > 90% of test queries
- **Source attribution**: 100% of AI responses include accurate source references

### Scale Targets (MVP)
- **Documents per user**: Minimum 100 without failure
- **Concurrent users**: Support 10+ simultaneous operations
- **Total system capacity**: 1000+ documents across all users
- **Chat sessions per user**: Unlimited with pagination
- **Messages per session**: Minimum 100 messages with history

## Success Criteria

The system is considered successful when:

### Backend & Data Pipeline (Spec 1)
1. ✅ Documents are successfully uploaded and stored with metadata
2. ✅ Text extraction accuracy exceeds 95% across all supported formats
3. ✅ Embeddings are correctly generated and stored in vector database
4. ✅ No cross-user data leakage in any scenario (verified by security tests)
5. ✅ System handles at least 100 documents per user without failure

### RAG Chat Engine (Spec 2)
6. ✅ Retrieval tests return relevant chunks for test queries
7. ✅ Chat responses are grounded in retrieved context with source attribution
8. ✅ Multi-turn conversations maintain context across messages
9. ✅ Streaming responses deliver tokens in real-time via SSE
10. ✅ Chat sessions persist and can be retrieved/deleted
11. ✅ All operations complete within latency targets (p95)

### Frontend & User Experience (Spec 3)
12. ✅ Users can authenticate successfully via Better Auth
13. ✅ Users can upload and manage documents from the UI
14. ✅ Chat interface streams AI responses in real-time with markdown rendering
15. ✅ Source attribution displays correctly with document references
16. ✅ Chat history persists and reloads across sessions
17. ✅ Dashboard displays uploaded documents with management actions
18. ✅ Frontend handles loading and error states gracefully
19. ✅ Responsive design works on desktop and tablet

### Deployment & Integration (Spec 3)
20. ✅ Entire full-stack system runs with: docker-compose up
21. ✅ All containers start and communicate successfully
22. ✅ Environment variables configure the system completely
23. ✅ Persistent volumes maintain data across container restarts
24. ✅ Frontend and backend integrate reliably with proper CORS
25. ✅ System is production-ready and portfolio-quality

## Governance

### Amendment Process

This constitution supersedes all other development practices and architectural decisions. Amendments require:

1. **Proposal**: Document proposed change with rationale and impact analysis
2. **Review**: Technical review by project stakeholders
3. **Approval**: Explicit approval from project owner
4. **Migration**: Update all dependent templates and documentation
5. **Version bump**: Follow semantic versioning (MAJOR.MINOR.PATCH)

### Versioning Policy

- **MAJOR**: Backward-incompatible changes (principle removal, redefinition)
- **MINOR**: New principles or sections added
- **PATCH**: Clarifications, wording improvements, non-semantic fixes

### Compliance

- All feature specifications MUST reference this constitution
- All implementation plans MUST include a "Constitution Check" section
- All code reviews MUST verify compliance with these principles
- Violations MUST be justified in the "Complexity Tracking" section of plan.md

### Runtime Guidance

For day-to-day development guidance and agent-specific instructions, refer to `CLAUDE.md` in the repository root. The constitution defines WHAT we build; CLAUDE.md defines HOW we build it.

---

**Version**: 1.1.0 | **Ratified**: 2026-05-06 | **Last Amended**: 2026-05-11
