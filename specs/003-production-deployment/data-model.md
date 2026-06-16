# Container Architecture & Data Model

**Feature**: Production Infrastructure, Observability & Deployment  
**Date**: 2026-05-11  
**Status**: Complete

## Overview

This document defines the containerized architecture for the RAG chatbot system, including service definitions, data flow, network topology, and volume management.

---

## Service Architecture

### Service Inventory

| Service | Purpose | Base Image | Ports | Stateful |
|---------|---------|------------|-------|----------|
| frontend | Next.js UI | node:18-alpine | 3000 | No |
| backend | FastAPI API | python:3.11-slim | 8001 | No |
| postgres | Metadata DB | postgres:15-alpine | 5432 (internal) | Yes |
| chromadb | Vector DB | chromadb/chroma:latest | 8000 (internal) | Yes |
| redis | Cache (optional) | redis:7-alpine | 6379 (internal) | Yes |

---

## Service Definitions

### Frontend Service

**Purpose**: Serve Next.js application with chat interface, document management, and authentication UI

**Container Specification**:
```yaml
Service Name: frontend
Base Image: node:18-alpine
Build Context: ./frontend
Dockerfile: Dockerfile (in frontend directory)
Exposed Ports: 
  - 3000:3000 (HTTP)
Internal Ports: None
```

