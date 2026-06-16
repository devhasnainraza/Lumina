# Implementation Plan: RAG Engine & Chat System

**Branch**: `002-rag-chat-engine` | **Date**: 2026-05-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-rag-chat-engine/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a production-ready RAG engine that retrieves relevant document chunks from the vector database, constructs context-grounded prompts, generates accurate LLM responses with source attribution, supports streaming output, and maintains conversational memory with secure multi-tenant isolation. The system provides REST API endpoints for chat interactions, persists conversation history in PostgreSQL, and ensures responses are grounded in retrieved context to prevent hallucination.

## Technical Context

**Language/Version**: Python 3.11+ (inherited from Spec 1)
**Primary Dependencies**: FastAPI 0.104+, SQLAlchemy 2.0+ (async), OpenAI SDK (LLM + embeddings), ChromaDB or Pinecone SDK (vector DB from Spec 1), python-jose (JWT), Pydantic 2.0+, tiktoken (token counting), httpx (async client)
**Storage**: PostgreSQL 15+ (chat sessions and messages), Vector DB from Spec 1 (document chunks), no file storage needed
**Testing**: pytest, pytest-asyncio, httpx (async client testing), pytest-mock
**Target Platform**: Linux containers (Docker), deployable on any Docker-compatible host
**Project Type**: Web backend (API-only, extends Spec 1 backend)
**Performance Goals**: <1s retrieval (p95), <3s full query-to-response (avg), <1s first token for streaming, 10+ concurrent requests without degradation
**Constraints**: LLM temperature 0-0.3 (minimize hallucination), Top-K configurable (default 5), context must fit within model token limits, JWT auth required for all endpoints, multi-tenant isolation enforced at DB level
**Scale/Scope**: 10+ concurrent chat requests, multiple chat sessions per user, conversation history up to hundreds of messages, support for streaming and non-streaming modes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Data Integrity (NON-NEGOTIABLE)
- ✅ **Retrieved chunks**: Chunks retrieved from vector DB must match original ingested content (validated by Spec 1)
- ✅ **Chat history**: All messages stored with complete content, sources, and timestamps
- ✅ **Source attribution**: Every assistant response includes accurate document references
- ✅ **Audit logging**: All queries, retrievals, and responses logged for debugging

### II. Security & Multi-Tenant Isolation (NON-NEGOTIABLE)
- ✅ **Row-level security**: All chat queries filtered by user_id
- ✅ **JWT authentication**: All chat endpoints protected with token validation
- ✅ **Vector search isolation**: Retrieval queries include user_id filter to prevent cross-user data access
- ✅ **Input validation**: Query validation to prevent injection attacks

### III. Scalability
- ✅ **Async operations**: FastAPI async endpoints for all chat operations
- ✅ **Concurrent requests**: Support 10+ simultaneous chat requests
- ✅ **Stateless design**: RAG services horizontally scalable
- ✅ **Resource limits**: Context window management to prevent token overflow

### IV. Efficiency & Performance
- ✅ **Fast retrieval**: Vector search optimized for <1s response time
- ✅ **Streaming**: Token-by-token streaming to reduce perceived latency
- ✅ **Context optimization**: Intelligent truncation to stay within token limits
- ✅ **Performance monitoring**: Latency tracking for retrieval, generation, and full pipeline

### V. Validation & Standards
- ✅ **Input validation**: Query validation (non-empty, length limits)
- ✅ **Deterministic retrieval**: Same query → same chunks (given same vector DB state)
- ✅ **Consistent prompting**: Structured prompt templates for reproducible responses
- ✅ **Error handling**: Graceful fallbacks for API failures and empty retrievals

### VI. Observability & Metadata
- ✅ **Chat metadata**: session_id, user_id, timestamps, message roles stored
- ✅ **Source tracking**: Retrieved chunks logged with relevance scores
- ✅ **State tracking**: Query processing stages logged (retrieve → build context → generate)
- ✅ **Metrics exposure**: Request/response metrics for monitoring

**Gate Status**: ✅ PASSED - All constitutional requirements addressed in design

## Project Structure

### Documentation (this feature)

