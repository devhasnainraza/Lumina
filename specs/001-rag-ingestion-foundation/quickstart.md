# Quickstart Guide: RAG Ingestion Foundation

**Feature**: 001-rag-ingestion-foundation  
**Date**: 2026-05-06  
**Estimated Setup Time**: 10 minutes

## Prerequisites

Before starting, ensure you have:

- **Docker** 20.10+ and **Docker Compose** 2.0+ installed
- **OpenAI API Key** (for embedding generation)
- **Git** (to clone the repository)
- **8GB RAM** minimum (for running all services)
- **10GB disk space** (for Docker images and data)

## Quick Start (5 minutes)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd rag-chatbot

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your settings:

```bash
# Required: Add your OpenAI API key
OPENAI_API_KEY=sk-your-api-key-here

# Database (default values work for Docker setup)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ragdb

# JWT Secret (generate a secure random string)
JWT_SECRET=your-secret-key-change-this-in-production

# Vector DB (ChromaDB local path)
VECTOR_DB_PATH=/app/data/chromadb
```

**Generate a secure JWT secret**:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Start the System

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

**Expected output**:
```
✓ Network rag-chatbot_default created
✓ Container postgres started
✓ Container chromadb started
✓ Container backend started
```

### 4. Verify Installation

Check that all services are running:

```bash
docker-compose ps
```

Expected status: All services should show "Up" or "healthy"

Test the API:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-06T10:45:00Z",
  "services": {
    "database": "connected",
    "vector_db": "connected"
  }
}
```

### 5. Access API Documentation

Open your browser and navigate to:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Complete Workflow Example

### Step 1: Create an Account

```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "securepass123"
  }'
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "demo@example.com",
  "created_at": "2026-05-06T10:30:00Z"
}
```

### Step 2: Login and Get Token

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "securepass123"
  }'
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Save the token** for subsequent requests:
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 3: Upload a Document

```bash
curl -X POST http://localhost:8000/api/docs/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample.pdf"
```

**Response**:
```json
{
  "id": "650e8400-e29b-41d4-a716-446655440001",
  "filename": "sample.pdf",
  "file_size": 2048576,
  "file_type": "pdf",
  "status": "uploaded",
  "created_at": "2026-05-06T10:35:00Z",
  "message": "Document uploaded successfully. Processing has started."
}
```

### Step 4: Check Processing Status

```bash
curl -X GET http://localhost:8000/api/docs \
  -H "Authorization: Bearer $TOKEN"
```

**Response**:
```json
{
  "documents": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "filename": "sample.pdf",
      "file_size": 2048576,
      "file_type": "pdf",
      "status": "completed",
      "created_at": "2026-05-06T10:35:00Z",
      "processed_at": "2026-05-06T10:35:08Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

### Step 5: Get Document Details

```bash
curl -X GET http://localhost:8000/api/docs/650e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer $TOKEN"
```

**Response**:
```json
{
  "id": "650e8400-e29b-41d4-a716-446655440001",
  "filename": "sample.pdf",
  "file_size": 2048576,
  "file_type": "pdf",
  "status": "completed",
  "created_at": "2026-05-06T10:35:00Z",
  "processed_at": "2026-05-06T10:35:08Z",
  "chunk_count": 42,
  "error_message": null
}
```

### Step 6: Delete a Document

```bash
curl -X DELETE http://localhost:8000/api/docs/650e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer $TOKEN"
```

**Response**:
```json
{
  "message": "Document deleted successfully",
  "deleted": {
    "document_id": "650e8400-e29b-41d4-a716-446655440001",
    "chunks_deleted": 42,
    "embeddings_deleted": 42
  }
}
```

---

## Verification Tests

### Test 1: Multi-Tenant Isolation

Create two users and verify they cannot access each other's documents:

```bash
# User A: Signup and upload
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"usera@example.com","password":"pass123"}'

TOKEN_A=$(curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usera@example.com","password":"pass123"}' \
  | jq -r '.access_token')

curl -X POST http://localhost:8000/api/docs/upload \
  -H "Authorization: Bearer $TOKEN_A" \
  -F "file=@doc_a.pdf"

# User B: Signup and try to access User A's documents
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"userb@example.com","password":"pass123"}'

TOKEN_B=$(curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"userb@example.com","password":"pass123"}' \
  | jq -r '.access_token')

# This should return empty list (User B sees no documents)
curl -X GET http://localhost:8000/api/docs \
  -H "Authorization: Bearer $TOKEN_B"
```

**Expected**: User B's document list is empty (cannot see User A's documents)

