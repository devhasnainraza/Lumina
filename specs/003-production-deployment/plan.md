# Implementation Plan: Production Infrastructure, Observability & Deployment

**Branch**: `003-production-deployment` | **Date**: 2026-05-11 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-production-deployment/spec.md`

## Summary

Implement a fully containerized, production-ready deployment architecture for the AI Knowledge Chatbot (RAG+) using Docker and Docker Compose. The system will orchestrate frontend (Next.js), backend (FastAPI), PostgreSQL, ChromaDB, and Redis services with secure networking, persistent storage, health monitoring, and environment-based configuration. The deployment must be reproducible via a single `docker-compose up` command and support both local development and production-ready architecture.

**Primary Goals**:
- Complete stack deployment with single Docker Compose command
- Persistent data storage across container restarts (uploads, database, embeddings)
- Service health monitoring with health check endpoints
- Secure environment variable configuration
- Production-optimized container builds with minimal image sizes

## Technical Context

**Language/Version**: 
- Backend: Python 3.11+ (FastAPI 0.104+)
- Frontend: Node.js 18+ (Next.js 16+ App Router)
- Infrastructure: Docker 20.10+, Docker Compose 2.0+

**Primary Dependencies**: 
- Docker Engine and Docker Compose
- Multi-stage Dockerfile builds
- Docker volumes for persistence
- Docker networks for service communication
- Environment variable configuration

**Storage**: 
- PostgreSQL 15+ (metadata, users, chat sessions)
- ChromaDB (vector embeddings)
- Docker volumes (uploads_data, postgres_data, chroma_data)
- Local filesystem mounts for development

**Testing**: 
- Container health checks (Docker HEALTHCHECK)
- Health check endpoints (/health, /ready)
- End-to-end deployment validation
- Volume persistence testing
- Service communication testing

**Target Platform**: 
- Local development (Docker Desktop on Windows/Mac/Linux)
- Cloud deployment compatible (Railway, Render, Vercel)
- Reverse proxy ready (Nginx, Traefik, Cloudflare Tunnel)

**Project Type**: Web application (containerized full-stack)

**Performance Goals**: 
- Backend container startup < 30 seconds
- Frontend container startup < 20 seconds
- Full stack deployment < 5 minutes
- Health checks respond < 2 seconds
- Backend image < 500MB, Frontend image < 200MB
- Code rebuild with layer caching < 3 minutes

**Constraints**: 
- All services must run in containers
- No hardcoded secrets or API keys
- Environment-based configuration only
- Persistent volumes for all stateful data
- Internal Docker networking (no unnecessary port exposure)
- Automatic container restart on failure
- Production-ready security (non-root users, secure headers)

**Scale/Scope**: 
- 5 containerized services (frontend, backend, postgres, chromadb, redis)
- 3 persistent volumes (uploads, database, vector DB)
- 10+ environment variables
- Support 10+ concurrent users in containerized environment
- Complete deployment documentation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle VII: Frontend & User Experience
- ✅ **Compliant**: Deployment ensures frontend can serve streaming responses via SSE
- ✅ **Compliant**: Docker networking enables frontend-backend communication for real-time features
- ✅ **Compliant**: Volume persistence maintains chat history and user state

### Principle VIII: Deployment & Configuration (NON-NEGOTIABLE)
- ✅ **Compliant**: Docker Compose orchestrates all services with single command
- ✅ **Compliant**: All configuration externalized via environment variables
- ✅ **Compliant**: No hardcoded secrets in code or containers
- ✅ **Compliant**: Persistent volumes for uploads and database data
- ✅ **Compliant**: .env.example documents all required variables
- ✅ **Compliant**: Containers communicate via Docker network

### Principle II: Security & Multi-Tenant Isolation
- ✅ **Compliant**: Container network isolation prevents unauthorized access
- ✅ **Compliant**: Non-root users in containers for security hardening
- ✅ **Compliant**: Environment variables protect API keys and secrets
- ✅ **Compliant**: JWT validation enforced at container boundary

### Principle VI: Observability & Metadata
- ✅ **Compliant**: Health check endpoints expose service status
- ✅ **Compliant**: Structured logging with timestamps and service identifiers
- ✅ **Compliant**: Docker logs accessible via docker-compose logs
- ✅ **Compliant**: Request tracing with correlation IDs

### Principle III: Scalability
- ✅ **Compliant**: Stateless service design enables horizontal scaling
- ✅ **Compliant**: Docker Compose supports scaling with --scale flag
- ✅ **Compliant**: Persistent volumes separate from compute containers

**Gate Status**: ✅ PASSED - All constitutional requirements met

## Project Structure

### Documentation (this feature)

```text
specs/003-production-deployment/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output - Docker best practices
├── data-model.md        # Phase 1 output - Container architecture
├── quickstart.md        # Phase 1 output - Deployment guide
├── contracts/           # Phase 1 output - Docker Compose schema
│   └── docker-compose.schema.yml
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Infrastructure Files (repository root)

