---

description: "Task list for RAG Ingestion Foundation implementation"
---

# Tasks: RAG Ingestion Foundation

**Input**: Design documents from `/specs/001-rag-ingestion-foundation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT included in this task list as they were not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web backend**: `backend/` at repository root
- All paths shown below use this structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create backend project structure with directories: api/, core/, db/, models/, schemas/, services/, utils/
- [x] T002 Create backend/requirements.txt with dependencies: fastapi, uvicorn, sqlalchemy, pydantic, python-jose, bcrypt, python-multipart, openai, chromadb, pymupdf, python-docx, tiktoken, pytest, pytest-asyncio, httpx
- [x] T003 [P] Create backend/main.py with FastAPI app initialization and CORS configuration
- [x] T004 [P] Create .env.example with template variables: DATABASE_URL, OPENAI_API_KEY, JWT_SECRET, VECTOR_DB_PATH
- [x] T005 [P] Create docker-compose.yml with services: backend, postgres, chromadb
- [x] T006 [P] Create backend/Dockerfile with Python 3.11 base image and multi-stage build
- [x] T007 [P] Create tests/ directory structure with conftest.py, integration/, and unit/ subdirectories

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create backend/core/config.py with Pydantic BaseSettings for environment variables
- [x] T009 [P] Create backend/core/logging.py with structured JSON logging configuration
- [x] T010 [P] Create backend/core/security.py with JWT token creation/validation and bcrypt password hashing functions
- [x] T011 Create backend/db/base.py with SQLAlchemy declarative base class
- [x] T012 Create backend/db/session.py with async database session management and connection pooling
- [x] T013 Create backend/models/__init__.py and import all models for SQLAlchemy metadata
- [x] T014 Create backend/models/user.py with User model (id, email, password_hash, created_at, updated_at)
- [x] T015 Create backend/schemas/__init__.py
- [x] T016 [P] Create backend/schemas/auth.py with Pydantic schemas: SignupRequest, LoginRequest, LoginResponse, Token
- [x] T017 Create backend/api/__init__.py
- [x] T018 Create backend/api/deps.py with dependency injection functions: get_db (database session), get_current_user (JWT validation)
- [x] T019 Create backend/api/routes/__init__.py
- [x] T020 Create backend/api/routes/auth.py with POST /auth/signup endpoint (user registration with password hashing)
- [x] T021 Add POST /auth/login endpoint to backend/api/routes/auth.py (authentication with JWT token generation)
- [x] T022 Update backend/main.py to include auth router and exception handlers
- [x] T023 Create tests/conftest.py with pytest fixtures: test_db, test_client, auth_headers

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Document Upload and Processing (Priority: P1) 🎯 MVP

**Goal**: Enable developers to upload documents (PDF, DOCX, TXT) and have them automatically processed into searchable chunks with embeddings

**Independent Test**: Upload a sample PDF via API, verify document metadata in database, confirm chunks created, validate embeddings stored in vector DB

### Implementation for User Story 1

- [x] T024 [P] [US1] Create backend/models/document.py with Document model (id, user_id, filename, file_path, file_size, file_type, status, error_message, created_at, updated_at, processed_at)
- [x] T025 [P] [US1] Create backend/models/chunk.py with Chunk model (id, document_id, chunk_index, text, token_count, created_at)
- [x] T026 [P] [US1] Create backend/schemas/document.py with Pydantic schemas: DocumentResponse, DocumentUploadResponse, DocumentList
- [x] T027 [P] [US1] Create backend/utils/__init__.py
- [x] T028 [P] [US1] Create backend/utils/file_validation.py with functions: validate_file_type (MIME check), validate_file_size (10MB limit), sanitize_filename
- [x] T029 [P] [US1] Create backend/utils/storage.py with functions: save_uploaded_file, delete_file, get_file_path
- [x] T030 [US1] Create backend/services/__init__.py
- [x] T031 [US1] Create backend/services/parser.py with text extraction functions: parse_pdf (PyMuPDF with pdfplumber fallback), parse_docx (python-docx), parse_txt (UTF-8 reading)
- [x] T032 [US1] Create backend/services/chunker.py with chunking function: chunk_text (tiktoken-based, 500-1000 tokens, 50-100 overlap, sentence-aware splitting)
- [x] T033 [US1] Create backend/services/embedder.py with embedding generation function: generate_embeddings (OpenAI text-embedding-3-small, batch processing)
- [x] T034 [US1] Create backend/services/vector_store.py with ChromaDB operations: initialize_collection, insert_embeddings, delete_embeddings, search_similar
- [x] T035 [US1] Create backend/services/ingestion.py with pipeline orchestration: process_document (parse → chunk → embed → store, with error handling and status updates)
- [x] T036 [US1] Create backend/api/routes/documents.py with POST /api/docs/upload endpoint (file validation, save to storage, create document record, trigger background processing)
- [x] T037 [US1] Update backend/main.py to include documents router and configure background tasks
- [x] T038 [US1] Add background task handler to backend/services/ingestion.py for async document processing with status updates

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Document Listing and Metadata Retrieval (Priority: P2)

**Goal**: Enable developers to view all their uploaded documents with metadata and processing status

**Independent Test**: Upload 3 documents via US1, call list endpoint, verify all 3 appear with correct metadata; verify multi-tenant isolation (User A cannot see User B's documents)

### Implementation for User Story 2

- [x] T039 [P] [US2] Add GET /api/docs endpoint to backend/api/routes/documents.py (list user's documents with pagination: limit, offset, status filter)
- [x] T040 [P] [US2] Add GET /api/docs/{document_id} endpoint to backend/api/routes/documents.py (get document details including chunk_count)
- [x] T041 [US2] Update backend/schemas/document.py to add DocumentDetail schema with chunk_count field

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Document Deletion (Priority: P3)

**Goal**: Enable developers to delete documents and all associated data (chunks, embeddings, files)

**Independent Test**: Upload document via US1, confirm it appears via US2, delete it, verify it no longer appears in listings and all associated data is removed

### Implementation for User Story 3

- [x] T042 [US3] Add DELETE /api/docs/{document_id} endpoint to backend/api/routes/documents.py (authorization check, cascade deletion)
- [x] T043 [US3] Add delete_document function to backend/services/ingestion.py (delete chunks from DB, delete embeddings from vector DB, delete file from storage, delete document record)
- [x] T044 [US3] Update backend/schemas/document.py to add DocumentDeleteResponse schema with deletion confirmation and counts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T045 [P] Add GET /health endpoint to backend/main.py (check database and vector DB connectivity)
- [x] T046 [P] Create backend/api/middleware.py with rate limiting middleware (10 uploads/min, 60 reads/min per user)
- [x] T047 [P] Add centralized exception handlers to backend/main.py (DocumentNotFound, InvalidFileType, FileTooLarge, Unauthorized, Forbidden)
- [x] T048 [P] Create README.md with setup instructions, Docker commands, API usage examples, and troubleshooting guide
- [x] T049 [P] Add request logging middleware to backend/main.py (log all requests with user_id, request_id, latency)
- [x] T050 Optimize backend/Dockerfile with multi-stage build and dependency caching
- [x] T051 Add volume mounts to docker-compose.yml for persistent storage (postgres data, chromadb data, uploaded files)
- [x] T052 Create .dockerignore file to exclude unnecessary files from Docker build context
- [ ] T011 Create backend/db/base.py with SQLAlchemy declarative base class
- [ ] T012 Create backend/db/session.py with async database session management and connection pooling
- [ ] T013 Create backend/models/__init__.py and import all models for SQLAlchemy metadata
- [ ] T014 Create backend/models/user.py with User model (id, email, password_hash, created_at, updated_at)
- [ ] T015 Create backend/schemas/__init__.py
- [ ] T016 [P] Create backend/schemas/auth.py with Pydantic schemas: SignupRequest, LoginRequest, LoginResponse, Token
- [ ] T017 Create backend/api/__init__.py
- [ ] T018 Create backend/api/deps.py with dependency injection functions: get_db (database session), get_current_user (JWT validation)
- [ ] T019 Create backend/api/routes/__init__.py
- [ ] T020 Create backend/api/routes/auth.py with POST /auth/signup endpoint (user registration with password hashing)
- [ ] T021 Add POST /auth/login endpoint to backend/api/routes/auth.py (authentication with JWT token generation)
- [ ] T022 Update backend/main.py to include auth router and exception handlers
- [ ] T023 Create tests/conftest.py with pytest fixtures: test_db, test_client, auth_headers

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Document Upload and Processing (Priority: P1) 🎯 MVP

**Goal**: Enable developers to upload documents (PDF, DOCX, TXT) and have them automatically processed into searchable chunks with embeddings

**Independent Test**: Upload a sample PDF via API, verify document metadata in database, confirm chunks created, validate embeddings stored in vector DB

### Implementation for User Story 1

- [ ] T024 [P] [US1] Create backend/models/document.py with Document model (id, user_id, filename, file_path, file_size, file_type, status, error_message, created_at, updated_at, processed_at)
- [ ] T025 [P] [US1] Create backend/models/chunk.py with Chunk model (id, document_id, chunk_index, text, token_count, created_at)
- [ ] T026 [P] [US1] Create backend/schemas/document.py with Pydantic schemas: DocumentResponse, DocumentUploadResponse, DocumentList
- [ ] T027 [P] [US1] Create backend/utils/__init__.py
- [ ] T028 [P] [US1] Create backend/utils/file_validation.py with functions: validate_file_type (MIME check), validate_file_size (10MB limit), sanitize_filename
- [ ] T029 [P] [US1] Create backend/utils/storage.py with functions: save_uploaded_file, delete_file, get_file_path
- [ ] T030 [US1] Create backend/services/__init__.py
- [ ] T031 [US1] Create backend/services/parser.py with text extraction functions: parse_pdf (PyMuPDF with pdfplumber fallback), parse_docx (python-docx), parse_txt (UTF-8 reading)
- [ ] T032 [US1] Create backend/services/chunker.py with chunking function: chunk_text (tiktoken-based, 500-1000 tokens, 50-100 overlap, sentence-aware splitting)
- [ ] T033 [US1] Create backend/services/embedder.py with embedding generation function: generate_embeddings (OpenAI text-embedding-3-small, batch processing)
- [ ] T034 [US1] Create backend/services/vector_store.py with ChromaDB operations: initialize_collection, insert_embeddings, delete_embeddings, search_similar
- [ ] T035 [US1] Create backend/services/ingestion.py with pipeline orchestration: process_document (parse → chunk → embed → store, with error handling and status updates)
- [ ] T036 [US1] Create backend/api/routes/documents.py with POST /api/docs/upload endpoint (file validation, save to storage, create document record, trigger background processing)
- [ ] T037 [US1] Update backend/main.py to include documents router and configure background tasks
- [ ] T038 [US1] Add background task handler to backend/services/ingestion.py for async document processing with status updates

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Document Listing and Metadata Retrieval (Priority: P2)

**Goal**: Enable developers to view all their uploaded documents with metadata and processing status

**Independent Test**: Upload 3 documents via US1, call list endpoint, verify all 3 appear with correct metadata; verify multi-tenant isolation (User A cannot see User B's documents)

### Implementation for User Story 2

- [ ] T039 [P] [US2] Add GET /api/docs endpoint to backend/api/routes/documents.py (list user's documents with pagination: limit, offset, status filter)
- [ ] T040 [P] [US2] Add GET /api/docs/{document_id} endpoint to backend/api/routes/documents.py (get document details including chunk_count)
- [ ] T041 [US2] Update backend/schemas/document.py to add DocumentDetail schema with chunk_count field

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Document Deletion (Priority: P3)

**Goal**: Enable developers to delete documents and all associated data (chunks, embeddings, files)

**Independent Test**: Upload document via US1, confirm it appears via US2, delete it, verify it no longer appears in listings and all associated data is removed

### Implementation for User Story 3

- [ ] T042 [US3] Add DELETE /api/docs/{document_id} endpoint to backend/api/routes/documents.py (authorization check, cascade deletion)
- [ ] T043 [US3] Add delete_document function to backend/services/ingestion.py (delete chunks from DB, delete embeddings from vector DB, delete file from storage, delete document record)
- [ ] T044 [US3] Update backend/schemas/document.py to add DocumentDeleteResponse schema with deletion confirmation and counts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T045 [P] Add GET /health endpoint to backend/main.py (check database and vector DB connectivity)
- [ ] T046 [P] Create backend/api/middleware.py with rate limiting middleware (10 uploads/min, 60 reads/min per user)
- [ ] T047 [P] Add centralized exception handlers to backend/main.py (DocumentNotFound, InvalidFileType, FileTooLarge, Unauthorized, Forbidden)
- [ ] T048 [P] Create README.md with setup instructions, Docker commands, API usage examples, and troubleshooting guide
- [ ] T049 [P] Add request logging middleware to backend/main.py (log all requests with user_id, request_id, latency)
- [ ] T050 Optimize backend/Dockerfile with multi-stage build and dependency caching
- [ ] T051 Add volume mounts to docker-compose.yml for persistent storage (postgres data, chromadb data, uploaded files)
- [ ] T052 Create .dockerignore file to exclude unnecessary files from Docker build context

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1/US2 but independently testable

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task T024: "Create backend/models/document.py"
Task T025: "Create backend/models/chunk.py"

# Launch all schemas for User Story 1 together:
Task T026: "Create backend/schemas/document.py"

# Launch all utilities for User Story 1 together:
Task T027: "Create backend/utils/__init__.py"
Task T028: "Create backend/utils/file_validation.py"
Task T029: "Create backend/utils/storage.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Task Summary

**Total Tasks**: 52

**Tasks by Phase**:
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 16 tasks
- Phase 3 (User Story 1): 15 tasks
- Phase 4 (User Story 2): 3 tasks
- Phase 5 (User Story 3): 3 tasks
- Phase 6 (Polish): 8 tasks

**Tasks by User Story**:
- User Story 1 (Document Upload and Processing): 15 tasks
- User Story 2 (Document Listing): 3 tasks
- User Story 3 (Document Deletion): 3 tasks
- Shared Infrastructure: 31 tasks

**Parallel Opportunities**: 23 tasks marked [P] can run in parallel within their phase

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 38 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
