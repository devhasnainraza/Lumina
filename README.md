# Lumina: AI-Powered RAG Chatbot with Gemini AI

Lumina is a premium cognitive search and retrieval-augmented generation (RAG) chatbot system featuring document ingestion and intelligent, citation-grounded conversational capabilities. Users can upload documents (PDFs, DOCX, TXT) and ask complex questions, receiving accurate, structured answers backed by page-level citation tracing.

---

## Key Features

### 🧠 Brand Identity & UI Design
- **Premium Silver Emblem**: Sleek matte-platinum geometric star logo integrated into the UI.
- **Glassmorphic Styling**: Vibrant colors, rich dark modes, high-blur backdrop panels, and smooth micro-animations.
- **Responsive Layout**: Fluid typography and grid systems designed for standard screens and mobile scaling.

### 📄 Ingestion & In-App Document Preview
- **Multi-Format Ingestion**: Async processing and chunking of PDFs, DOCX, and TXT files.
- **Interactive Chunk Preview**: Click-to-preview knowledge base documents with interactive search and text-filtering.
- **Scroll-to-Chunk Highlighting**: Cited sources in chat bubble links automatically scroll the reader directly to the referenced passage with glowing indicator borders.

### 🔒 Security & Tenant Isolation
- **JWT-Protected Flow**: Cryptographically secure user registration, tokenized login session flows, and reset mechanisms.
- **Strict Tenant Separation**: Users can only search, chat with, and preview text segments of files they personally uploaded.

### 🐳 Production Deployment
- **Docker Compose Orchestration**: Single-command startup of PostgreSQL, ChromaDB, and the FastAPI application.
- **Urllib-Based Healthchecks**: Automated container monitoring using native Python libraries to ensure system health.

---

## Quick Start

### Prerequisites
- **Docker** 20.10+ and **Docker Compose** 2.0+
- **Gemini API Key** (Free tier available at [Google AI Studio](https://aistudio.google.com/))
- **8GB RAM** minimum
- **20GB Disk Space**

### 1. Configure the Environment
Clone the project, copy the environment template, and provide your credentials:

```bash
cp .env.example .env
```

Edit the `.env` file and supply:
- `GEMINI_API_KEY`: Your Google Gemini API Key.
- `JWT_SECRET`: A secure key generated via `openssl rand -base64 32` or similar.
- `POSTGRES_PASSWORD`: A strong password for the database.

### 2. Launch Services (Docker Backend)
To launch the backend stack (FastAPI, PostgreSQL database, and ChromaDB vector store):

```bash
docker-compose up -d --build
```

Verify that the containers are running and healthy:
```bash
docker-compose ps
```

The services will be available at:
- **Backend API Server**: [http://localhost:8001](http://localhost:8001)
- **Interactive Swagger Docs**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **API Server Healthcheck**: [http://localhost:8001/health](http://localhost:8001/health)

### 3. Run the Next.js Frontend
Navigate to the `frontend/` directory, install dependencies, and start the development server:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the Lumina UI.

---

## System Architecture

```
                 ┌──────────────────┐
                 │  Next.js Client  │
                 └────────┬─────────┘
                          │ (API Ports 8001/8000)
                          ▼
        ┌───────────────────────────────────┐
        │          FastAPI Backend          │
        │  ┌─────────────────────────────┐  │
        │  │ Auth Router │ Doc Ingestion │  │
        │  └─────────────────────────────┘  │
        │  ┌─────────────────────────────┐  │
        │  │       RAG Chat Engine       │  │
        │  └─────────────────────────────┘  │
        └─────────┬───────────────┬─────────┘
                  │               │
                  ▼               ▼
            ┌──────────┐    ┌──────────┐
            │PostgreSQL│    │ ChromaDB │
            │(Metadata)│    │(Vectors) │
            └──────────┘    └──────────┘
```

---

## Docker Cheat Sheet

### Manage Containers
```bash
# Start all background services
docker-compose up -d

# Stop all services (preserves database volumes)
docker-compose down

# Reset services and wipe all data volumes
docker-compose down -v

# Rebuild backend after dependency or source changes
docker-compose up -d --build backend
```

### Logs & Monitoring
```bash
# Follow logs in real-time
docker-compose logs -f

# Read specific container logs
docker-compose logs backend
docker-compose logs postgres
```
