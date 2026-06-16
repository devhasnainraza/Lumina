# Tasks: RAG Engine & Chat System

**Input**: Design documents from `/specs/002-rag-chat-engine/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are not explicitly requested in the specification, so test tasks are omitted. Focus is on implementation and manual verification per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, this project uses web backend structure:
- Backend code: `backend/`
- Tests: `tests/`
- All paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and configuration for RAG engine

- [ ] T001 Add OpenAI SDK, tiktoken, and httpx to backend/requirements.txt
- [ ] T002 Update core/config.py with RAG configuration (OPENAI_API_KEY, MODEL_NAME, TEMPERATURE, TOP_K, MAX_CONTEXT_TOKENS, MAX_RESPONSE_TOKENS, MIN_RELEVANCE_SCORE)
- [ ] T003 [P] Create utils/token_counter.py with tiktoken integration for token counting utilities
- [ ] T004 [P] Create services/prompt_manager.py with structured prompt templates for RAG system

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create database migration for chat_sessions table in migrations/versions/
- [ ] T006 Create database migration for chat_messages table with JSONB sources field in migrations/versions/
- [ ] T007 Create models/chat_session.py with ChatSession SQLAlchemy model
- [ ] T008 Create models/chat_message.py with ChatMessage SQLAlchemy model and role enum
- [ ] T009 Create schemas/chat.py with Pydantic schemas (ChatRequest, ChatResponse, ChatMessageResponse, SourceReference, ChatSessionSummary, ChatHistoryResponse)
- [ ] T010 Run database migrations with alembic upgrade head
- [ ] T011 Verify chat tables created correctly in PostgreSQL

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Single-Turn RAG Query (Priority: P1) 🎯 MVP

**Goal**: Enable users to send a query and receive a grounded response with source attribution from the RAG system

**Independent Test**: Send a single query via POST /api/chat, verify relevant chunks retrieved, response is grounded, and sources are included

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create services/retriever.py with vector search function (query embedding generation, Top-K retrieval, relevance filtering, user_id isolation)
- [ ] T013 [P] [US1] Create services/context_builder.py with context assembly logic (combine chunks, format sources, enforce token limits)
- [ ] T014 [P] [US1] Create services/llm.py with OpenAI API integration (async client, temperature 0.1, retry logic, timeout handling)
- [ ] T015 [US1] Implement RAG pipeline orchestration in services/retriever.py (query → embed → retrieve → build context → generate → return)
- [ ] T016 [US1] Create api/routes/chat.py with POST /api/chat endpoint (non-streaming mode only for MVP)
- [ ] T017 [US1] Implement session creation logic in chat.py (create new session if session_id not provided)
- [ ] T018 [US1] Implement message persistence in chat.py (store user query and assistant response with sources)
- [ ] T019 [US1] Add input validation for query (non-empty, max 2000 chars) in chat.py
- [ ] T020 [US1] Implement fallback response logic when no relevant chunks found (relevance score below threshold)
- [ ] T021 [US1] Add error handling for LLM API failures (retry with exponential backoff, return error message)
- [ ] T022 [US1] Add logging for query, retrieved chunks, and generated response in chat.py
- [ ] T023 [US1] Register chat routes in main.py

**Checkpoint**: At this point, User Story 1 should be fully functional - users can send queries and receive grounded responses with sources

**Verification** (from quickstart.md):
```bash
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the main topic?", "stream": false}'
```

---

## Phase 4: User Story 2 - Multi-Turn Conversation with Memory (Priority: P2)

**Goal**: Enable multi-turn conversations where follow-up questions reference previous context

**Independent Test**: Start a chat session, ask initial question, then ask follow-up that references previous answer (e.g., "Can you explain that in simpler terms?"), verify context is maintained

### Implementation for User Story 2

- [ ] T024 [P] [US2] Create services/memory.py with conversation history retrieval (fetch messages by session_id, order by created_at)
- [ ] T025 [US2] Implement context window management in memory.py (token counting, truncation strategy - keep most recent messages)
- [ ] T026 [US2] Update context_builder.py to include conversation history in prompt (system + context + history + query)
- [ ] T027 [US2] Update chat.py POST /api/chat to load conversation history when session_id provided
- [ ] T028 [US2] Update chat.py to pass conversation history to context builder
- [ ] T029 [US2] Add token budget allocation logic in context_builder.py (system prompt ~500, context ~2000, query ~200, history ~4300)
- [ ] T030 [US2] Update ChatSession.updated_at timestamp on new message (database trigger or application logic)

**Checkpoint**: At this point, User Story 2 should be fully functional - users can have multi-turn conversations with context maintained

**Verification** (from quickstart.md):
```bash
# First query
SESSION_ID=$(curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "What is a decorator?"}' | jq -r '.session_id')

