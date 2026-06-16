# Data Model: RAG Engine & Chat System

**Feature**: 002-rag-chat-engine  
**Date**: 2026-05-07  
**Purpose**: Define database entities, relationships, and validation rules for chat system

## Entity Relationship Overview

```
User (1) ──────< (N) ChatSession (1) ──────< (N) ChatMessage
                                                      │
                                                      │ contains
                                                      ▼
                                              SourceReference (embedded JSON)

Document (1) ──────< (N) Chunk (referenced in SourceReference)
```

## Core Entities

### ChatSession

Represents a conversation thread between a user and the RAG system.

**Fields**:
- `id` (UUID, primary key): Unique session identifier
- `user_id` (UUID, foreign key → User.id, indexed): Owner of the session
- `title` (String, max 200 chars, nullable): Optional session title (can be auto-generated from first query)
- `created_at` (DateTime, indexed): Session creation timestamp
- `updated_at` (DateTime): Last message timestamp (for sorting recent sessions)

**Relationships**:
- Belongs to one User (many-to-one)
- Has many ChatMessages (one-to-many, cascade delete)

**Validation Rules**:
- `user_id` must reference existing user
- `title` if provided must be non-empty and ≤ 200 characters
- `created_at` must be ≤ current time
- `updated_at` must be ≥ `created_at`

**Indexes**:
- Primary: `id`
- Composite: `(user_id, updated_at DESC)` for listing user's recent sessions
- Single: `user_id` for filtering

**State Transitions**: None (sessions are created and remain active until deleted)

### ChatMessage

Represents a single message in a conversation (user query or assistant response).

**Fields**:
- `id` (UUID, primary key): Unique message identifier
- `session_id` (UUID, foreign key → ChatSession.id, indexed): Parent session
- `role` (Enum: 'user' | 'assistant', not null): Message sender
- `content` (Text, not null): Message text content
- `sources` (JSONB, nullable): Source attribution for assistant messages (array of SourceReference objects)
- `created_at` (DateTime, indexed): Message creation timestamp

**Relationships**:
- Belongs to one ChatSession (many-to-one)
- References Chunks indirectly through `sources` JSON field

**Validation Rules**:
- `session_id` must reference existing session
- `role` must be 'user' or 'assistant'
- `content` must be non-empty
- `sources` must be null for user messages, non-null for assistant messages
- `sources` if present must be valid JSON array of SourceReference objects
- `created_at` must be ≤ current time

**Indexes**:
- Primary: `id`
- Composite: `(session_id, created_at ASC)` for retrieving conversation history in order
- Single: `session_id` for filtering

**State Transitions**: None (messages are immutable once created)

### SourceReference (Embedded in ChatMessage.sources)

Represents attribution for a retrieved chunk used in an assistant response. Stored as JSON within ChatMessage.

**Structure** (JSON object):
```json
{
  "document_id": "uuid",
  "document_name": "string",
  "chunk_index": "integer",
  "page_reference": "string (optional)",
  "relevance_score": "float (0.0-1.0)"
}
```

**Fields**:
- `document_id` (UUID): Reference to source document
- `document_name` (String): Human-readable document name
- `chunk_index` (Integer): Position of chunk within document
- `page_reference` (String, optional): Page number or section reference
- `relevance_score` (Float): Cosine similarity score (0.0-1.0)

**Validation Rules**:
- `document_id` should reference existing document (soft reference, not enforced)
- `document_name` must be non-empty
- `chunk_index` must be ≥ 0
- `relevance_score` must be between 0.0 and 1.0

**Note**: SourceReference is not a separate table but embedded JSON in ChatMessage.sources for simplicity and performance.

## Relationships

### User → ChatSession (One-to-Many)
- One user can have multiple chat sessions
- Cascade delete: Deleting a user deletes all their sessions
- Foreign key: `ChatSession.user_id` → `User.id`

### ChatSession → ChatMessage (One-to-Many)
- One session contains multiple messages
- Cascade delete: Deleting a session deletes all its messages
- Foreign key: `ChatMessage.session_id` → `ChatSession.id`
- Ordering: Messages ordered by `created_at` ASC within a session

