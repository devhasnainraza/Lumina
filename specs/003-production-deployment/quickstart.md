# Production Deployment Quickstart

**Feature**: AI Knowledge Chatbot (RAG+)  
**Last Updated**: 2026-05-11  
**Estimated Time**: 10 minutes

## Prerequisites

Before you begin, ensure you have:

- ✅ **Docker** 20.10+ installed ([Get Docker](https://docs.docker.com/get-docker/))
- ✅ **Docker Compose** 2.0+ installed (included with Docker Desktop)
- ✅ **8GB RAM** minimum available
- ✅ **20GB disk space** available
- ✅ **Gemini API key** from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Verify Installation

```bash
# Check Docker version
docker --version
# Expected: Docker version 20.10.0 or higher

# Check Docker Compose version
docker-compose --version
# Expected: Docker Compose version 2.0.0 or higher

# Verify Docker is running
docker ps
# Should return empty list or running containers (no errors)
```

---

## Quick Start (5 Steps)

### Step 1: Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd rag-chatbot

# Verify you're in the correct directory
ls -la
# Should see: backend/, frontend/, docker-compose.yml, .env.example
```

---

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor (vim, code, etc.)
```

**Required Configuration** (edit these in `.env`):

```bash
# Database Configuration
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/ragdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD  # ⚠️ Change this!
POSTGRES_DB=ragdb

# AI Provider (⚠️ REQUIRED - Get from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# Security (⚠️ REQUIRED - Generate random string)
JWT_SECRET=your_secure_random_string_min_32_chars

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8001

# Application (Optional - defaults provided)
MODEL_NAME=gemini-1.5-pro
TEMPERATURE=0.1
TOP_K=5
MAX_CONTEXT_TOKENS=6000
MAX_RESPONSE_TOKENS=1000
MIN_RELEVANCE_SCORE=0.7
```

**Generate Secure JWT Secret**:
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

### Step 3: Deploy All Services

```bash
# Start all services in detached mode
docker-compose up -d

# Expected output:
# Creating network "rag_network" ... done
# Creating volume "rag_postgres_data" ... done
# Creating volume "rag_chroma_data" ... done
# Creating volume "rag_uploads_data" ... done
# Creating rag-postgres ... done
# Creating rag-chromadb ... done
# Creating rag-backend ... done
# Creating rag-frontend ... done
```

**Watch Startup Progress**:
```bash
# Follow logs from all services
docker-compose logs -f

# Press Ctrl+C to stop following (services keep running)
```

**Wait for Services** (~60 seconds):
- PostgreSQL: ~10 seconds
- ChromaDB: ~15 seconds
- Backend: ~40 seconds
- Frontend: ~50 seconds

---

### Step 4: Verify Deployment

```bash
# Check all containers are running
docker-compose ps

# Expected output:
# NAME            STATUS          PORTS
# rag-backend     Up (healthy)    0.0.0.0:8001->8000/tcp
# rag-chromadb    Up (healthy)    8000/tcp
# rag-frontend    Up (healthy)    0.0.0.0:3000->3000/tcp
# rag-postgres    Up (healthy)    5432/tcp
```

**Test Health Endpoints**:
```bash
# Backend health check
curl http://localhost:8001/health | jq

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2026-05-11T12:00:00Z",
#   "services": {
#     "database": "connected",
#     "vector_db": "connected"
#   }
# }

# Frontend health check
curl http://localhost:3000/api/health

# Expected: 200 OK
```

---

### Step 5: Access Application

Open your browser and navigate to:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs

**First Steps**:
1. Create an account (sign up)
2. Upload a test document (PDF, DOCX, or TXT)
3. Wait for processing (~5-10 seconds)
4. Ask a question about the document
5. See streaming AI response with source citations

---

## Common Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services (keeps data)
docker-compose down

# Stop and remove all data (⚠️ WARNING: deletes volumes)
docker-compose down -v

# Restart a specific service
docker-compose restart backend

# View status of all services
docker-compose ps
```

### Logs and Debugging

```bash
# View logs from all services
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs from specific service
docker-compose logs backend
docker-compose logs frontend

# View last 100 lines
docker-compose logs --tail=100 backend

# View logs with timestamps
docker-compose logs -f --timestamps
```

### Code Updates and Rebuilds

```bash
# Rebuild after code changes
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend

# Force rebuild (no cache)
docker-compose build --no-cache
docker-compose up -d
```

### Container Access

```bash
# Execute command in running container
docker-compose exec backend bash
docker-compose exec postgres psql -U postgres ragdb

# Run one-off command
docker-compose run --rm backend python -c "print('Hello')"
```

### Volume Management

```bash
# List volumes
docker volume ls | grep rag

# Inspect volume
docker volume inspect rag_postgres_data

# Backup volume (example: uploads)
docker run --rm \
  -v rag_uploads_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Restore volume
docker run --rm \
  -v rag_uploads_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

---

## Troubleshooting

### Issue: Containers Won't Start

**Symptoms**: `docker-compose up` fails or containers exit immediately

**Solutions**:
```bash
# Check logs for errors
docker-compose logs

# Check disk space
df -h

# Check Docker daemon status
docker info

# Remove old containers and retry
docker-compose down
docker-compose up -d
```

---

### Issue: Port Already in Use

**Symptoms**: Error: "port is already allocated"

**Solutions**:
```bash
# Check what's using the port
lsof -i :3000  # Frontend
lsof -i :8001  # Backend

# On Windows (PowerShell)
netstat -ano | findstr :3000

# Option 1: Stop the conflicting process
kill <PID>

# Option 2: Change ports in docker-compose.yml
# Edit ports section:
ports:
  - "3001:3000"  # Use 3001 instead of 3000
```

---

### Issue: Database Connection Errors

**Symptoms**: Backend logs show "connection refused" or "database not found"

**Solutions**:
```bash
# Verify PostgreSQL is healthy
docker-compose ps postgres
# Should show: Up (healthy)

# Check PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres pg_isready -U postgres

# Verify DATABASE_URL in .env
echo $DATABASE_URL
# Should match: postgresql+asyncpg://postgres:postgres@postgres:5432/ragdb

# Restart backend after fixing
docker-compose restart backend
```

---

### Issue: Frontend Can't Connect to Backend

**Symptoms**: Frontend shows "Network Error" or "Failed to fetch"

**Solutions**:
```bash
# Verify backend is healthy
curl http://localhost:8001/health

# Check NEXT_PUBLIC_API_URL in .env
# Should be: http://localhost:8001

# Check CORS configuration in backend
# Verify backend allows frontend origin

# Restart frontend after fixing
docker-compose restart frontend
```

---

### Issue: Gemini API Errors

**Symptoms**: Chat queries fail with "API key invalid" or "quota exceeded"

**Solutions**:
```bash
# Verify API key is set
docker-compose exec backend env | grep GEMINI_API_KEY

# Test API key manually
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY"

# Update .env with correct key
nano .env

# Restart backend
docker-compose restart backend
```

---

### Issue: Slow Performance

**Symptoms**: Requests take longer than expected

**Solutions**:
```bash
# Check resource usage
docker stats

# Increase resource limits in docker-compose.yml
# Edit deploy.resources.limits section

# Check disk space
df -h

# Prune unused Docker resources
docker system prune -a
```

---

### Issue: Data Loss After Restart

**Symptoms**: Uploaded documents or chat history missing after restart

**Solutions**:
```bash
# Verify volumes exist
docker volume ls | grep rag

# Check if you used -v flag (removes volumes)
# ⚠️ Never use: docker-compose down -v (unless intentional)

# Restore from backup if available
# See Volume Management section above
```

---

## Health Check Reference

### Backend Health Check

```bash
curl http://localhost:8001/health | jq
```

**Healthy Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-11T12:00:00Z",
  "services": {
    "database": "connected",
    "vector_db": "connected"
  },
  "version": "1.0.0"
}
```

**Unhealthy Response**:
```json
{
  "status": "unhealthy",
  "timestamp": "2026-05-11T12:00:00Z",
  "services": {
    "database": "disconnected",
    "vector_db": "connected"
  },
  "errors": [
    "Database connection failed: connection refused"
  ]
}
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://postgres:postgres@postgres:5432/ragdb` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `JWT_SECRET` | Secret for JWT signing | `random_32_char_string` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `secure_password` |

### Optional Variables (with defaults)

| Variable | Description | Default |
|----------|-------------|---------|
| `MODEL_NAME` | Gemini model name | `gemini-1.5-pro` |
| `TEMPERATURE` | LLM temperature | `0.1` |
| `TOP_K` | Number of chunks to retrieve | `5` |
| `MAX_CONTEXT_TOKENS` | Maximum context size | `6000` |
| `MAX_RESPONSE_TOKENS` | Maximum response size | `1000` |
| `MIN_RELEVANCE_SCORE` | Minimum relevance threshold | `0.7` |

---

## Next Steps

### For Development
- Read [deployment.md](../docs/deployment.md) for detailed documentation
- Review [architecture.md](../docs/architecture.md) for system design
- See [troubleshooting.md](../docs/troubleshooting.md) for advanced issues

### For Production
- Set up reverse proxy (Nginx, Traefik, Cloudflare Tunnel)
- Configure SSL/TLS certificates
- Set up automated backups
- Configure monitoring and alerting
- Review security hardening checklist

### For Cloud Deployment
- Railway: See [railway-deployment.md](../docs/railway-deployment.md)
- Render: See [render-deployment.md](../docs/render-deployment.md)
- Vercel (frontend): See [vercel-deployment.md](../docs/vercel-deployment.md)

---

## Support

### Getting Help

- **Documentation**: Check `docs/` directory for detailed guides
- **Logs**: Always check logs first: `docker-compose logs -f`
- **Health Checks**: Verify all services are healthy: `docker-compose ps`
- **GitHub Issues**: Report bugs or request features

### Useful Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Google Gemini API](https://ai.google.dev/docs)

---

**Deployment Complete!** 🎉

Your RAG chatbot is now running at http://localhost:3000