```text
# Docker Configuration
Dockerfile.frontend          # Next.js multi-stage build
Dockerfile.backend           # FastAPI multi-stage build
docker-compose.yml           # Service orchestration
.dockerignore               # Build context exclusions
.env.example                # Environment variable template

# Backend Structure (existing)
backend/
├── main.py                 # FastAPI app with health endpoints
├── api/
│   ├── routes/            # Existing API routes
│   └── middleware.py      # Logging, rate limiting
├── core/
│   ├── config.py          # Environment variable loading
│   ├── logging.py         # Structured logging setup
│   └── security.py        # JWT validation
├── services/              # Existing RAG services
└── requirements.txt       # Python dependencies

# Frontend Structure (to be created in this spec)
frontend/
├── app/                   # Next.js App Router
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home/chat page
│   ├── auth/             # Authentication pages
│   ├── documents/        # Document management
│   └── api/              # API route handlers
├── components/            # React components
│   ├── chat/             # Chat interface
│   ├── documents/        # Document upload/list
│   └── ui/               # ShadCN UI components
├── lib/                   # Utilities
│   ├── api.ts            # API client
│   └── auth.ts           # Auth helpers
├── public/               # Static assets
├── package.json          # Node dependencies
├── next.config.js        # Next.js configuration
└── tsconfig.json         # TypeScript configuration

# Persistent Volumes (Docker-managed)
volumes/
├── uploads_data/         # Uploaded documents
├── postgres_data/        # PostgreSQL database
└── chroma_data/          # ChromaDB vector storage

# Documentation
README.md                 # Complete deployment guide
docs/
├── deployment.md         # Detailed deployment instructions
├── troubleshooting.md    # Common issues and solutions
└── architecture.md       # System architecture diagram
```

**Structure Decision**: This feature adds containerization infrastructure to the existing backend and creates a new frontend application. The Docker Compose orchestration ties all services together with persistent volumes for stateful data. The structure follows Docker best practices with separate Dockerfiles for frontend and backend, centralized environment configuration, and clear separation between application code and infrastructure configuration.

## Complexity Tracking

> No constitutional violations - all requirements align with Principle VIII (Deployment & Configuration)

---

# Phase 0: Research & Technical Discovery

## Objectives

Resolve all technical unknowns and establish best practices for:
1. Docker multi-stage builds for Python and Node.js applications
2. Docker Compose networking and service discovery
3. Volume persistence strategies for production
4. Health check implementation patterns
5. Container security hardening
6. Environment variable management
7. Streaming response support in containerized environments
8. Production-ready logging and monitoring

## Research Tasks

### R1: Docker Multi-Stage Build Optimization

**Question**: What are the best practices for creating minimal, production-ready Docker images for FastAPI and Next.js applications?

