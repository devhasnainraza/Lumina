# Data Model: RAG Ingestion Foundation

**Feature**: 001-rag-ingestion-foundation  
**Date**: 2026-05-06  
**Purpose**: Define database entities, relationships, and validation rules

## Entity Relationship Overview

```
User (1) ──────< (N) Document (1) ──────< (N) Chunk
                                                │
                                                │ (1:1)
                                                │
                                            Embedding (stored in Vector DB)
```

## Entities

### 1. User

**Purpose**: Represents an authenticated user of the system

**Fields**:

| Field          | Type         | Constraints                    | Description                           |
|----------------|--------------|--------------------------------|---------------------------------------|
| id             | UUID         | PRIMARY KEY, NOT NULL          | Unique user identifier                |
| email          | String(255)  | UNIQUE, NOT NULL               | User email address (login identifier) |
| password_hash  | String(255)  | NOT NULL                       | Bcrypt hashed password                |
| created_at     | DateTime     | NOT NULL, DEFAULT NOW()        | Account creation timestamp            |
| updated_at     | DateTime     | NOT NULL, DEFAULT NOW()        | Last update timestamp                 |

**Relationships**:
- One user has many documents (1:N)

**Validation Rules**:
- Email must be valid format (RFC 5322)
- Email must be unique across all users
- Password must be at least 8 characters before hashing
- Password hash uses bcrypt with cost factor 12

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`

**State Transitions**: N/A (users don't have state)

---

### 2. Document

**Purpose**: Represents an uploaded document with metadata

**Fields**:

| Field          | Type         | Constraints                    | Description                           |
|----------------|--------------|--------------------------------|---------------------------------------|
| id             | UUID         | PRIMARY KEY, NOT NULL          | Unique document identifier            |
| user_id        | UUID         | FOREIGN KEY, NOT NULL          | Owner of the document                 |
| filename       | String(255)  | NOT NULL                       | Original filename                     |
| file_path      | String(512)  | NOT NULL                       | Storage path on filesystem            |
| file_size      | Integer      | NOT NULL                       | File size in bytes                    |
| file_type      | Enum         | NOT NULL                       | PDF, DOCX, or TXT                     |
| status         | Enum         | NOT NULL, DEFAULT 'uploaded'   | Processing status                     |
| error_message  | Text         | NULLABLE                       | Error details if processing failed    |
| created_at     | DateTime     | NOT NULL, DEFAULT NOW()        | Upload timestamp                      |
| updated_at     | DateTime     | NOT NULL, DEFAULT NOW()        | Last update timestamp                 |
| processed_at   | DateTime     | NULLABLE                       | Completion timestamp                  |

**Relationships**:
- Many documents belong to one user (N:1)
- One document has many chunks (1:N)

**Validation Rules**:
- filename must not be empty
- file_size must be > 0 and <= 10485760 (10MB)
- file_type must be one of: 'pdf', 'docx', 'txt'
- status must be one of: 'uploaded', 'processing', 'completed', 'failed'
- file_path must be unique across all documents

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `user_id` (for filtering by user)
- INDEX on `status` (for querying processing state)
- INDEX on `created_at` (for sorting by upload time)

**State Transitions**:
```
uploaded → processing → completed
                     ↘ failed
