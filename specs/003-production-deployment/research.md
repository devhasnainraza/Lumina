# Research Findings: Production Deployment

**Feature**: Production Infrastructure, Observability & Deployment  
**Date**: 2026-05-11  
**Status**: Complete

## R1: Docker Multi-Stage Build Optimization

**Decision**: Use multi-stage builds with Python 3.11-slim for backend and Node 18-alpine for frontend

**Rationale**: 
- Multi-stage builds separate build dependencies from runtime, reducing final image size by 60-70%
- Python slim images provide necessary system libraries while staying under 500MB
- Alpine images for Node.js minimize frontend image to ~150MB
- Layer caching optimizes rebuild times to under 3 minutes for code changes

**Alternatives Considered**:
- **Alpine for Python**: Rejected due to compilation issues with scientific libraries (numpy, pandas)
- **Distroless images**: Rejected due to debugging complexity and lack of shell access
- **Full Python image**: Rejected due to 1GB+ size

**Implementation Notes**:
- Stage 1 (builder): Install build dependencies, compile packages
- Stage 2 (runtime): Copy only compiled packages and application code
- Use .dockerignore to exclude unnecessary files from build context
- Pin dependency versions in requirements.txt for reproducibility

---

## R2: Docker Compose Service Orchestration

**Decision**: Use depends_on with health check conditions and restart policies

**Rationale**:
- Health check conditions ensure services start in correct order (database before backend)
- Restart policy "unless-stopped" provides automatic recovery without infinite restart loops
- Start period allows services time to initialize before health checks begin
- Service dependencies prevent cascading failures

**Alternatives Considered**:
- **Simple depends_on**: Rejected because it doesn't wait for service readiness
- **External orchestration (Kubernetes)**: Out of scope for MVP, Docker Compose sufficient
- **Manual startup scripts**: Rejected in favor of declarative configuration

**Implementation Notes**:
```yaml
depends_on:
  postgres:
    condition: service_healthy
  chromadb:
    condition: service_started
```
- Use `service_healthy` for critical dependencies (database)
- Use `service_started` for services without health checks
- Set appropriate start_period (40s for backend to allow initialization)

---

## R3: Volume Persistence and Data Management

**Decision**: Use named Docker volumes with local driver for all persistent data

**Rationale**:
- Named volumes are managed by Docker and survive container removal
- Local driver provides best performance for single-host deployments
- Volumes are portable across container recreations
- Clear separation between stateful data and stateless containers

**Alternatives Considered**:
- **Bind mounts**: Rejected due to permission issues and platform-specific paths
- **Volume drivers (NFS, cloud)**: Out of scope for local deployment, can be added later
- **Container-internal storage**: Rejected because data is lost on container removal

**Implementation Notes**:
- Three named volumes: uploads_data, postgres_data, chroma_data
- Backup strategy: Use `docker run --rm -v` to create tar archives
- Restore strategy: Extract tar archives to volume mount points
- Volume inspection: `docker volume inspect <volume_name>`

**Backup Commands**:
```bash
# Backup uploads
docker run --rm -v uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads.tar.gz -C /data .

# Restore uploads
docker run --rm -v uploads_data:/data -v $(pwd):/backup alpine tar xzf /backup/uploads.tar.gz -C /data
```

---

## R4: Container Networking and Service Discovery

**Decision**: Use custom bridge network with automatic DNS resolution

**Rationale**:
- Custom bridge networks provide automatic DNS resolution by service name
- Services can communicate using service names (e.g., `http://backend:8000`)
- Network isolation prevents external access to internal services
- Only frontend and backend expose ports to host

**Alternatives Considered**:
- **Default bridge network**: Rejected because it doesn't provide DNS resolution
- **Host network**: Rejected due to security concerns and port conflicts
- **Overlay network**: Out of scope for single-host deployment

**Implementation Notes**:
- Network name: `rag-network`
- All services join the same network
- Frontend connects to backend via `http://backend:8000`
- Backend connects to PostgreSQL via `postgresql://postgres:5432`
- Backend connects to ChromaDB via `http://chromadb:8000`
- CORS configuration allows frontend origin

---

## R5: Health Check Implementation

**Decision**: Implement both application-level health endpoints and Docker HEALTHCHECK directives

**Rationale**:
- Application health endpoints provide detailed status of dependencies
- Docker HEALTHCHECK enables automatic container restart and orchestration
- Separate /health (liveness) and /ready (readiness) endpoints
- Health checks verify database, vector DB, and external API connectivity

**Alternatives Considered**:
- **Docker HEALTHCHECK only**: Rejected because it lacks detailed status information
- **Application health only**: Rejected because Docker can't use it for orchestration
- **External monitoring only**: Rejected because it doesn't enable automatic recovery

**Implementation Notes**:

**Backend /health endpoint**:
```python
@app.get("/health")
async def health_check():
    status = "healthy"
    services = {}
    
    # Check database
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        services["database"] = "connected"
    except Exception:
        services["database"] = "disconnected"
        status = "unhealthy"
    
    # Check vector DB
    try:
        collection = get_collection()
        services["vector_db"] = "connected"
    except Exception:
        services["vector_db"] = "disconnected"
        status = "unhealthy"
    
    return {
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "services": services
    }
```

**Docker HEALTHCHECK**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
```

---

## R6: Environment Variable Management

**Decision**: Use .env file with docker-compose and validate required variables at startup

**Rationale**:
- .env file provides single source of configuration
- Environment variables keep secrets out of code and images
- Validation at startup prevents runtime failures due to missing config
- .env.example documents all required variables

**Alternatives Considered**:
- **Hardcoded configuration**: Rejected due to security and inflexibility
- **Config files**: Rejected in favor of 12-factor app principles
- **Secret management tools (Vault)**: Out of scope for MVP

**Implementation Notes**:

**.env.example structure**:
```bash
# Database Configuration
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/ragdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_this_password
POSTGRES_DB=ragdb

# AI Provider
GEMINI_API_KEY=your_gemini_api_key_here

# Security
JWT_SECRET=change_this_to_random_string_min_32_chars

# Application
UPLOAD_DIR=/app/uploads
VECTOR_DB_PATH=/app/data/chromadb
MODEL_NAME=gemini-1.5-pro
TEMPERATURE=0.1

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8001
NODE_ENV=production
```

**Validation in backend/core/config.py**:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    gemini_api_key: str
    jwt_secret: str
    
    class Config:
        env_file = ".env"
        
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate required fields
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is required")
```

---

## R7: Container Security Hardening

**Decision**: Run containers as non-root users, use minimal base images, and implement security scanning

**Rationale**:
- Non-root users limit damage from container breakout vulnerabilities
- Minimal images reduce attack surface
- Security scanning catches known vulnerabilities before deployment
- Read-only root filesystem prevents runtime modifications

**Alternatives Considered**:
- **Root users**: Rejected due to security risks
- **Full-featured images**: Rejected due to larger attack surface
- **No security scanning**: Rejected because it misses known vulnerabilities

**Implementation Notes**:

**Non-root user in Dockerfile**:
```dockerfile
# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser
```

**Security scanning**:
```bash
# Scan images with Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy image rag-backend:latest

# Scan during CI/CD
trivy image --severity HIGH,CRITICAL rag-backend:latest
```

**Additional hardening**:
- Drop unnecessary capabilities
- Use security_opt to enable AppArmor/SELinux
- Limit container resources (memory, CPU)
- Scan dependencies for vulnerabilities

---

## R8: Streaming Response Support in Containers

**Decision**: Configure FastAPI with StreamingResponse and ensure proxy buffering is disabled

**Rationale**:
- Server-Sent Events (SSE) require unbuffered streaming
- FastAPI StreamingResponse supports async generators
- Reverse proxies must disable buffering for SSE to work
- CORS headers must allow streaming connections

**Alternatives Considered**:
- **WebSockets**: Rejected because SSE is simpler for one-way streaming
- **Long polling**: Rejected due to poor user experience
- **Buffered responses**: Rejected because it defeats streaming purpose

**Implementation Notes**:

**FastAPI streaming endpoint**:
```python
from fastapi.responses import StreamingResponse

@app.post("/chat/stream")
async def stream_chat(request: ChatRequest):
    async def generate():
        async for token in llm_service.stream_response(request.query):
            yield f"data: {json.dumps({'token': token})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable Nginx buffering
        }
    )
```

**Nginx proxy configuration** (if used):
```nginx
location /chat/stream {
    proxy_pass http://backend:8000;
    proxy_buffering off;
    proxy_cache off;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding off;
}
```

**Frontend EventSource**:
```typescript
const eventSource = new EventSource(`${API_URL}/chat/stream`);
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    appendToken(data.token);
};
```

---

## R9: Production Logging and Monitoring

**Decision**: Implement structured JSON logging with correlation IDs and use Docker's logging drivers

**Rationale**:
- JSON logs are machine-parseable for log aggregation tools
- Correlation IDs enable request tracing across services
- Docker logging drivers provide flexible log routing
- Structured logs include context (service, level, timestamp)

**Alternatives Considered**:
- **Plain text logs**: Rejected because they're hard to parse
- **External logging agents**: Out of scope for MVP, can be added later
- **No correlation IDs**: Rejected because it makes debugging difficult

**Implementation Notes**:

**Structured logging in backend**:
```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "service": "backend",
            "message": record.getMessage(),
            "correlation_id": getattr(record, "correlation_id", None)
        }
        return json.dumps(log_data)

# Configure logger
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)
```

