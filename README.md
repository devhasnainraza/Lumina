# RAG Chatbot with Gemini AI

A complete RAG (Retrieval-Augmented Generation) chatbot system with document ingestion and intelligent chat capabilities. Upload documents, ask questions, and get accurate answers grounded in your documents with source attribution.

## Features

### Document Ingestion
- 🔐 **JWT Authentication** - Secure user registration and login
- 📄 **Multi-Format Support** - PDF, DOCX, and TXT files
- 🔄 **Async Processing** - Non-blocking document ingestion pipeline
- 🧠 **Vector Embeddings** - Gemini text-embedding-004 (free tier available)
- 🗄️ **Dual Storage** - PostgreSQL for metadata, ChromaDB for vectors
- 🔒 **Multi-Tenant Isolation** - User data completely isolated

### RAG Chat Engine
- 💬 **Intelligent Chat** - Ask questions about your documents
- 📚 **Source Attribution** - Every answer includes document references
- 🔄 **Multi-Turn Conversations** - Maintains context across messages
- ⚡ **Streaming Responses** - Real-time token-by-token delivery
- 🎯 **Relevance Filtering** - Only uses highly relevant chunks
- 🧠 **Context Management** - Smart token budget allocation
- 📝 **Session Management** - List, retrieve, and delete chat sessions

### Production Deployment
- 🐳 **Docker Compose** - Single-command deployment
- 🔄 **Auto-Restart** - Containers restart automatically on failure
- 💾 **Persistent Storage** - Data survives container restarts
- 🏥 **Health Checks** - Automatic service monitoring
- 🔒 **Secure Configuration** - Environment-based secrets management
- 📊 **Structured Logging** - JSON logs with correlation IDs

## Quick Start

### Prerequisites