### Test 2: File Validation

Test that invalid files are rejected:

```bash
# Test oversized file (should fail)
dd if=/dev/zero of=large.pdf bs=1M count=11
curl -X POST http://localhost:8000/api/docs/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@large.pdf"
# Expected: 413 Payload Too Large

# Test invalid file type (should fail)
echo "test" > test.exe
curl -X POST http://localhost:8000/api/docs/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.exe"
# Expected: 400 Invalid File Type
```

### Test 3: Processing Pipeline

Upload a document and verify all pipeline stages:

```bash
# Upload
DOC_ID=$(curl -X POST http://localhost:8000/api/docs/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf" \
  | jq -r '.id')

# Wait for processing (check status every 2 seconds)
while true; do
  STATUS=$(curl -s -X GET http://localhost:8000/api/docs/$DOC_ID \
    -H "Authorization: Bearer $TOKEN" \
    | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  sleep 2
done

# Verify chunks were created
curl -X GET http://localhost:8000/api/docs/$DOC_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.chunk_count'
# Expected: Number > 0
```

---

## Troubleshooting

### Issue: Services won't start

**Check Docker resources**:
```bash
docker system df
docker system prune  # Clean up if needed
```

**Check logs**:
```bash
docker-compose logs backend
docker-compose logs postgres
docker-compose logs chromadb
```

### Issue: Database connection failed

**Verify PostgreSQL is running**:
```bash
docker-compose ps postgres
```

**Check database logs**:
```bash
docker-compose logs postgres
```

**Reset database** (WARNING: deletes all data):
```bash
docker-compose down -v
docker-compose up -d
```

### Issue: OpenAI API errors

**Verify API key**:
```bash
echo $OPENAI_API_KEY
```

**Test API key**:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Issue: File upload fails

**Check file permissions**:
```bash
ls -la uploads/
```

**Check disk space**:
```bash
df -h
```

**Check backend logs**:
```bash
docker-compose logs backend | grep ERROR
```

---

## Development Mode

### Running without Docker

**Prerequisites**:
- Python 3.11+
- PostgreSQL 15+
- ChromaDB (or Pinecone account)

**Setup**:
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Setup database
createdb ragdb
export DATABASE_URL="postgresql://localhost/ragdb"

# Run migrations (if using Alembic)
alembic upgrade head

# Start server
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=backend --cov-report=html

# Run specific test file
pytest tests/integration/test_upload_flow.py

# Run with verbose output
pytest -v
```

---

## Next Steps

After completing the quickstart:

1. **Explore API Documentation**: Visit http://localhost:8000/docs
2. **Test with Real Documents**: Upload your own PDF, DOCX, or TXT files
3. **Monitor Logs**: Watch processing in real-time with `docker-compose logs -f backend`
4. **Verify Vector Storage**: Check that embeddings are stored correctly
5. **Test Multi-User Scenarios**: Create multiple accounts and verify isolation

---

## Production Deployment

For production deployment, consider:

1. **Use managed PostgreSQL** (AWS RDS, Google Cloud SQL, Neon)
2. **Use Pinecone** instead of local ChromaDB
3. **Set up proper secrets management** (AWS Secrets Manager, HashiCorp Vault)
4. **Configure CORS** for your frontend domain
5. **Enable HTTPS** with proper SSL certificates
6. **Set up monitoring** (Prometheus, Grafana, Sentry)
7. **Configure log aggregation** (ELK stack, CloudWatch)
8. **Implement rate limiting** at API gateway level
9. **Set up CI/CD pipeline** for automated deployments
10. **Configure backup strategy** for database and uploaded files

---

## Support

For issues or questions:
- Check the [API documentation](http://localhost:8000/docs)
- Review [data model](./data-model.md)
- See [endpoint contracts](./contracts/endpoints.md)
- Check Docker logs: `docker-compose logs`