# Follow-up (should understand "it" refers to decorator)
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"query\": \"Can you explain how it works?\", \"session_id\": \"$SESSION_ID\"}"
```

---

## Phase 5: User Story 3 - Streaming Response Delivery (Priority: P3)

**Goal**: Enable real-time token-by-token streaming of responses to improve perceived responsiveness

**Independent Test**: Send query with stream=true, observe tokens arrive progressively, verify stream completes with sources

### Implementation for User Story 3

- [ ] T031 [P] [US3] Update llm.py to support streaming mode (OpenAI API with stream=True)
- [ ] T032 [US3] Create async generator function in llm.py for token streaming
- [ ] T033 [US3] Update chat.py POST /api/chat to handle streaming requests (check stream parameter)
- [ ] T034 [US3] Implement FastAPI StreamingResponse in chat.py for SSE format
- [ ] T035 [US3] Format streaming events as Server-Sent Events (data: {"type": "token", "content": "..."})
- [ ] T036 [US3] Accumulate full response during streaming for persistence
- [ ] T037 [US3] Send final SSE event with sources after stream completes (data: {"type": "done", "sources": [...]})
- [ ] T038 [US3] Add error handling for mid-stream failures (send error event, close gracefully)
- [ ] T039 [US3] Store accumulated response and sources in database after stream completes

**Checkpoint**: At this point, User Story 3 should be fully functional - users can receive streaming responses

**Verification** (from quickstart.md):
```bash
curl -N -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "Explain in detail", "stream": true}'
```

---

## Phase 6: User Story 4 - Chat Session Management (Priority: P4)

**Goal**: Enable users to list, retrieve, and delete their chat sessions

**Independent Test**: Create multiple sessions, list them, retrieve specific session history, delete a session, verify it's removed

### Implementation for User Story 4

- [ ] T040 [P] [US4] Implement GET /api/chat/history endpoint in chat.py (list user's sessions with pagination)
- [ ] T041 [P] [US4] Implement GET /api/chat/{session_id} endpoint in chat.py (retrieve full conversation history)
- [ ] T042 [P] [US4] Implement DELETE /api/chat/{session_id} endpoint in chat.py (delete session and cascade messages)
- [ ] T043 [US4] Add session ownership verification in GET /api/chat/{session_id} (ensure user_id matches)
- [ ] T044 [US4] Add session ownership verification in DELETE /api/chat/{session_id} (ensure user_id matches)
- [ ] T045 [US4] Add pagination support for GET /api/chat/history (limit, offset parameters)
- [ ] T046 [US4] Add pagination support for GET /api/chat/{session_id} (limit, offset parameters)
- [ ] T047 [US4] Add message count calculation for session summaries in GET /api/chat/history
- [ ] T048 [US4] Return 404 error when session not found or doesn't belong to user

**Checkpoint**: At this point, User Story 4 should be fully functional - users can manage their chat sessions

**Verification** (from quickstart.md):
```bash
# List sessions
curl -X GET "http://localhost:8001/api/chat/history" -H "Authorization: Bearer $TOKEN"

# Get specific session
curl -X GET "http://localhost:8001/api/chat/$SESSION_ID" -H "Authorization: Bearer $TOKEN"