- **Docker** 20.10+ and **Docker Compose** 2.0+ ([Get Docker](https://docs.docker.com/get-docker/))
- **Gemini API Key** (free tier available at https://makersuite.google.com/app/apikey)
- **8GB RAM** minimum
- **20GB disk space**

### 1. Clone and Configure

```bash
git clone <repository-url>
cd rag-chatbot

# Copy environment template
cp .env.example .env

# Edit .env and add your Gemini API key and JWT secret
nano .env  # or use your preferred editor
```

**Required Configuration** (edit `.env`):
```bash
# REQUIRED: Get from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# REQUIRED: Generate with: openssl rand -base64 32
JWT_SECRET=your_secure_random_string_min_32_chars

# REQUIRED: Change default password
POSTGRES_PASSWORD=your_secure_database_password
```

### 2. Start the System

```bash
# Start all services (backend, postgres, chromadb)
docker-compose up -d

# Watch logs
docker-compose logs -f

# Check health
curl http://localhost:8001/health
```

**Services will be available at:**
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs
- **Health Check**: http://localhost:8001/health

### 3. Verify Deployment

```bash
# Check all containers are running
docker-compose ps

# Expected output:
# NAME            STATUS          PORTS
# rag-backend     Up (healthy)    0.0.0.0:8001->8000/tcp
# rag-chromadb    Up (healthy)    8000/tcp
# rag-postgres    Up (healthy)    5432/tcp
```

### 4. Test the Complete Workflow

```bash
# 1. Create an account
curl -X POST http://localhost:8001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"securepass123"}'

# 2. Login and get token
TOKEN=$(curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"securepass123"}' \
  | jq -r '.access_token')

# 3. Upload a document
curl -X POST http://localhost:8001/api/docs/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample.pdf"

# 4. List your documents
curl -X GET http://localhost:8001/api/docs \
  -H "Authorization: Bearer $TOKEN"

# 5. Ask a question about your documents
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the main topic of the document?", "stream": false}'

# 6. Continue the conversation
SESSION_ID="<session_id_from_previous_response>"
curl -X POST http://localhost:8001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"Can you explain that in more detail?\", \"session_id\": \"$SESSION_ID\"}"

# 7. List your chat sessions
curl -X GET http://localhost:8001/api/chat/history \
  -H "Authorization: Bearer $TOKEN"

# 8. Get full conversation history
curl -X GET "http://localhost:8001/api/chat/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN"
```

## Docker Commands

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

# View status
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
docker-compose logs postgres

# View last 100 lines
docker-compose logs --tail=100 backend
```

### Updates and Rebuilds

```bash
# Rebuild after code changes
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend

# Force rebuild (no cache)
docker-compose build --no-cache
docker-compose up -d
```

## API Endpoints

### Authentication

- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and get JWT token

### Documents

- `POST /api/docs/upload` - Upload document (requires auth)
- `GET /api/docs` - List user's documents (requires auth)
- `GET /api/docs/{id}` - Get document details (requires auth)
- `DELETE /api/docs/{id}` - Delete document (requires auth)

### Chat (RAG Engine)

- `POST /api/chat` - Ask a question about your documents (requires auth)
  - Supports streaming with `"stream": true`
  - Creates new session if `session_id` not provided
  - Returns grounded response with source attribution
- `GET /api/chat/history` - List your chat sessions (requires auth)
  - Supports pagination with `limit` and `offset`
- `GET /api/chat/{session_id}` - Get full conversation history (requires auth)
  - Supports pagination with `limit` and `offset`
- `DELETE /api/chat/{session_id}` - Delete a chat session (requires auth)

### System

- `GET /health` - Health check (includes LLM API status)
- `GET /docs` - Interactive API documentation

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         FastAPI Backend             │
│  ┌──────────────────────────────┐  │
│  │  Auth Routes  │  Doc Routes  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │   Ingestion Pipeline         │  │
│  │  Parse → Chunk → Embed       │  │
│  └──────────────────────────────┘  │
└─────────┬───────────────┬───────────┘
          │               │
          ▼               ▼
    ┌──────────┐    ┌──────────┐
    │PostgreSQL│    │ ChromaDB │
    │(Metadata)│    │(Vectors) │
    └──────────┘    └──────────┘
```

## Configuration

Edit `.env` file:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/ragdb

# Gemini AI (REQUIRED - get free key at https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your-gemini-api-key-here

# JWT Secret (generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
JWT_SECRET=your-secret-key-change-this

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=/app/uploads

# Vector Database
VECTOR_DB_PATH=/app/data/chromadb
```

## Development

### Run Without Docker

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Set environment variables
export DATABASE_URL="postgresql+asyncpg://localhost/ragdb"
export GEMINI_API_KEY="your-key"
export JWT_SECRET="your-secret"

# Run server
cd backend
uvicorn main:app --reload
```

### Run Tests

```bash
pytest
pytest --cov=backend --cov-report=html
```

## Troubleshooting

### Services won't start

```bash
# Check Docker resources
docker system df

# View logs
docker-compose logs backend
docker-compose logs postgres
docker-compose logs chromadb

# Reset everything
docker-compose down -v
docker-compose up --build
```

### Database connection failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### OpenAI API errors

```bash
# Verify API key
echo $OPENAI_API_KEY

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

## Performance

- **Upload validation**: <500ms
- **Text extraction**: <3s per document (average)
- **Embedding generation**: <5s per document (average)
- **Retrieval query**: <1s (p95)
- **Concurrent uploads**: 10+ supported

## Security

- ✅ JWT authentication on all endpoints
- ✅ Password hashing with bcrypt
- ✅ File type validation (MIME + content)
- ✅ File size limits (10MB)
- ✅ Filename sanitization
- ✅ Multi-tenant data isolation
- ✅ Rate limiting per user

## Limitations (MVP)

- In-memory rate limiting (use Redis for production)
- Local file storage (use S3 for production)
- No OCR for scanned documents
- No document versioning
- No collaborative features

## Tech Stack

- **Backend**: FastAPI 0.104+, Python 3.11+
- **Database**: PostgreSQL 15+, SQLAlchemy 2.0+
- **Vector DB**: ChromaDB (local) or Pinecone (cloud)
- **Embeddings**: Gemini text-embedding-004 (via LangChain)
- **Auth**: JWT with python-jose, bcrypt
- **Parsing**: PyMuPDF, python-docx, tiktoken
- **Container**: Docker, Docker Compose

## License

MIT

## Support

For issues or questions:
- Check the [API documentation](http://localhost:8001/docs)
- Review [quickstart guide](specs/001-rag-ingestion-foundation/quickstart.md)
- Check Docker logs: `docker-compose logs`