**Environment Variables**:
- `NEXT_PUBLIC_API_URL`: Backend API URL (http://localhost:8001 for local)
- `NODE_ENV`: Environment mode (production)

**Volumes**: None (stateless service)

**Dependencies**:
- backend (must be healthy before frontend starts)

**Health Check**:
```yaml
Type: HTTP GET
Endpoint: /api/health
Interval: 30s
Timeout: 10s
Retries: 3
Start Period: 20s
```

**Resource Limits**:
- Memory: 512MB
- CPU: 0.5 cores

**Security**:
- Runs as node user (non-root)
- Read-only root filesystem (except /tmp, /.next)

---

### Backend Service

**Purpose**: FastAPI application serving RAG pipeline, document ingestion, chat endpoints, and authentication

**Container Specification**:
```yaml
Service Name: backend
Base Image: python:3.11-slim
Build Context: . (repository root)
Dockerfile: backend/Dockerfile
Exposed Ports:
  - 8001:8000 (HTTP API)
Internal Ports:
  - 8000 (used by other containers)
```

**Environment Variables**:
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Google Gemini API key
- `JWT_SECRET`: Secret for JWT token signing
- `VECTOR_DB_PATH`: Path to ChromaDB storage (/app/data/chromadb)
- `UPLOAD_DIR`: Directory for uploaded files (/app/uploads)
- `MODEL_NAME`: Gemini model name (gemini-1.5-pro)
- `TEMPERATURE`: LLM temperature (0.1)
- `TOP_K`: Number of chunks to retrieve (5)
- `MAX_CONTEXT_TOKENS`: Maximum context size (6000)
- `MAX_RESPONSE_TOKENS`: Maximum response size (1000)
- `MIN_RELEVANCE_SCORE`: Minimum relevance threshold (0.7)

**Volumes**:
- `uploads_data:/app/uploads` (persistent uploaded documents)

**Dependencies**:
- postgres (must be healthy)
- chromadb (must be started)

**Health Check**:
```yaml
Type: HTTP GET
Endpoint: /health
Interval: 30s
Timeout: 10s
Retries: 3
Start Period: 40s
```

**Resource Limits**:
- Memory: 2GB
- CPU: 1.0 cores

**Security**:
- Runs as appuser (UID 1000, non-root)
- Read-only root filesystem (except /app/uploads, /tmp)

---

### PostgreSQL Service

**Purpose**: Store user accounts, document metadata, chat sessions, and chat messages

**Container Specification**:
```yaml
Service Name: postgres
Base Image: postgres:15-alpine
Exposed Ports: None (internal only)
Internal Ports:
  - 5432 (PostgreSQL)
```

**Environment Variables**:
- `POSTGRES_USER`: Database username
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DB`: Database name

**Volumes**:
- `postgres_data:/var/lib/postgresql/data` (persistent database files)

**Dependencies**: None

**Health Check**:
```yaml
Type: Command
Command: pg_isready -U ${POSTGRES_USER}
Interval: 10s
Timeout: 5s
Retries: 5
Start Period: 10s
```

**Resource Limits**:
- Memory: 1GB
- CPU: 0.5 cores

**Security**:
- Runs as postgres user (non-root)
- Internal network only (no host exposure)

---

### ChromaDB Service

**Purpose**: Store and query vector embeddings for document chunks

**Container Specification**:
```yaml
Service Name: chromadb
Base Image: chromadb/chroma:latest
Exposed Ports: None (internal only)
Internal Ports:
  - 8000 (HTTP API)
```

**Environment Variables**:
- `IS_PERSISTENT`: Enable persistence (TRUE)

**Volumes**:
- `chroma_data:/chroma/chroma` (persistent vector embeddings)

**Dependencies**: None

**Health Check**:
```yaml
Type: HTTP GET
Endpoint: /api/v1/heartbeat
Interval: 30s
Timeout: 10s
Retries: 3
Start Period: 20s
```

**Resource Limits**:
- Memory: 1GB
- CPU: 0.5 cores

**Security**:
- Internal network only (no host exposure)

---

### Redis Service (Optional)

**Purpose**: Cache frequently accessed data and session storage

**Container Specification**:
```yaml
Service Name: redis
Base Image: redis:7-alpine
Exposed Ports: None (internal only)
Internal Ports:
  - 6379 (Redis)
```

**Environment Variables**: None

**Volumes**:
- `redis_data:/data` (persistent cache storage)

**Dependencies**: None

**Health Check**:
```yaml
Type: Command
Command: redis-cli ping
Interval: 10s
Timeout: 5s
Retries: 3
Start Period: 5s
```

**Resource Limits**:
- Memory: 256MB
- CPU: 0.25 cores

**Security**:
- Internal network only (no host exposure)

---

## Network Architecture

### Network Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                         Docker Host                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Docker Network: rag-network (bridge)             │ │
│  │                                                            │ │
│  │  ┌──────────────┐                                         │ │
│  │  │   Frontend   │                                         │ │
│  │  │   :3000      │                                         │ │
│  │  │ (Next.js)    │                                         │ │
│  │  └──────┬───────┘                                         │ │
│  │         │                                                  │ │
│  │         │ HTTP Requests                                   │ │
│  │         ▼                                                  │ │
│  │  ┌──────────────┐                                         │ │
│  │  │   Backend    │                                         │ │
│  │  │   :8001      │                                         │ │
│  │  │  (FastAPI)   │                                         │ │
│  │  └──────┬───────┘                                         │ │
│  │         │                                                  │ │
│  │         ├─────────────┬─────────────┬──────────────┐     │ │
│  │         │             │             │              │     │ │
│  │         ▼             ▼             ▼              ▼     │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │ │
│  │  │PostgreSQL│  │ChromaDB  │  │  Redis   │  │ Gemini  │ │ │
│  │  │  :5432   │  │  :8000   │  │  :6379   │  │   API   │ │ │
│  │  │(internal)│  │(internal)│  │(internal)│  │(external)│ │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                  Persistent Volumes                       │ │
│  │  • uploads_data    (backend → /app/uploads)             │ │
│  │  • postgres_data   (postgres → /var/lib/postgresql/data)│ │
│  │  • chroma_data     (chromadb → /chroma/chroma)          │ │
│  │  • redis_data      (redis → /data)                      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Exposed to Host:                                             │
│  • Frontend: http://localhost:3000                            │
│  • Backend:  http://localhost:8001                            │
└────────────────────────────────────────────────────────────────┘
```

### Network Configuration

**Network Name**: `rag-network`  
**Network Type**: Bridge (default Docker network type)  
**DNS Resolution**: Automatic (service name → IP address)

**Service Communication**:
- Frontend → Backend: `http://backend:8000`
- Backend → PostgreSQL: `postgresql://postgres:5432`
- Backend → ChromaDB: `http://chromadb:8000`
- Backend → Redis: `redis://redis:6379`
- Backend → Gemini API: `https://generativelanguage.googleapis.com` (external)

**Port Exposure**:
- **External (host)**: Frontend (3000), Backend (8001)
- **Internal only**: PostgreSQL (5432), ChromaDB (8000), Redis (6379)

**Security**:
- Internal services not accessible from host
- Frontend and backend use CORS for cross-origin requests
- All inter-service communication over internal network

---

## Data Flow

### Document Upload Flow

```
User → Frontend (upload form)
  ↓
Frontend → Backend POST /documents/upload
  ↓
Backend validates file (type, size)
  ↓
Backend saves to uploads_data volume
  ↓
Backend extracts text
  ↓
Backend chunks text
  ↓
Backend generates embeddings (Gemini API)
  ↓
Backend stores chunks in ChromaDB
  ↓
Backend stores metadata in PostgreSQL
  ↓
Backend returns document ID to Frontend
  ↓
Frontend displays success message
```

### Chat Query Flow

```
User → Frontend (chat input)
  ↓
Frontend → Backend POST /chat/stream
  ↓
Backend validates JWT token
  ↓
Backend generates query embedding (Gemini API)
  ↓
Backend retrieves Top-K chunks from ChromaDB
  ↓
Backend constructs context prompt
  ↓
Backend streams LLM response (Gemini API)
  ↓
Backend stores message in PostgreSQL
  ↓
Backend streams tokens to Frontend (SSE)
  ↓
Frontend renders markdown in real-time
```

### Health Check Flow

```
Docker → Backend HEALTHCHECK
  ↓
Backend /health endpoint
  ↓
Backend checks PostgreSQL connection
  ↓
Backend checks ChromaDB connection
  ↓
Backend returns status (healthy/unhealthy)
  ↓
Docker marks container as healthy/unhealthy
  ↓
Docker restarts if unhealthy (based on restart policy)
```

---

## Volume Management

### Volume Specifications

#### uploads_data

**Purpose**: Store uploaded documents (PDF, DOCX, TXT)  
**Mount Point**: `/app/uploads` (backend container)  
**Driver**: local  
**Persistence**: Required (user data)  
**Backup Frequency**: Daily  
**Retention**: 30 days  
**Size Estimate**: 10GB initial, 1GB/month growth

**Backup Command**:
```bash
docker run --rm \
  -v uploads_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/uploads-$(date +%Y%m%d).tar.gz -C /data .
```

**Restore Command**:
```bash
docker run --rm \
  -v uploads_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/uploads-20260511.tar.gz -C /data
```

---

#### postgres_data

**Purpose**: PostgreSQL database files  
**Mount Point**: `/var/lib/postgresql/data` (postgres container)  
**Driver**: local  
**Persistence**: Required (critical data)  
**Backup Frequency**: Daily + WAL archiving  
**Retention**: 30 days  
**Size Estimate**: 5GB initial, 500MB/month growth

**Backup Command**:
```bash
docker-compose exec postgres pg_dump -U postgres ragdb > backups/ragdb-$(date +%Y%m%d).sql
```

**Restore Command**:
```bash
docker-compose exec -T postgres psql -U postgres ragdb < backups/ragdb-20260511.sql
```

---

#### chroma_data

**Purpose**: ChromaDB vector embeddings  
**Mount Point**: `/chroma/chroma` (chromadb container)  
**Driver**: local  
**Persistence**: Required (expensive to regenerate)  
**Backup Frequency**: Weekly  
**Retention**: 14 days  
**Size Estimate**: 20GB initial, 2GB/month growth

**Backup Command**:
```bash
docker run --rm \
  -v chroma_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/chroma-$(date +%Y%m%d).tar.gz -C /data .
```

**Restore Command**:
```bash
docker run --rm \
  -v chroma_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/chroma-20260511.tar.gz -C /data
```

---

#### redis_data (Optional)

**Purpose**: Redis cache storage  
**Mount Point**: `/data` (redis container)  
**Driver**: local  
**Persistence**: Optional (cache can be rebuilt)  
**Backup Frequency**: Not required  
**Retention**: N/A  
**Size Estimate**: 1GB maximum

---

## Startup Sequence

### Service Dependency Order

```
1. PostgreSQL (no dependencies)
   ↓ (wait for healthy)
2. ChromaDB (no dependencies)
   ↓ (wait for started)
3. Redis (no dependencies, optional)
   ↓ (wait for started)
4. Backend (depends on postgres healthy, chromadb started)
   ↓ (wait for healthy)
5. Frontend (depends on backend healthy)
```

### Startup Timeline

| Time | Event |
|------|-------|
| 0s | docker-compose up initiated |
| 5s | PostgreSQL container started |
| 10s | PostgreSQL healthy (pg_isready passes) |
| 10s | ChromaDB container started |
| 15s | ChromaDB ready (heartbeat responds) |
| 15s | Backend container started |
| 20s | Backend initializes (loads models, connects to DB) |
| 40s | Backend healthy (health check passes) |
| 40s | Frontend container started |
| 50s | Frontend ready (Next.js server listening) |
| 60s | All services healthy and operational |

**Total Startup Time**: ~60 seconds (under 5-minute target)

---

## Failure Scenarios & Recovery

### Scenario 1: PostgreSQL Crash

**Detection**: Health check fails (pg_isready returns error)  
**Impact**: Backend becomes unhealthy, frontend cannot process requests  
**Recovery**: Docker restarts postgres container automatically  
**Data Loss**: None (data persisted in postgres_data volume)  
**Recovery Time**: ~10 seconds

---

### Scenario 2: Backend Crash

**Detection**: Health check fails (HTTP GET /health returns 503 or times out)  
**Impact**: Frontend displays error, users cannot upload or chat  
**Recovery**: Docker restarts backend container automatically  
**Data Loss**: In-flight requests lost, persisted data intact  
**Recovery Time**: ~40 seconds

---

### Scenario 3: ChromaDB Crash

**Detection**: Backend health check reports vector_db disconnected  
**Impact**: Chat queries fail (cannot retrieve chunks)  
**Recovery**: Docker restarts chromadb container automatically  
**Data Loss**: None (embeddings persisted in chroma_data volume)  
**Recovery Time**: ~15 seconds

---

### Scenario 4: Volume Corruption

**Detection**: Container fails to start, logs show I/O errors  
**Impact**: Service cannot access persistent data  
**Recovery**: Restore from backup, recreate volume  
**Data Loss**: Data since last backup  
**Recovery Time**: ~30 minutes (depends on backup size)

---

### Scenario 5: Network Partition

**Detection**: Backend cannot connect to postgres/chromadb  
**Impact**: Backend health check fails, requests fail  
**Recovery**: Docker network self-heals, containers reconnect  
**Data Loss**: None  
**Recovery Time**: ~5 seconds

---

## Scaling Considerations

### Horizontal Scaling

**Frontend**: Stateless, can scale to multiple replicas
```bash
docker-compose up -d --scale frontend=3
```

**Backend**: Stateless (except file uploads), can scale with shared volume
```bash
docker-compose up -d --scale backend=3
```

**PostgreSQL**: Single instance (use managed DB for HA)  
**ChromaDB**: Single instance (use Pinecone for distributed)  
**Redis**: Single instance (use Redis Cluster for HA)

### Vertical Scaling

Adjust resource limits in docker-compose.yml:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

---

## Monitoring & Observability

### Health Check Endpoints

| Service | Endpoint | Response |
|---------|----------|----------|
| Backend | GET /health | JSON with service status |
| Backend | GET /ready | 200 if ready, 503 if not |
| Frontend | GET /api/health | 200 if ready |

### Metrics Collection

**Container Metrics** (via Docker stats):
- CPU usage percentage
- Memory usage (current/limit)
- Network I/O (bytes sent/received)
- Block I/O (disk read/write)

**Application Metrics** (via /metrics endpoint):
- Request count by endpoint
- Request latency (p50, p95, p99)
- Error rate by status code
- Active connections
- Queue depth

### Log Aggregation

**Log Format**: JSON structured logs  
**Log Driver**: json-file (default)  
**Log Rotation**: 10MB max size, 3 files retained  
**Log Inspection**: `docker-compose logs -f <service>`

---

## Security Model

### Network Security

- Internal services not exposed to host
- Frontend and backend use CORS for cross-origin requests
- No direct database access from outside Docker network
- TLS termination at reverse proxy (if used)

### Container Security

- All containers run as non-root users
- Read-only root filesystems where possible
- Minimal base images (alpine, slim)
- Security scanning with Trivy

### Secret Management

- API keys via environment variables only
- .env file excluded from version control
- JWT secrets rotated regularly
- Database passwords strong and unique

---

## Summary

This container architecture provides:
- ✅ Complete service isolation with Docker containers
- ✅ Persistent data storage with named volumes
- ✅ Automatic service discovery via Docker DNS
- ✅ Health-aware startup sequencing
- ✅ Automatic failure recovery with restart policies
- ✅ Scalability through stateless service design
- ✅ Security through network isolation and non-root users
- ✅ Observability through health checks and structured logging

**Next Steps**: Implement Dockerfiles, docker-compose.yml, and deployment documentation.
