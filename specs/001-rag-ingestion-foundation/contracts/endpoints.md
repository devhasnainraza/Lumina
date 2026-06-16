# API Endpoints: RAG Ingestion Foundation

**Feature**: 001-rag-ingestion-foundation  
**Date**: 2026-05-06  
**Base URL**: `http://localhost:8000`  
**API Version**: v1

## Authentication

All endpoints except `/auth/signup` and `/auth/login` require JWT authentication.

**Authentication Header**:
```
Authorization: Bearer <jwt_token>
```

**Token Format**: JWT with HS256 algorithm

**Token Payload**:
```json
{
  "sub": "user_id",
  "exp": 1234567890
}
```

---

## Endpoints

### 1. POST /auth/signup

**Purpose**: Register a new user account

**Authentication**: None (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Request Validation**:
- `email`: Required, valid email format, max 255 characters
- `password`: Required, min 8 characters, max 128 characters

**Success Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "created_at": "2026-05-06T10:30:00Z"
}
```

**Error Responses**:

400 Bad Request - Invalid input:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "email": ["Invalid email format"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

409 Conflict - Email already exists:
```json
{
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "An account with this email already exists"
  }
}
```

---

### 2. POST /auth/login

**Purpose**: Authenticate user and receive JWT token

**Authentication**: None (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Request Validation**:
- `email`: Required, valid email format
- `password`: Required

**Success Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Error Responses**:

401 Unauthorized - Invalid credentials:
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

---

### 3. POST /api/docs/upload

**Purpose**: Upload a document for processing

**Authentication**: Required (JWT)

**Request**: Multipart form data

**Form Fields**:
- `file`: File upload (required)

**Request Validation**:
- File size: Max 10MB (10485760 bytes)
- File type: PDF, DOCX, or TXT only (validated by MIME type)
- Filename: Max 255 characters

**Success Response** (202 Accepted):
```json
{
  "id": "650e8400-e29b-41d4-a716-446655440001",
  "filename": "research_paper.pdf",
  "file_size": 2048576,
  "file_type": "pdf",
  "status": "uploaded",
  "created_at": "2026-05-06T10:35:00Z",
  "message": "Document uploaded successfully. Processing has started."
}
```

**Error Responses**:

400 Bad Request - Invalid file:
```json
{
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "File type not supported. Allowed types: PDF, DOCX, TXT"
  }
}
```

413 Payload Too Large - File too large:
```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds maximum limit of 10MB"
  }
}
```

401 Unauthorized - Missing or invalid token:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

### 4. GET /api/docs

**Purpose**: List all documents for the authenticated user

**Authentication**: Required (JWT)

**Query Parameters**:
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `offset` (optional): Number of results to skip (default: 0)
- `status` (optional): Filter by status (uploaded, processing, completed, failed)

**Success Response** (200 OK):
```json
{
  "documents": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "filename": "research_paper.pdf",
      "file_size": 2048576,
      "file_type": "pdf",
      "status": "completed",
      "created_at": "2026-05-06T10:35:00Z",
      "processed_at": "2026-05-06T10:35:08Z"
    },
    {
      "id": "750e8400-e29b-41d4-a716-446655440002",
      "filename": "notes.docx",
      "file_size": 512000,
      "file_type": "docx",
      "status": "processing",
      "created_at": "2026-05-06T10:40:00Z",
      "processed_at": null
    }
  ],
  "total": 2,
  "limit": 20,
  "offset": 0
}
```

**Error Responses**:

401 Unauthorized - Missing or invalid token:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

### 5. GET /api/docs/{document_id}

**Purpose**: Get details of a specific document

**Authentication**: Required (JWT)

**Path Parameters**:
- `document_id`: UUID of the document

**Success Response** (200 OK):
```json
{
  "id": "650e8400-e29b-41d4-a716-446655440001",
  "filename": "research_paper.pdf",
  "file_size": 2048576,
  "file_type": "pdf",
  "status": "completed",
  "created_at": "2026-05-06T10:35:00Z",
  "processed_at": "2026-05-06T10:35:08Z",
  "chunk_count": 42,
  "error_message": null
}
```

**Error Responses**:

404 Not Found - Document doesn't exist or doesn't belong to user:
```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Document not found"
  }
}
```

401 Unauthorized:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

### 6. DELETE /api/docs/{document_id}

**Purpose**: Delete a document and all associated data

**Authentication**: Required (JWT)

**Path Parameters**:
- `document_id`: UUID of the document

**Success Response** (200 OK):
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

**Error Responses**:

404 Not Found - Document doesn't exist or doesn't belong to user:
```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Document not found"
  }
}
```

403 Forbidden - User doesn't own the document:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to delete this document"
  }
}
```

401 Unauthorized:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

## Common Error Codes

| Code                  | HTTP Status | Description                                    |
|-----------------------|-------------|------------------------------------------------|
| VALIDATION_ERROR      | 400         | Request data failed validation                 |
| INVALID_FILE_TYPE     | 400         | Unsupported file format                        |
| FILE_TOO_LARGE        | 413         | File exceeds size limit                        |
| UNAUTHORIZED          | 401         | Missing or invalid authentication token        |
| INVALID_CREDENTIALS   | 401         | Wrong email or password                        |
| FORBIDDEN             | 403         | User lacks permission for this resource        |
| DOCUMENT_NOT_FOUND    | 404         | Document doesn't exist or not owned by user    |
| EMAIL_EXISTS          | 409         | Email already registered                       |
| INTERNAL_ERROR        | 500         | Unexpected server error                        |

---

## Rate Limiting

**Limits** (per user):
- Upload: 10 requests per minute
- List/Get: 60 requests per minute
- Delete: 20 requests per minute

**Rate Limit Headers**:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1620000000
```

**Rate Limit Exceeded Response** (429 Too Many Requests):
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retry_after": 45
  }
}
```

---

## CORS Configuration

**Allowed Origins**: Configurable via environment variable (default: localhost)

**Allowed Methods**: GET, POST, DELETE, OPTIONS

**Allowed Headers**: Authorization, Content-Type

**Exposed Headers**: X-RateLimit-*

---

## Health Check

### GET /health

**Purpose**: Check API health status

**Authentication**: None

**Success Response** (200 OK):
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

---

## Example Workflows

### Complete Upload Flow

1. **Signup**:
   ```bash
   curl -X POST http://localhost:8000/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123"}'
   ```

2. **Login**:
   ```bash
   curl -X POST http://localhost:8000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123"}'
   ```
   Response: `{"access_token":"eyJ...","token_type":"bearer"}`

3. **Upload Document**:
   ```bash
   curl -X POST http://localhost:8000/api/docs/upload \
     -H "Authorization: Bearer eyJ..." \
     -F "file=@document.pdf"
   ```

4. **Check Status**:
   ```bash
   curl -X GET http://localhost:8000/api/docs \
     -H "Authorization: Bearer eyJ..."
   ```

5. **Delete Document**:
   ```bash
   curl -X DELETE http://localhost:8000/api/docs/{document_id} \
     -H "Authorization: Bearer eyJ..."
   ```