```text
specs/002-rag-chat-engine/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
│   └── endpoints.md     # Chat API endpoint specifications
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
│       ├── auth.py          # POST /auth/signup, /auth/login (from Spec 1)
│       ├── documents.py     # Document upload endpoints (from Spec 1)
│       └── chat.py          # NEW: POST /api/chat, GET /api/chat/history, DELETE /api/chat/{id}
├── core/
│   ├── __init__.py
│   ├── config.py            # Settings (add TOP_K, MODEL_NAME, MAX_CONTEXT_TOKENS, TEMPERATURE)
│   ├── security.py          # JWT token validation (from Spec 1)
│   └── logging.py           # Structured logging (from Spec 1)
├── db/
│   ├── __init__.py
│   ├── session.py           # Database session management (from Spec 1)
│   └── base.py              # SQLAlchemy Base class (from Spec 1)
├── models/
│   ├── __init__.py
│   ├── user.py              # User model (from Spec 1)
│   ├── document.py          # Document model (from Spec 1)
│   ├── chunk.py             # Chunk model (from Spec 1)
│   ├── chat_session.py      # NEW: ChatSession model
│   └── chat_message.py      # NEW: ChatMessage model
├── schemas/
│   ├── __init__.py
│   ├── auth.py              # Auth schemas (from Spec 1)
│   ├── document.py          # Document schemas (from Spec 1)
│   └── chat.py              # NEW: Chat request/response schemas
├── services/
│   ├── __init__.py
│   ├── ingestion.py         # Document ingestion (from Spec 1)
│   ├── parser.py            # Text extraction (from Spec 1)
│   ├── chunker.py           # Text chunking (from Spec 1)
│   ├── embedder.py          # Embedding generation (from Spec 1)
│   ├── vector_store.py      # Vector DB operations (from Spec 1)
│   ├── retriever.py         # NEW: Vector search and chunk retrieval
│   ├── context_builder.py   # NEW: Prompt context assembly
│   ├── llm.py               # NEW: LLM interaction (OpenAI API)
│   ├── memory.py            # NEW: Chat memory management
│   └── prompt_manager.py    # NEW: Prompt template management
├── utils/
│   ├── __init__.py
│   ├── file_validation.py   # File validation (from Spec 1)
│   ├── storage.py           # File storage (from Spec 1)
│   └── token_counter.py     # NEW: Token counting utilities (tiktoken)
├── main.py                  # FastAPI app initialization
├── requirements.txt         # Python dependencies (add OpenAI SDK, tiktoken)
└── Dockerfile               # Container image definition

tests/
├── __init__.py
├── conftest.py              # Pytest fixtures (test DB, test client, auth tokens)
├── integration/
│   ├── __init__.py
│   ├── test_auth_flow.py    # Auth tests (from Spec 1)
│   ├── test_upload_flow.py  # Upload tests (from Spec 1)
│   ├── test_isolation.py    # Multi-tenant isolation (from Spec 1)
│   ├── test_chat_flow.py    # NEW: Single-turn RAG query tests
│   ├── test_multi_turn.py   # NEW: Multi-turn conversation tests
│   └── test_streaming.py    # NEW: Streaming response tests
└── unit/
    ├── __init__.py
    ├── test_parser.py       # Text extraction tests (from Spec 1)
    ├── test_chunker.py      # Chunking tests (from Spec 1)
    ├── test_embedder.py     # Embedding tests (from Spec 1)
    ├── test_retriever.py    # NEW: Retrieval logic tests
    ├── test_context_builder.py  # NEW: Context assembly tests
    ├── test_llm.py          # NEW: LLM interaction tests (mocked)
    └── test_memory.py       # NEW: Memory management tests

docker-compose.yml           # Multi-container orchestration (backend, postgres, chromadb)
.env.example                 # Environment variable template (add LLM configs)
README.md                    # Setup and deployment instructions
```

**Structure Decision**: Web backend architecture extending Spec 1. This feature adds new RAG services (retriever, context_builder, llm, memory, prompt_manager) and chat-specific models (ChatSession, ChatMessage) to the existing backend structure. The modular design allows RAG components to be developed and tested independently while integrating seamlessly with the existing document ingestion pipeline from Spec 1.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitutional requirements are satisfied by the proposed architecture.