**Research Focus**:
- Multi-stage build patterns for Python applications
- Dependency caching strategies for faster rebuilds
- Layer optimization techniques
- Base image selection (alpine vs slim vs distroless)
- Security scanning and vulnerability management

**Expected Output**: Dockerfile patterns for both frontend and backend with justification for each stage and optimization technique.

---

### R2: Docker Compose Service Orchestration

**Question**: How should services be orchestrated in Docker Compose to ensure reliable startup order, health checks, and graceful shutdown?

**Research Focus**:
- Service dependency management (depends_on with conditions)
- Health check configuration (interval, timeout, retries)
- Restart policies (on-failure, always, unless-stopped)
- Network configuration (bridge vs custom networks)
- Resource limits and reservations

**Expected Output**: Docker Compose patterns for multi-service orchestration with health-aware startup.

---

### R3: Volume Persistence and Data Management

**Question**: What are the best practices for managing persistent data in Docker volumes for uploads, databases, and vector embeddings?

**Research Focus**:
- Named volumes vs bind mounts
- Volume backup and restore strategies
- Permission management for volume-mounted directories
- Volume driver options for different storage backends
- Data migration strategies for container updates

**Expected Output**: Volume configuration patterns with backup/restore procedures.

---

### R4: Container Networking and Service Discovery

**Question**: How should containers communicate securely using Docker's internal networking and DNS resolution?

**Research Focus**:
- Docker network types (bridge, overlay, host)
- Service name resolution and DNS
- Port exposure strategies (internal vs external)
- Network isolation and security groups
- CORS configuration for frontend-backend communication

**Expected Output**: Network architecture diagram and configuration patterns.

---

### R5: Health Check Implementation

**Question**: What health check patterns should be implemented at both the application level (/health endpoints) and Docker level (HEALTHCHECK)?

**Research Focus**:
- Health check vs readiness check patterns
- Dependency health verification (database, external APIs)
- Health check endpoint design (response format, status codes)
- Docker HEALTHCHECK configuration
- Integration with orchestration tools

**Expected Output**: Health check implementation guide with code examples.

---

### R6: Environment Variable Management

**Question**: How should environment variables be managed securely across development, staging, and production environments?

**Research Focus**:
- .env file structure and validation
- Secret management best practices
- Environment variable precedence (file vs shell vs compose)
- Required vs optional variable handling
- Validation and fail-fast patterns

**Expected Output**: Environment configuration guide with .env.example template.

---

### R7: Container Security Hardening

**Question**: What security measures should be implemented to harden containers for production deployment?

**Research Focus**:
- Non-root user configuration
- Read-only root filesystems
- Security scanning tools (Trivy, Snyk)
- Minimal base images
- Network policies and firewall rules
- Secret injection methods

**Expected Output**: Security hardening checklist and implementation guide.

---

### R8: Streaming Response Support in Containers

**Question**: How should Server-Sent Events (SSE) be configured to work correctly through Docker networking and potential reverse proxies?

**Research Focus**:
- SSE configuration in FastAPI
- Proxy buffering settings (Nginx, Traefik)
- Connection timeout configuration
- CORS headers for streaming
- Client-side EventSource handling

**Expected Output**: Streaming configuration guide for containerized environments.

---

### R9: Production Logging and Monitoring

**Question**: What logging and monitoring patterns should be implemented for containerized applications?

**Research Focus**:
- Structured logging formats (JSON)
- Log aggregation strategies (docker logs, log drivers)
- Request correlation IDs
- Performance metrics collection
- Error tracking and alerting

**Expected Output**: Logging and monitoring implementation guide.

---

### R10: Cloud Deployment Compatibility

**Question**: How should the Docker Compose setup be structured to enable easy deployment to cloud platforms (Railway, Render, Vercel)?

**Research Focus**:
- Platform-specific requirements (Railway, Render)
- Environment variable mapping
- Volume persistence in cloud environments
- Database connection patterns (Neon, managed PostgreSQL)
- Frontend deployment options (Vercel, static hosting)

