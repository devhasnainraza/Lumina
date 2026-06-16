---
id: 0002
title: Create RAG Chat Engine Plan
stage: plan
date: 2026-05-07
surface: agent
model: claude-opus-4-7
feature: 002-rag-chat-engine
branch: 002-rag-chat-engine
user: Muhammad Hasnain
command: /sp.plan
labels: ["plan", "rag", "llm", "openai", "streaming", "chat", "memory", "architecture"]
links:
  spec: specs/002-rag-chat-engine/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-rag-chat-engine/plan.md
  - specs/002-rag-chat-engine/research.md
  - specs/002-rag-chat-engine/data-model.md
  - specs/002-rag-chat-engine/contracts/endpoints.md
  - specs/002-rag-chat-engine/quickstart.md
  - CLAUDE.md (updated with tech stack)
tests:
  - none
---

## Prompt

User invoked `/sp.plan @prompt.md` with a detailed 13-phase implementation breakdown:

**Goal**: Build a production-ready Retrieval-Augmented Generation (RAG) engine that retrieves relevant document context, generates grounded AI responses, supports streaming output, and maintains conversational memory with secure multi-tenant isolation.

**13 Implementation Phases**:
1. RAG Module Structure (services: retriever, context_builder, llm, memory, ranker, prompt_manager)
2. Chat Database Models (Conversation, Message with relationships)
3. Query Embedding Pipeline (reuse from Spec 1)
4. Vector Retrieval System (semantic similarity, Top-K, metadata filtering)
5. Context Builder (chunk assembly, token limits, source references)
6. LLM Integration (OpenAI API, low temperature, retry logic)
7. Streaming Responses (FastAPI StreamingResponse, SSE format)
8. Conversational Memory System (short-term and long-term memory)
9. Chat API Endpoints (POST /api/chat, GET /api/chat/history, DELETE /api/chat/{id})
10. Hallucination Prevention (confidence checks, fallback responses)
11. Hybrid Retrieval (optional: BM25 + vector, reranking)
12. Docker Integration (environment configs, multi-service orchestration)
13. Testing & Validation (factual queries, follow-ups, edge cases)

**Key Requirements**:
- OpenAI GPT-4/GPT-4o for generation
- Temperature 0-0.3 (minimize hallucination)
- Top-K configurable retrieval (default 5)
- Streaming via Server-Sent Events
- Multi-tenant isolation at DB level
- Source attribution in all responses
- Performance: <1s retrieval, <3s full response, <1s first token

## Response snapshot

Created comprehensive implementation plan with complete technical architecture:

**Phase 0 - Research (research.md)**:
- 10 technology decisions documented with rationale and alternatives
- **LLM Provider**: OpenAI API (GPT-4/GPT-4o) for quality and streaming support
- **Streaming**: Server-Sent Events via FastAPI StreamingResponse
- **Vector Retrieval**: Cosine similarity with Top-K (default 5), threshold filtering
- **Context Management**: Token-based truncation with tiktoken, simple strategy (most recent messages)
- **Memory**: Database-backed conversation history in PostgreSQL
- **Prompt Engineering**: Jinja2-style structured templates
- **Error Handling**: Retry logic with exponential backoff, graceful degradation
- **Source Attribution**: Inline citation format with document name and chunk reference
- **Concurrency**: Async/await with FastAPI native support
- **Testing**: Unit + integration with mocked LLM, real vector DB

**Phase 1 - Data Model (data-model.md)**:
- 2 core entities: ChatSession, ChatMessage
- SourceReference embedded as JSONB in ChatMessage
- Complete SQLAlchemy models and Pydantic schemas
- Relationships: User → ChatSession (1:N), ChatSession → ChatMessage (1:N)
- Indexes: (user_id, updated_at DESC), (session_id, created_at ASC)
- Cascade deletes for data cleanup
- Alembic migration strategy