```

**State Rules**:
- Cannot transition from 'completed' or 'failed' back to 'processing'
- 'error_message' must be set when status is 'failed'
- 'processed_at' must be set when status is 'completed' or 'failed'

---

### 3. Chunk

**Purpose**: Represents a text segment extracted from a document

**Fields**:

| Field          | Type         | Constraints                    | Description                           |
|----------------|--------------|--------------------------------|---------------------------------------|
| id             | UUID         | PRIMARY KEY, NOT NULL          | Unique chunk identifier               |
| document_id    | UUID         | FOREIGN KEY, NOT NULL          | Parent document                       |
| chunk_index    | Integer      | NOT NULL                       | Position in document (0-based)        |
| text           | Text         | NOT NULL                       | Chunk text content                    |
| token_count    | Integer      | NOT NULL                       | Number of tokens in chunk             |
| created_at     | DateTime     | NOT NULL, DEFAULT NOW()        | Creation timestamp                    |

**Relationships**:
- Many chunks belong to one document (N:1)
- One chunk has one embedding (1:1, stored in vector DB)

**Validation Rules**:
- text must not be empty
- token_count must be >= 1 and <= 1000
- chunk_index must be >= 0
- (document_id, chunk_index) must be unique (no duplicate indexes per document)

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `document_id` (for retrieving all chunks of a document)
- UNIQUE INDEX on `(document_id, chunk_index)` (enforce ordering)

**State Transitions**: N/A (chunks are immutable once created)

---

### 4. Embedding (Vector Database)

**Purpose**: Represents a vector embedding of a chunk (stored in ChromaDB/Pinecone, not PostgreSQL)

**Fields**:

| Field          | Type         | Constraints                    | Description                           |
|----------------|--------------|--------------------------------|---------------------------------------|
| id             | String       | PRIMARY KEY                    | Chunk ID (same as PostgreSQL)         |
| vector         | Float[]      | NOT NULL, dimension=1536       | Embedding vector                      |
| metadata       | JSON         | NOT NULL                       | Associated metadata                   |

**Metadata Structure**:
```json
{
  "user_id": "uuid",
  "document_id": "uuid",
  "chunk_id": "uuid",
  "chunk_index": 0,
  "document_filename": "example.pdf"
}
```

**Relationships**:
- One embedding corresponds to one chunk (1:1)
- Linked via chunk_id

**Validation Rules**:
- vector must have exactly 1536 dimensions
- metadata.user_id must be present (for multi-tenant filtering)
- metadata.document_id must be present
- metadata.chunk_id must match the embedding id

**Indexes**:
- Vector index for similarity search (handled by vector DB)
- Metadata index on user_id (for filtering)

**State Transitions**: N/A (embeddings are immutable once created)

---

## Cascade Deletion Rules

**When a User is deleted**:
- CASCADE delete all associated Documents
- CASCADE delete all associated Chunks (via Documents)
- CASCADE delete all associated Embeddings (via Chunks)

**When a Document is deleted**:
- CASCADE delete all associated Chunks
- CASCADE delete all associated Embeddings (via Chunks)
- DELETE file from filesystem

**When a Chunk is deleted**:
- CASCADE delete associated Embedding from vector DB

**Implementation Notes**:
- PostgreSQL foreign keys handle User → Document → Chunk cascades
- Application code handles Chunk → Embedding cascade (vector DB cleanup)
- File deletion handled in application code (not database trigger)

## Multi-Tenant Isolation

**Enforcement Points**:

1. **Database Level**:
   - All queries for Documents include `WHERE user_id = :current_user_id`
   - All queries for Chunks join through Documents to filter by user_id

2. **Vector Database Level**:
   - All similarity searches include metadata filter: `{"user_id": current_user_id}`
   - Prevents cross-user embedding retrieval

3. **Application Level**:
   - JWT token contains user_id claim
   - Dependency injection provides current_user to all endpoints
   - Authorization checks before any data access

**Validation**:
- Integration tests verify User A cannot access User B's documents
- Integration tests verify User A cannot retrieve User B's embeddings
- Security tests attempt cross-user access with manipulated IDs

## Data Integrity Constraints

1. **Referential Integrity**:
   - All foreign keys enforced at database level
   - Cannot create Chunk without valid Document
   - Cannot create Document without valid User

2. **Consistency**:
   - Document.status reflects actual processing state
   - Chunk count matches actual chunks in database
   - Embedding count matches chunk count

3. **Atomicity**:
   - Document upload is atomic (file + metadata)
   - Chunk creation is transactional (all or none)
   - Embedding insertion is batched but retryable

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried fields are indexed
2. **Pagination**: Document and chunk lists support offset/limit pagination
3. **Lazy Loading**: Don't load chunk text in document list endpoints
4. **Connection Pooling**: SQLAlchemy pool size configured for concurrent requests
5. **Batch Operations**: Chunks and embeddings inserted in batches

## Migration Strategy

**Initial Schema Creation**:
1. Create User table
2. Create Document table with foreign key to User
3. Create Chunk table with foreign key to Document
4. Create indexes
5. Initialize vector database collection

**Future Migrations**:
- Use Alembic for schema versioning
- Version chunking strategy in metadata
- Support backward-compatible changes
- Document breaking changes in ADRs