**Expected Output**: Cloud deployment guide with platform-specific configurations.

---

## Research Deliverable

**File**: `research.md`

**Structure**:
```markdown
# Research Findings: Production Deployment

## R1: Docker Multi-Stage Build Optimization
- **Decision**: [Chosen approach]
- **Rationale**: [Why this approach]
- **Alternatives Considered**: [Other options evaluated]
- **Implementation Notes**: [Key details]

[Repeat for R2-R10]

## Summary of Key Decisions
[Consolidated list of all major technical decisions]
```

---

# Phase 1: Design & Architecture

## Prerequisites
- ✅ Phase 0 research.md completed
- ✅ All NEEDS CLARIFICATION items resolved

## Objectives

Create detailed design artifacts for:
1. Container architecture and service relationships
2. Docker Compose configuration schema
3. Environment variable specifications
4. Health check endpoint contracts
5. Volume mount strategies
6. Deployment workflow documentation

---

## D1: Container Architecture Design

**File**: `data-model.md`

**Content**:

### Service Definitions

#### Frontend Service
- **Base Image**: node:18-alpine
- **Build Context**: ./frontend
- **Exposed Ports**: 3000 (external)
- **Environment Variables**: NEXT_PUBLIC_API_URL, NODE_ENV
- **Volumes**: None (stateless)
- **Health Check**: HTTP GET /api/health
- **Dependencies**: backend (healthy)

#### Backend Service
- **Base Image**: python:3.11-slim
- **Build Context**: ./backend
- **Exposed Ports**: 8001 (external), 8000 (internal)
- **Environment Variables**: DATABASE_URL, GEMINI_API_KEY, JWT_SECRET, VECTOR_DB_PATH, UPLOAD_DIR
- **Volumes**: uploads_data:/app/uploads
- **Health Check**: HTTP GET /health
- **Dependencies**: postgres (healthy), chromadb (started)

#### PostgreSQL Service
- **Base Image**: postgres:15-alpine
- **Exposed Ports**: 5432 (internal only)
- **Environment Variables**: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
- **Volumes**: postgres_data:/var/lib/postgresql/data
- **Health Check**: pg_isready command
- **Dependencies**: None

#### ChromaDB Service
- **Base Image**: chromadb/chroma:latest
- **Exposed Ports**: 8000 (internal only)
- **Environment Variables**: IS_PERSISTENT=TRUE
- **Volumes**: chroma_data:/chroma/chroma
- **Health Check**: HTTP GET /api/v1/heartbeat
- **Dependencies**: None

#### Redis Service (Optional)
- **Base Image**: redis:7-alpine
- **Exposed Ports**: 6379 (internal only)
- **Environment Variables**: None
- **Volumes**: redis_data:/data
- **Health Check**: redis-cli ping
- **Dependencies**: None

### Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Host                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Docker Network: rag-network               │ │
│  │                                                        │ │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐       │ │
│  │  │ Frontend │───▶│ Backend  │───▶│PostgreSQL│       │ │
│  │  │  :3000   │    │  :8001   │    │  :5432   │       │ │
│  │  └────┬─────┘    └────┬─────┘    └──────────┘       │ │
│  │       │               │                               │ │
│  │       │               ├──────────▶┌──────────┐       │ │
│  │       │               │           │ChromaDB  │       │ │
│  │       │               │           │  :8000   │       │ │
│  │       │               │           └──────────┘       │ │
│  │       │               │                               │ │
│  │       │               └──────────▶┌──────────┐       │ │
│  │       │                           │  Redis   │       │ │
│  │       │                           │  :6379   │       │ │
│  │       │                           └──────────┘       │ │
│  └───────┼────────────────────────────────────────────┘ │
│          │                                                │
│  ┌───────▼────────────────────────────────────────────┐  │
│  │              Persistent Volumes                    │  │
│  │  • uploads_data    (backend uploads)              │  │
│  │  • postgres_data   (database files)               │  │
│  │  • chroma_data     (vector embeddings)            │  │
│  │  • redis_data      (cache storage)                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  Exposed to Host:                                        │
│  • Frontend: localhost:3000                              │
│  • Backend:  localhost:8001                              │
└──────────────────────────────────────────────────────────┘
```

### Volume Specifications

#### uploads_data
- **Purpose**: Store uploaded documents (PDF, DOCX, TXT)
- **Mount Point**: /app/uploads (backend container)
- **Persistence**: Required (user data)
- **Backup Strategy**: Regular snapshots, file-level backup
- **Size Estimate**: 10GB initial, scalable

#### postgres_data
- **Purpose**: PostgreSQL database files
- **Mount Point**: /var/lib/postgresql/data
- **Persistence**: Required (critical data)
- **Backup Strategy**: pg_dump daily, WAL archiving
- **Size Estimate**: 5GB initial, scalable

#### chroma_data
- **Purpose**: ChromaDB vector embeddings
- **Mount Point**: /chroma/chroma
- **Persistence**: Required (expensive to regenerate)
- **Backup Strategy**: Directory snapshots
- **Size Estimate**: 20GB initial, scalable

---

## D2: API Contracts

**Directory**: `contracts/`

### Health Check Endpoint Contract

**File**: `contracts/health-check.yml`

```yaml
openapi: 3.0.0
info:
  title: Health Check API
  version: 1.0.0

paths:
  /health:
    get:
      summary: Service health check
      description: Returns health status of backend and all dependencies
      responses:
        '200':
          description: All services healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    enum: [healthy, degraded, unhealthy]
                  timestamp:
                    type: string
                    format: date-time
                  services:
                    type: object
                    properties:
                      database:
                        type: string
                        enum: [connected, disconnected]
                      vector_db:
                        type: string
                        enum: [connected, disconnected]
                      redis:
                        type: string
                        enum: [connected, disconnected, not_configured]
                  version:
                    type: string
        '503':
          description: Service unhealthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    enum: [unhealthy]
                  errors:
                    type: array
                    items:
                      type: string

  /ready:
    get:
      summary: Readiness check
      description: Returns whether service is ready to accept traffic
      responses:
        '200':
          description: Service ready
        '503':
          description: Service not ready
```

### Docker Compose Schema

**File**: `contracts/docker-compose.schema.yml`

```yaml
# Docker Compose Configuration Schema
# This file documents the structure and requirements for docker-compose.yml

version: '3.8'

services:
  frontend:
    required: true
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NODE_ENV=production
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - rag-network
    restart: unless-stopped

  backend:
    required: true
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "8001:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - VECTOR_DB_PATH=/app/data/chromadb
      - UPLOAD_DIR=/app/uploads
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      chromadb:
        condition: service_started
    networks:
      - rag-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    required: true
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - rag-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  chromadb:
    required: true
    image: chromadb/chroma:latest
    environment:
      - IS_PERSISTENT=TRUE
    volumes:
      - chroma_data:/chroma/chroma
    networks:
      - rag-network
    restart: unless-stopped

volumes:
  uploads_data:
    driver: local
  postgres_data:
    driver: local
  chroma_data:
    driver: local

networks:
  rag-network:
    driver: bridge
```

---

## D3: Deployment Quickstart

**File**: `quickstart.md`

```markdown
# Production Deployment Quickstart

## Prerequisites

- Docker 20.10+ installed
- Docker Compose 2.0+ installed
- 8GB RAM minimum
- 20GB disk space available
- Gemini API key (get from Google AI Studio)

## Quick Start (5 minutes)

### 1. Clone and Configure