**Correlation ID middleware**:
```python
import uuid
from starlette.middleware.base import BaseHTTPMiddleware

class CorrelationIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        request.state.correlation_id = correlation_id
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response
```

**Docker logging configuration**:
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**Log inspection**:
```bash
# View logs with timestamps
docker-compose logs -f --timestamps backend

# Filter logs by service
docker-compose logs backend | grep ERROR

# Export logs
docker-compose logs --no-color > logs.txt
```

---

## R10: Cloud Deployment Compatibility

**Decision**: Structure Docker Compose for local development with cloud platform compatibility via environment overrides

**Rationale**:
- Docker Compose works for local development
- Cloud platforms (Railway, Render) support Dockerfile deployments
- Environment variables enable platform-specific configuration
- Managed databases (Neon) replace containerized PostgreSQL in production

**Alternatives Considered**:
- **Kubernetes**: Out of scope for MVP, overly complex
- **Platform-specific configs**: Rejected in favor of unified approach
- **Monolithic deployment**: Rejected because it doesn't scale

**Implementation Notes**:

**Railway deployment**:
- Deploy backend and frontend as separate services
- Use Railway's PostgreSQL addon instead of container
- Set environment variables in Railway dashboard
- Use Railway's internal networking for service communication

**Render deployment**:
- Create separate web services for frontend and backend
- Use Render's managed PostgreSQL
- Configure environment variables in Render dashboard
- Use Render's internal URLs for service communication

**Vercel deployment** (frontend only):
- Deploy Next.js frontend to Vercel
- Point NEXT_PUBLIC_API_URL to Railway/Render backend
- Use Vercel environment variables
- Enable CORS on backend for Vercel domain

**Database migration**:
```bash
# Local: PostgreSQL container
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/ragdb

# Production: Neon managed database
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.neon.tech/dbname
```

**Platform-specific docker-compose overrides**:
```yaml
# docker-compose.prod.yml
services:
  backend:
    environment:
      - DATABASE_URL=${NEON_DATABASE_URL}
  
  # Remove postgres service in production
  postgres:
    profiles:
      - local-only
```

---

## Summary of Key Decisions

### Infrastructure
1. **Container Strategy**: Multi-stage Docker builds with Python 3.11-slim and Node 18-alpine
2. **Orchestration**: Docker Compose with health-aware service dependencies
3. **Networking**: Custom bridge network with automatic DNS resolution
4. **Storage**: Named Docker volumes for persistent data (uploads, database, embeddings)

### Configuration
5. **Environment Management**: .env file with validation at startup
6. **Security**: Non-root users, minimal images, security scanning
7. **Secrets**: Environment variables only, never hardcoded

### Observability
8. **Health Checks**: Application endpoints + Docker HEALTHCHECK directives
9. **Logging**: Structured JSON logs with correlation IDs
10. **Monitoring**: Docker logs with configurable drivers

### Performance
11. **Streaming**: FastAPI StreamingResponse with unbuffered proxies
12. **Build Optimization**: Layer caching for sub-3-minute rebuilds
13. **Image Sizes**: Backend < 500MB, Frontend < 200MB

### Deployment
14. **Local**: Docker Compose with containerized databases
15. **Cloud**: Platform-specific overrides with managed databases
16. **Portability**: Unified configuration via environment variables

---

## Implementation Priorities

### Phase 1: Core Infrastructure (P0)
- Dockerfiles for frontend and backend
- docker-compose.yml with all services
- .env.example with documentation
- Basic health check endpoints

### Phase 2: Persistence & Networking (P1)
- Named volumes configuration
- Custom network setup
- Service dependency management
- Volume backup/restore procedures

### Phase 3: Observability (P2)
- Structured logging implementation
- Correlation ID middleware
- Health check enhancements
- Log aggregation setup

### Phase 4: Production Readiness (P3)
- Security hardening (non-root users)
- Image optimization (multi-stage builds)
- Cloud deployment guides
- Monitoring and alerting setup

---

## Open Questions & Future Work

### Resolved
- ✅ Container orchestration approach (Docker Compose)
- ✅ Volume persistence strategy (named volumes)
- ✅ Health check implementation (dual approach)
- ✅ Streaming support (SSE with FastAPI)

### Future Enhancements
- [ ] Kubernetes deployment for multi-node scaling
- [ ] Advanced monitoring (Prometheus, Grafana)
- [ ] Distributed tracing (Jaeger, OpenTelemetry)
- [ ] Automated backup scheduling
- [ ] Blue-green deployment strategy
- [ ] Container security scanning in CI/CD
- [ ] Log aggregation platform (ELK, Loki)

---

**Research Complete**: All technical decisions documented and ready for implementation.