**Phase 1 - API Contracts (contracts/endpoints.md)**:
- 4 REST endpoints documented:
  - POST /api/chat (send query, streaming/non-streaming)
  - GET /api/chat/history (list sessions with pagination)
  - GET /api/chat/{session_id} (retrieve conversation)
  - DELETE /api/chat/{session_id} (delete session)
- Complete request/response schemas with examples
- Error codes and HTTP status mappings
- Rate limiting: 10 chat/min, 60 history/min, 20 delete/min
- SSE streaming protocol details with client examples
- Multi-turn conversation examples
- CORS configuration

**Phase 1 - Quickstart Guide (quickstart.md)**:
- Prerequisites (Spec 1 deployed, OpenAI API key)
- 5-minute quick start (configure, migrate, restart, verify, test)
- Complete workflow example (multi-turn Python conversation)
- 5 verification tests (single-turn, multi-turn, streaming, isolation, fallback)
- Troubleshooting guide (API key, no chunks, streaming, context window, rate limits)
- Development mode instructions (without Docker)
- Production deployment considerations

**Technical Context (plan.md)**:
- Language: Python 3.11+ (inherited from Spec 1)
- Framework: FastAPI 0.104+, SQLAlchemy 2.0+ async, OpenAI SDK, tiktoken, httpx
- Storage: PostgreSQL 15+ (chat), Vector DB from Spec 1 (chunks)
- Testing: pytest, pytest-asyncio, httpx, pytest-mock
- Performance: <1s retrieval (p95), <3s full response (avg), <1s first token
- Scale: 10+ concurrent requests, multiple sessions per user, hundreds of messages

**Constitution Check**: ✅ PASSED (6/6 principles satisfied)
- Data Integrity: Chat history persistence, source attribution accuracy, audit logging
- Security: Row-level security, JWT auth, vector search isolation, input validation
- Scalability: Async operations, concurrent requests, stateless design, resource limits
- Efficiency: Fast retrieval, streaming, context optimization, performance monitoring
- Validation: Input validation, deterministic retrieval, consistent prompting, error handling
- Observability: Chat metadata, source tracking, state tracking, metrics exposure

**Project Structure**:
- Extends Spec 1 backend with new services (retriever, context_builder, llm, memory, prompt_manager)
- New models (ChatSession, ChatMessage) and schemas (chat.py)
- New API route (chat.py) with 4 endpoints
- Integration and unit tests for RAG pipeline

**Agent Context Updated**:
- CLAUDE.md updated with OpenAI SDK, tiktoken, httpx, async SQLAlchemy

## Outcome

- ✅ Impact: Complete implementation plan created for RAG Engine & Chat System with technical architecture, data model, API contracts, and deployment guide ready for task generation
- 🧪 Tests: N/A (planning phase - test strategy documented in research.md and quickstart.md)
- 📁 Files: Created plan.md, research.md, data-model.md, contracts/endpoints.md, quickstart.md; updated CLAUDE.md
- 🔁 Next prompts: `/sp.tasks` to generate actionable task list from plan and spec
- 🧠 Reflection: Planning phase successfully completed all required artifacts. Research phase resolved all technical unknowns with well-justified technology choices (OpenAI for LLM, SSE for streaming, PostgreSQL for chat history, tiktoken for token counting). Data model provides clean entity relationships with proper cascade deletes and indexing. API contracts are comprehensive with streaming protocol details and multi-turn examples. Quickstart guide enables rapid deployment with verification tests. Constitution check passed all 6 principles. Architecture extends Spec 1 cleanly with modular RAG services. Ready for task generation.

## Evaluation notes (flywheel)

- Failure modes observed: None - planning workflow completed successfully
- Graders run and results (PASS/FAIL): Constitution Check PASSED (6/6 principles satisfied)
- Prompt variant (if applicable): Standard /sp.plan workflow with Phase 0 (research) and Phase 1 (design)
- Next experiment (smallest change to try): N/A (baseline plan established successfully)