\`\`\`bash
# Clone repository
git clone <repository-url>
cd rag-chatbot

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use your preferred editor
\`\`\`

### 2. Required Environment Variables

Edit `.env` and set:

\`\`\`bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/ragdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ragdb

# AI Provider
GEMINI_API_KEY=your_gemini_api_key_here

# Security
JWT_SECRET=your_secure_random_string_here

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8001
\`\`\`

### 3. Deploy

\`\`\`bash
# Start all services
docker-compose up -d

# Watch logs
docker-compose logs -f

# Check health
curl http://localhost:8001/health
\`\`\`

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

### 5. Verify Deployment

\`\`\`bash
# Check all containers are running
docker-compose ps

# Test health endpoint
curl http://localhost:8001/health | jq

# Test frontend
curl http://localhost:3000
\`\`\`

## Common Commands

\`\`\`bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild after code changes
docker-compose up -d --build

# View logs for specific service
docker-compose logs -f backend

# Execute command in container
docker-compose exec backend bash
\`\`\`

## Troubleshooting

### Containers won't start
\`\`\`bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check Docker daemon
docker info
\`\`\`

### Port conflicts
\`\`\`bash
# Check what's using ports
lsof -i :3000
lsof -i :8001

# Change ports in docker-compose.yml if needed
\`\`\`

### Database connection errors
\`\`\`bash
# Verify PostgreSQL is healthy
docker-compose exec postgres pg_isready

# Check DATABASE_URL format
echo $DATABASE_URL
\`\`\`

## Next Steps

- Read [deployment.md](../docs/deployment.md) for detailed documentation
- Review [architecture.md](../docs/architecture.md) for system design
- See [troubleshooting.md](../docs/troubleshooting.md) for common issues
\`\`\`

---

## D4: Agent Context Update

**Action**: Run agent context update script

\`\`\`bash
.specify/scripts/bash/update-agent-context.sh claude
\`\`\`

**Expected Changes**:
- Add Docker and Docker Compose to Active Technologies
- Add container orchestration patterns to Recent Changes
- Preserve existing backend and frontend technology entries

---

# Phase 2: Task Generation

**Note**: This phase is handled by the `/sp.tasks` command, not `/sp.plan`.

The tasks.md file will be generated based on this plan and will include:
- Dockerfile creation for frontend and backend
- docker-compose.yml implementation
- Environment variable setup
- Health check endpoint implementation
- Volume configuration
- Documentation creation
- End-to-end deployment testing

---

# Implementation Phases Summary

## Phase 0: Research ✅
- **Output**: research.md with all technical decisions documented
- **Duration**: Completed during planning
- **Blockers**: None

## Phase 1: Design ✅
- **Output**: data-model.md, contracts/, quickstart.md, updated agent context
- **Duration**: Completed during planning
- **Blockers**: None

## Phase 2: Task Generation ⏳
- **Output**: tasks.md (via `/sp.tasks` command)
- **Duration**: Next step
- **Blockers**: Awaiting task generation command

## Phase 3: Implementation ⏳
- **Output**: Working Docker deployment (via `/sp.implement` command)
- **Duration**: After task generation
- **Blockers**: Awaiting implementation command

---

# Success Criteria

The implementation is complete when:

1. ✅ All services start successfully with `docker-compose up`
2. ✅ Health checks pass for all services
3. ✅ Frontend accessible at localhost:3000
4. ✅ Backend API accessible at localhost:8001
5. ✅ Document upload and chat workflow functions end-to-end
6. ✅ Data persists across container restarts
7. ✅ Logs are accessible via `docker-compose logs`
8. ✅ README enables deployment from scratch
9. ✅ All environment variables documented in .env.example
10. ✅ Container images meet size targets (backend < 500MB, frontend < 200MB)

---

# Next Steps

1. Run `/sp.tasks` to generate actionable task list
2. Review and approve task breakdown
3. Run `/sp.implement` to execute implementation
4. Validate deployment with end-to-end tests
5. Create pull request with deployment infrastructure
