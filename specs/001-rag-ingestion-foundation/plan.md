# Implementation Plan: RAG Ingestion Foundation

**Branch**: `001-rag-ingestion-foundation` | **Date**: 2026-05-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-rag-ingestion-foundation/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a secure, scalable, Dockerized document ingestion pipeline that converts user-uploaded files (PDF, DOCX, TXT) into vector embeddings stored in a vector database with proper metadata and multi-tenant isolation. The system provides REST API endpoints for document upload, listing, and deletion, with JWT authentication protecting all operations. Documents are processed asynchronously through a pipeline: upload → validate → extract text → chunk → generate embeddings → store in vector DB and PostgreSQL.

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: FastAPI 0.104+, SQLAlchemy 2.0+, Pydantic 2.0+, python-jose (JWT), bcrypt, python-multipart, OpenAI SDK, ChromaDB or Pinecone SDK, PyMuPDF or pdfplumber, python-docx, tiktoken  
**Storage**: PostgreSQL 15+ (metadata, user data), ChromaDB (local vector storage) or Pinecone (cloud vector storage), local filesystem (uploaded files)  
**Testing**: pytest, pytest-asyncio, httpx (async client testing)  
**Target Platform**: Linux containers (Docker), deployable on any Docker-compatible host  
**Project Type**: Web backend (API-only, no frontend)  
**Performance Goals**: <10s document processing (avg, up to 5MB), <500ms upload validation, <5s embedding generation per document, <1s retrieval query (p95), support 10+ concurrent uploads  
**Constraints**: <10MB file size limit, 95%+ text extraction accuracy, async processing required, JWT auth mandatory, single-command Docker deployment, multi-tenant isolation enforced at DB level  
**Scale/Scope**: 100+ documents per user, 10+ concurrent users, 1000+ total documents across all users (MVP scale)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Data Integrity (NON-NEGOTIABLE)
- ✅ **File validation**: MIME type and magic byte verification on upload
- ✅ **Text extraction accuracy**: Target >95% with format-specific libraries (PyMuPDF/pdfplumber for PDF, python-docx for DOCX)
- ✅ **Reproducible chunking**: Deterministic token-based splitting with tiktoken
- ✅ **Audit logging**: All document operations logged with timestamps and user IDs
- ✅ **Original preservation**: Store uploaded files separately from processed chunks

### II. Security & Multi-Tenant Isolation (NON-NEGOTIABLE)
- ✅ **Row-level security**: All DB queries filtered by user_id
- ✅ **JWT authentication**: All endpoints protected with token validation
- ✅ **File type validation**: Allowlist (PDF, DOCX, TXT) with content verification
- ✅ **Filename sanitization**: Prevent path traversal and executable uploads
- ✅ **Rate limiting**: Per-user upload limits (implementation via middleware)

### III. Scalability
- ✅ **Async operations**: FastAPI async endpoints with background tasks
- ✅ **Background processing**: Document ingestion pipeline runs asynchronously
- ✅ **Stateless design**: API services horizontally scalable
- ✅ **Resource limits**: 10MB file size limit, per-user storage quotas tracked

### IV. Efficiency & Performance
- ✅ **Efficient libraries**: PyMuPDF (fast PDF parsing), tiktoken (fast tokenization)
- ✅ **Batch embeddings**: OpenAI API batch requests where possible
- ✅ **Streaming**: Large file processing with streaming reads
- ✅ **Performance monitoring**: Latency tracking for each pipeline stage

### V. Validation & Standards
- ✅ **Input validation**: Pydantic models for all API requests
- ✅ **Size limits**: 10MB enforced at upload boundary
- ✅ **MIME verification**: python-magic or filetype library for content-based validation
- ✅ **Deterministic chunking**: Same document → same chunks (versioned strategy)

### VI. Observability & Metadata
- ✅ **Metadata storage**: PostgreSQL with document_id, user_id, timestamps, status
- ✅ **State tracking**: Processing status (uploaded, processing, completed, failed)
- ✅ **Structured logging**: Python logging with JSON formatter
- ✅ **Metrics exposure**: FastAPI middleware for request/response metrics

**Gate Status**: ✅ PASSED - All constitutional requirements addressed in design

## Project Structure

### Documentation (this feature)

```text
specs/001-rag-ingestion-foundation/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
│   ├── openapi.yaml     # OpenAPI 3.0 specification
│   └── endpoints.md     # Endpoint documentation
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
backend/
├── api/
│   ├── __init__.py
│   ├── deps.py              # Dependency injection (get_current_user, get_db)
│   └── routes/
│       ├── __init__.py
│       ├── auth.py          # POST /auth/signup, /auth/login
│       └── documents.py     # POST /api/docs/upload, GET /api/docs, DELETE /api/docs/{id}
├── core/
│   ├── __init__.py
│   ├── config.py            # Settings (Pydantic BaseSettings)
│   ├── security.py          # JWT token creation/validation, password hashing
│   └── logging.py           # Structured logging configuration
├── db/
│   ├── __init__.py
│   ├── session.py           # Database session management
│   └── base.py              # SQLAlchemy Base class
├── models/
│   ├── __init__.py
│   ├── user.py              # User model (id, email, password_hash, created_at)
│   ├── document.py          # Document model (id, user_id, filename, file_path, status, created_at)
│   └── chunk.py             # Chunk model (id, document_id, chunk_index, text, token_count)
├── schemas/
│   ├── __init__.py
│   ├── auth.py              # Pydantic schemas for auth (SignupRequest, LoginResponse, Token)
│   └── document.py          # Pydantic schemas for documents (DocumentResponse, DocumentList)
├── services/
│   ├── __init__.py
│   ├── ingestion.py         # Orchestrates full pipeline (upload → parse → chunk → embed → store)
│   ├── parser.py            # Text extraction (PDF, DOCX, TXT)
│   ├── chunker.py           # Text chunking with overlap (tiktoken-based)
│   ├── embedder.py          # OpenAI embedding generation
│   └── vector_store.py      # Vector DB operations (ChromaDB or Pinecone)
├── utils/
│   ├── __init__.py
│   ├── file_validation.py   # MIME type, size, content validation
│   └── storage.py           # File storage helpers
├── main.py                  # FastAPI app initialization
├── requirements.txt         # Python dependencies
└── Dockerfile               # Container image definition

tests/
├── __init__.py
├── conftest.py              # Pytest fixtures (test DB, test client, auth tokens)
├── integration/
│   ├── __init__.py
│   ├── test_auth_flow.py    # Signup → login → protected endpoint
│   ├── test_upload_flow.py  # Upload → process → verify storage
│   └── test_isolation.py    # Multi-tenant isolation tests
└── unit/
    ├── __init__.py
    ├── test_parser.py       # Text extraction accuracy tests
    ├── test_chunker.py      # Chunking consistency tests
    └── test_embedder.py     # Embedding generation tests

docker-compose.yml           # Multi-container orchestration (backend, postgres, chromadb)
.env.example                 # Environment variable template
README.md                    # Setup and deployment instructions
```

**Structure Decision**: Web backend architecture selected. This is an API-only application with no frontend, so we use a single `backend/` directory containing the FastAPI application. The structure follows FastAPI best practices with clear separation of concerns:
- `api/` for HTTP layer (routes, dependencies)
- `services/` for business logic (document processing pipeline)
- `models/` for database entities
- `schemas/` for request/response validation
- `core/` for cross-cutting concerns (config, security, logging)

Docker Compose orchestrates three services: FastAPI backend, PostgreSQL database, and ChromaDB vector store (or Pinecone if cloud-based).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitutional requirements are satisfied by the proposed architecture.
