# Tasks: Production Infrastructure, Observability & Deployment

**Input**: Design documents from `/specs/003-production-deployment/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are NOT explicitly requested in the specification, so test tasks are excluded.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Infrastructure files**: Root directory (Dockerfile.backend, Dockerfile.frontend, docker-compose.yml)
- **Backend**: backend/ directory (existing)
- **Frontend**: frontend/ directory (to be created)
- **Documentation**: README.md, docs/ directory

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and infrastructure file structure

- [x] T001 Create .dockerignore file for backend in backend/.dockerignore
- [ ] T002 [P] Create .dockerignore file for frontend in frontend/.dockerignore
- [x] T003 [P] Create docs/ directory structure for deployment documentation
- [x] T004 [P] Create backups/ directory for volume backup scripts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Verify backend health check endpoint exists at backend/main.py (lines 149-179)
- [x] T006 [P] Verify backend structured logging is configured in backend/core/logging.py
- [x] T007 [P] Verify backend environment configuration exists in backend/core/config.py

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Complete Stack Deployment with Single Command (Priority: P1) 🎯 MVP

**Goal**: Enable full stack deployment with `docker-compose up` command. All services start successfully, communicate correctly, and the application is functional within 5 minutes.

**Independent Test**: Follow README instructions on a clean machine, run `docker-compose up`, verify all services start, health checks pass, and chat interface processes a query end-to-end.

### Implementation for User Story 1

- [x] T008 [P] [US1] Create backend Dockerfile with multi-stage build in backend/Dockerfile
- [ ] T009 [P] [US1] Create frontend Dockerfile with multi-stage build in frontend/Dockerfile (SKIPPED - frontend not implemented yet)
- [x] T010 [US1] Create docker-compose.yml with all services (frontend, backend, postgres, chromadb) in docker-compose.yml
- [x] T011 [US1] Configure Docker network (rag-network) in docker-compose.yml
- [x] T012 [US1] Configure service dependencies with health check conditions in docker-compose.yml
- [x] T013 [US1] Configure restart policies (unless-stopped) for all services in docker-compose.yml
- [x] T014 [P] [US1] Create .env.example with all required environment variables in .env.example
- [x] T015 [P] [US1] Update README.md with deployment instructions and prerequisites
- [ ] T016 [US1] Test full stack deployment: docker-compose up and verify all services start
- [ ] T017 [US1] Test service communication: frontend → backend → postgres → chromadb
- [ ] T018 [US1] Test end-to-end workflow: upload document and send chat query in deployed containers
- [ ] T019 [US1] Verify container logs are accessible via docker-compose logs
- [ ] T020 [US1] Test automatic container restart by stopping a container manually

**Checkpoint**: At this point, User Story 1 should be fully functional - complete stack deploys with single command

---

## Phase 4: User Story 2 - Persistent Data and File Storage (Priority: P2)

**Goal**: Ensure all data (uploaded files, database records, chat history, vector embeddings) persists correctly across container restarts.

**Independent Test**: Deploy stack, upload documents, create chat sessions, stop containers with `docker-compose down`, restart with `docker-compose up`, verify all data is still accessible.

### Implementation for User Story 2

- [x] T021 [P] [US2] Configure uploads_data volume in docker-compose.yml volumes section
- [x] T022 [P] [US2] Configure postgres_data volume in docker-compose.yml volumes section
- [x] T023 [P] [US2] Configure chroma_data volume in docker-compose.yml volumes section
- [x] T024 [US2] Mount uploads_data volume to backend container at /app/uploads in docker-compose.yml
- [x] T025 [US2] Mount postgres_data volume to postgres container at /var/lib/postgresql/data in docker-compose.yml
- [x] T026 [US2] Mount chroma_data volume to chromadb container at /chroma/chroma in docker-compose.yml
- [ ] T027 [US2] Test uploaded documents persist after container restart
- [ ] T028 [US2] Test chat sessions and message history persist after container restart
- [ ] T029 [US2] Test vector embeddings persist after container restart
- [ ] T030 [US2] Test PostgreSQL data integrity after container restart
- [x] T031 [P] [US2] Create volume backup script in backups/backup-volumes.sh
- [x] T032 [P] [US2] Create volume restore script in backups/restore-volumes.sh
- [x] T033 [P] [US2] Document backup/restore procedures in docs/backup-restore.md

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - deployment works AND data persists

---

## Phase 5: User Story 3 - Service Health Monitoring and Observability (Priority: P3)

**Goal**: Enable monitoring of service health through health check endpoints and centralized logging. Developers can quickly identify service status, diagnose failures, and trace requests.

**Independent Test**: Deploy stack, access health check endpoints, intentionally break a service (stop PostgreSQL), verify health checks report the failure. Trace a request through logs with correlation IDs.

### Implementation for User Story 3

- [x] T034 [P] [US3] Enhance /health endpoint to check database connectivity in backend/main.py
- [x] T035 [P] [US3] Enhance /health endpoint to check vector DB connectivity in backend/main.py
- [x] T036 [P] [US3] Create /ready endpoint for readiness checks in backend/main.py
- [x] T037 [P] [US3] Add Docker HEALTHCHECK to backend Dockerfile
- [ ] T038 [P] [US3] Add Docker HEALTHCHECK to frontend Dockerfile (SKIPPED - frontend not implemented)
- [x] T039 [US3] Configure health checks for postgres service in docker-compose.yml
- [x] T040 [US3] Configure health checks for chromadb service in docker-compose.yml
- [x] T041 [US3] Configure health check intervals and timeouts in docker-compose.yml
- [x] T042 [P] [US3] Implement correlation ID middleware in backend/api/middleware.py
- [x] T043 [P] [US3] Update structured logging to include correlation IDs in backend/core/logging.py
- [x] T044 [P] [US3] Configure JSON log format in backend/core/logging.py
- [x] T045 [P] [US3] Configure log rotation in docker-compose.yml logging section
- [ ] T046 [US3] Test /health endpoint returns 200 when all services healthy
- [ ] T047 [US3] Test /health endpoint returns 503 when database is down
- [ ] T048 [US3] Test Docker health checks report container status correctly
- [ ] T049 [US3] Test logs are accessible via docker-compose logs with timestamps
- [ ] T050 [US3] Test correlation IDs appear in logs for request tracing
- [x] T051 [P] [US3] Document health check endpoints in docs/health-checks.md
- [x] T052 [P] [US3] Document logging configuration in docs/logging.md

**Checkpoint**: All user stories 1-3 should now work - deployment, persistence, AND observability

---

## Phase 6: User Story 4 - Secure Environment Configuration (Priority: P4)

**Goal**: Enable secure configuration via environment variables. Secrets never hardcoded. .env.example documents all variables. Application fails fast with clear errors if configuration is missing.

**Independent Test**: Copy .env.example to .env, omit a required variable (e.g., JWT_SECRET), start application, verify it fails with clear error message. Then provide all variables and verify successful startup.

### Implementation for User Story 4

- [x] T053 [P] [US4] Document DATABASE_URL in .env.example with description and example
- [x] T054 [P] [US4] Document GEMINI_API_KEY in .env.example with description
- [x] T055 [P] [US4] Document JWT_SECRET in .env.example with description and generation instructions
- [x] T056 [P] [US4] Document POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB in .env.example
- [x] T057 [P] [US4] Document NEXT_PUBLIC_API_URL in .env.example
- [x] T058 [P] [US4] Document optional variables (MODEL_NAME, TEMPERATURE, TOP_K, etc.) in .env.example
- [x] T059 [US4] Implement environment variable validation in backend/core/config.py
- [x] T060 [US4] Add startup validation that fails fast with clear error messages in backend/main.py
- [x] T061 [US4] Ensure no API keys appear in logs in backend/core/logging.py
- [x] T062 [US4] Ensure no secrets appear in health check responses in backend/main.py
- [ ] T063 [US4] Test application fails with clear error when JWT_SECRET is missing
- [ ] T064 [US4] Test application fails with clear error when GEMINI_API_KEY is missing
- [ ] T065 [US4] Test application fails with clear error when DATABASE_URL is missing
- [ ] T066 [US4] Test configuration changes apply after .env update and container restart
- [ ] T067 [P] [US4] Document all environment variables in docs/environment-variables.md
- [ ] T068 [P] [US4] Document security best practices for secret management in docs/security.md
- [ ] T062 [US4] Ensure no secrets appear in health check responses in backend/main.py
- [ ] T063 [US4] Test application fails with clear error when JWT_SECRET is missing
- [ ] T064 [US4] Test application fails with clear error when GEMINI_API_KEY is missing
- [ ] T065 [US4] Test application fails with clear error when DATABASE_URL is missing
- [ ] T066 [US4] Test configuration changes apply after .env update and container restart
- [ ] T067 [P] [US4] Document all environment variables in docs/environment-variables.md
- [ ] T068 [P] [US4] Add security best practices for secret management in docs/security.md

**Checkpoint**: All user stories 1-4 should work - deployment, persistence, observability, AND secure configuration

---

## Phase 7: User Story 5 - Production-Ready Container Architecture (Priority: P5)

**Goal**: Optimize Dockerfiles with multi-stage builds, minimal image sizes, non-root users, proper layer caching, and integrated health checks. Architecture follows Docker best practices.

**Independent Test**: Build Docker images, verify backend < 500MB and frontend < 200MB, confirm non-root users, test rebuild performance with layer caching < 2 minutes.

### Implementation for User Story 5

- [ ] T069 [US5] Optimize backend Dockerfile with multi-stage build (builder + runtime) in backend/Dockerfile
- [ ] T070 [US5] Use python:3.11-slim base image for backend runtime stage in backend/Dockerfile
- [ ] T071 [US5] Configure non-root user (appuser) in backend Dockerfile
- [ ] T072 [US5] Optimize layer caching for backend dependencies in backend/Dockerfile
- [ ] T073 [US5] Add HEALTHCHECK instruction to backend Dockerfile
- [ ] T074 [US5] Optimize frontend Dockerfile with multi-stage build (builder + runtime) in frontend/Dockerfile
- [ ] T075 [US5] Use node:18-alpine base image for frontend runtime stage in frontend/Dockerfile
- [ ] T076 [US5] Configure non-root user (node) in frontend Dockerfile
- [ ] T077 [US5] Optimize layer caching for frontend dependencies in frontend/Dockerfile
- [ ] T078 [US5] Configure resource limits (CPU, memory) in docker-compose.yml deploy section
- [ ] T079 [US5] Test backend image size is under 500MB
- [ ] T080 [US5] Test frontend image size is under 200MB
- [ ] T081 [US5] Test containers run as non-root users (verify with docker exec)
- [ ] T082 [US5] Test rebuild performance with code changes (should use layer caching)
- [ ] T083 [US5] Test Docker HEALTHCHECK reports container status correctly
- [ ] T084 [P] [US5] Document Dockerfile optimization techniques in docs/docker-optimization.md
- [ ] T085 [P] [US5] Document security hardening measures in docs/security.md

**Checkpoint**: All user stories complete - full production-ready deployment architecture

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and final improvements

- [ ] T086 [P] Create comprehensive deployment guide in docs/deployment.md
- [ ] T087 [P] Create troubleshooting guide in docs/troubleshooting.md
- [ ] T088 [P] Create architecture documentation in docs/architecture.md
- [ ] T089 [P] Create cloud deployment guides (Railway, Render, Vercel) in docs/cloud-deployment.md
- [ ] T090 [P] Update README.md with complete quickstart instructions
- [ ] T091 [P] Add deployment architecture diagram to docs/
- [ ] T092 Validate quickstart.md instructions on clean machine
- [ ] T093 Run security scan on Docker images with Trivy
- [ ] T094 Verify all acceptance scenarios from spec.md are met
- [ ] T095 Create deployment validation checklist in docs/validation-checklist.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (needs docker-compose.yml from US1) - Extends US1 with volumes
- **User Story 3 (P3)**: Depends on US1 (needs services running) - Adds monitoring to US1
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Independent, but enhances US1
- **User Story 5 (P5)**: Depends on US1 (optimizes Dockerfiles from US1) - Refines US1 architecture

### Within Each User Story

- Setup tasks before implementation tasks
- Configuration before testing
- Core implementation before validation
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1 (Setup)**: T002, T003, T004 can run in parallel
- **Phase 2 (Foundational)**: T006, T007 can run in parallel
- **Phase 3 (US1)**: T008, T009, T014, T015 can run in parallel
- **Phase 4 (US2)**: T021, T022, T023, T031, T032, T033 can run in parallel
- **Phase 5 (US3)**: T034, T035, T036, T037, T038, T042, T043, T044, T051, T052 can run in parallel
- **Phase 6 (US4)**: T053-T058, T067, T068 can run in parallel
- **Phase 8 (Polish)**: T086-T091 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch infrastructure file creation in parallel:
Task T008: "Create backend Dockerfile with multi-stage build in backend/Dockerfile"
Task T009: "Create frontend Dockerfile with multi-stage build in frontend/Dockerfile"
Task T014: "Create .env.example with all required environment variables"
Task T015: "Update README.md with deployment instructions"

# Then sequentially:
Task T010: "Create docker-compose.yml" (needs to reference Dockerfiles)
Task T011-T013: Configure docker-compose.yml details
Task T016-T020: Testing and validation
```