# Delete session
curl -X DELETE "http://localhost:8001/api/chat/$SESSION_ID" -H "Authorization: Bearer $TOKEN"
```

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, monitoring, and production readiness

- [ ] T049 [P] Add rate limiting middleware for chat endpoints (10 requests/min for chat, 60 for history, 20 for delete)
- [ ] T050 [P] Add performance monitoring for retrieval latency (log p50, p95, p99)
- [ ] T051 [P] Add performance monitoring for LLM API latency (log p50, p95, p99)
- [ ] T052 [P] Add performance monitoring for full pipeline latency (log p50, p95, p99)
- [ ] T053 [P] Add token usage tracking per request (log input tokens, output tokens, total cost)
- [ ] T054 [P] Update health check endpoint to include LLM API status
- [ ] T055 [P] Add CORS configuration for frontend integration (if needed)
- [ ] T056 Update .env.example with all RAG configuration variables
- [ ] T057 Update README.md with RAG engine setup instructions
- [ ] T058 Update docker-compose.yml if needed for new environment variables
- [ ] T059 Verify all constitutional requirements met (data integrity, security, scalability, efficiency, validation, observability)
- [ ] T060 Run end-to-end verification tests from quickstart.md (single-turn, multi-turn, streaming, isolation, fallback)

---

## Dependencies & Execution Strategy

### User Story Completion Order

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7 (Polish)
```

**Critical Path**:
1. Setup & Foundational (T001-T011) MUST complete first
2. US1 (T012-T023) is MVP - complete before other stories
3. US2-US4 can be developed in parallel after US1 completes
4. Polish (T049-T060) after all user stories complete

### Parallel Execution Opportunities

**Within Phase 1 (Setup)**:
- T003, T004 can run in parallel (different files)

**Within Phase 2 (Foundational)**:
- T007, T008, T009 can run in parallel after migrations (T005, T006) complete

**Within Phase 3 (US1)**:
- T012, T013, T014 can run in parallel (different service files)
- T015-T023 must run sequentially (dependencies on previous tasks)

**Within Phase 4 (US2)**:
- T024, T025 can run in parallel (memory.py tasks)

**Within Phase 5 (US3)**:
- T031, T032 can run in parallel (llm.py streaming tasks)

**Within Phase 6 (US4)**:
- T040, T041, T042 can run in parallel (different endpoints)

**Within Phase 7 (Polish)**:
- T049-T055 can all run in parallel (different concerns)

### MVP Scope (Recommended First Delivery)

**Minimum Viable Product** = Phase 1 + Phase 2 + Phase 3 (US1 only)

This delivers:
- Single-turn RAG queries
- Grounded responses with source attribution
- Basic chat session creation
- Message persistence
- Fallback handling

**Tasks**: T001-T023 (23 tasks)

**Estimated Effort**: 2-3 days for experienced developer

**Value**: Proves core RAG pipeline works end-to-end

### Incremental Delivery Plan

1. **Sprint 1**: MVP (US1) - T001-T023
2. **Sprint 2**: Multi-turn conversations (US2) - T024-T030
3. **Sprint 3**: Streaming (US3) + Session Management (US4) - T031-T048 (can parallelize)
4. **Sprint 4**: Polish & Production Readiness - T049-T060

---

## Implementation Strategy

### Development Approach

1. **Start with MVP (US1)**: Get single-turn RAG working first
2. **Verify independently**: Test US1 thoroughly before moving to US2
3. **Add features incrementally**: Each user story builds on previous
4. **Maintain backward compatibility**: US2-US4 don't break US1

### Testing Strategy (Manual Verification)

Follow quickstart.md verification tests after each phase:
- **After US1**: Test single-turn query with source attribution
- **After US2**: Test multi-turn conversation with context
- **After US3**: Test streaming response delivery
- **After US4**: Test session listing, retrieval, deletion
- **After Polish**: Run all edge case tests

### Key Integration Points

- **Spec 1 Integration**: Reuse embedder.py and vector_store.py from document ingestion
- **Database**: Extend existing PostgreSQL with chat tables
- **Authentication**: Reuse JWT validation from Spec 1
- **Configuration**: Extend core/config.py with RAG settings

---

## Task Summary

**Total Tasks**: 60
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 7 tasks
- Phase 3 (US1 - MVP): 12 tasks
- Phase 4 (US2): 7 tasks
- Phase 5 (US3): 9 tasks
- Phase 6 (US4): 9 tasks
- Phase 7 (Polish): 12 tasks

**Parallel Opportunities**: 18 tasks marked with [P]

**MVP Scope**: 23 tasks (T001-T023)

**Independent Test Criteria**:
- US1: Single query returns grounded response with sources
- US2: Follow-up question maintains context from previous message
- US3: Streaming delivers tokens progressively
- US4: Sessions can be listed, retrieved, and deleted

**Format Validation**: ✅ All tasks follow checklist format with ID, optional [P], optional [Story], and file paths