### ChatMessage → Document/Chunk (Soft Reference)
- Assistant messages reference chunks via `sources` JSON field
- No foreign key constraint (soft reference for flexibility)
- Document/chunk deletion doesn't cascade to messages (historical record preserved)

## Database Schema (PostgreSQL)

```sql
-- ChatSession table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user_updated 
    ON chat_sessions(user_id, updated_at DESC);

-- ChatMessage table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT check_sources_for_assistant 
        CHECK (role = 'user' OR sources IS NOT NULL)
);

CREATE INDEX idx_chat_messages_session_created 
    ON chat_messages(session_id, created_at ASC);

-- Trigger to update ChatSession.updated_at on new message
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions 
    SET updated_at = NEW.created_at 
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_timestamp
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_timestamp();
```

## SQLAlchemy Models (Python)

```python
# models/chat_session.py
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")

# models/chat_message.py
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    sources = Column(JSONB, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("role IN ('user', 'assistant')", name="check_role"),
        CheckConstraint("role = 'user' OR sources IS NOT NULL", name="check_sources_for_assistant"),
    )
```

## Pydantic Schemas (Request/Response)

```python
# schemas/chat.py
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class SourceReference(BaseModel):
    document_id: UUID
    document_name: str
    chunk_index: int = Field(ge=0)
    page_reference: Optional[str] = None
    relevance_score: float = Field(ge=0.0, le=1.0)

class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    session_id: Optional[UUID] = None  # If None, create new session
    stream: bool = False

class ChatMessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    sources: Optional[List[SourceReference]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    session_id: UUID
    message: ChatMessageResponse
    
class ChatSessionSummary(BaseModel):
    id: UUID
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    message_count: int
    
class ChatHistoryResponse(BaseModel):
    session_id: UUID
    messages: List[ChatMessageResponse]
    total_count: int
```

## Data Access Patterns

### Create New Session
```python
session = ChatSession(user_id=current_user.id)
db.add(session)
await db.commit()
```

### Add Message to Session
```python
message = ChatMessage(
    session_id=session_id,
    role="user",
    content=query
)
db.add(message)
await db.commit()
```

### Retrieve Session History
```python
messages = await db.execute(
    select(ChatMessage)
    .where(ChatMessage.session_id == session_id)
    .order_by(ChatMessage.created_at.asc())
)
```

### List User's Sessions
```python
sessions = await db.execute(
    select(ChatSession)
    .where(ChatSession.user_id == user_id)
    .order_by(ChatSession.updated_at.desc())
    .limit(20)
)
```

### Delete Session (Cascade)
```python
await db.execute(
    delete(ChatSession)
    .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
)
await db.commit()
```

## Migration Strategy

### Alembic Migration
```python
# migrations/versions/xxx_add_chat_tables.py
def upgrade():
    op.create_table(
        'chat_sessions',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('user_id', postgresql.UUID(), nullable=False),
        sa.Column('title', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_chat_sessions_user_updated', 'chat_sessions', ['user_id', 'updated_at'])
    
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('session_id', postgresql.UUID(), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('sources', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("role IN ('user', 'assistant')", name='check_role'),
        sa.CheckConstraint("role = 'user' OR sources IS NOT NULL", name='check_sources_for_assistant')
    )
    op.create_index('idx_chat_messages_session_created', 'chat_messages', ['session_id', 'created_at'])

def downgrade():
    op.drop_table('chat_messages')
    op.drop_table('chat_sessions')
```

## Performance Considerations

### Query Optimization
- Index on `(user_id, updated_at DESC)` for fast session listing
- Index on `(session_id, created_at ASC)` for fast message retrieval
- JSONB for sources allows flexible schema without joins

### Storage Optimization
- Sources stored as JSONB (compressed, indexed if needed)
- No separate SourceReference table reduces joins
- Cascade deletes handled at database level (efficient)

### Scalability
- Stateless design (no in-memory session state)
- Horizontal scaling possible (sessions independent)
- Partitioning possible by user_id if needed at scale