---

## Parallel Example: User Story 2

```bash
# Launch volume configuration in parallel:
Task T021: "Configure uploads_data volume"
Task T022: "Configure postgres_data volume"
Task T023: "Configure chroma_data volume"

# Launch documentation in parallel:
Task T031: "Create volume backup script"
Task T032: "Create volume restore script"
Task T033: "Document backup/restore procedures"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T007)
3. Complete Phase 3: User Story 1 (T008-T020)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready - **This is your MVP!**

**MVP Deliverable**: Complete stack deployment with `docker-compose up`

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (T008-T020) → Test independently → **Deploy/Demo (MVP!)**
3. Add User Story 2 (T021-T033) → Test independently → Deploy/Demo (MVP + Persistence)
4. Add User Story 3 (T034-T052) → Test independently → Deploy/Demo (MVP + Persistence + Monitoring)
5. Add User Story 4 (T053-T068) → Test independently → Deploy/Demo (MVP + Security)
6. Add User Story 5 (T069-T085) → Test independently → Deploy/Demo (Production-Ready)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T007)
2. Once Foundational is done:
   - Developer A: User Story 1 (T008-T020) - **Priority: Complete first for MVP**
3. After US1 complete:
   - Developer A: User Story 2 (T021-T033)
   - Developer B: User Story 4 (T053-T068) - Can work in parallel
4. After US1 complete:
   - Developer C: User Story 3 (T034-T052) - Needs US1 services running
   - Developer D: User Story 5 (T069-T085) - Optimizes US1 Dockerfiles
5. Stories complete and integrate independently

---

## Task Summary

**Total Tasks**: 95 tasks

**Tasks per User Story**:
- Setup (Phase 1): 4 tasks
- Foundational (Phase 2): 3 tasks
- User Story 1 (P1 - MVP): 13 tasks
- User Story 2 (P2): 13 tasks
- User Story 3 (P3): 19 tasks
- User Story 4 (P4): 16 tasks
- User Story 5 (P5): 17 tasks
- Polish (Phase 8): 10 tasks

**Parallel Opportunities**: 35 tasks marked [P] can run in parallel within their phase

**MVP Scope**: Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (User Story 1) = 20 tasks

**Independent Test Criteria**:
- US1: Run `docker-compose up`, verify all services start and chat works
- US2: Restart containers, verify data persists
- US3: Access /health endpoint, check logs with correlation IDs
- US4: Omit required env var, verify clear error message
- US5: Build images, verify sizes and non-root users

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [US#] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests are NOT included (not requested in specification)
- Focus on MVP first (User Story 1) for fastest time-to-value
