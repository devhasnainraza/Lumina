"""Pydantic schemas for chat API requests and responses."""

from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class SourceReference(BaseModel):
    """Source attribution for retrieved chunks."""

    document_id: UUID
    document_name: str
    chunk_index: int = Field(ge=0)
    page_reference: Optional[str] = None
    relevance_score: float = Field(ge=0.0, le=1.0)

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    """Request schema for chat endpoint."""

    query: str = Field(min_length=1, max_length=2000, description="User's question")
    session_id: Optional[UUID] = Field(
        None,
        description="Session ID for multi-turn conversation. If None, creates new session."
    )
    stream: bool = Field(
        False,
        description="Enable streaming response (Server-Sent Events)"
    )
    model: Optional[str] = Field(
        None,
        description="Optional model override (e.g. gemini-2.5-flash-lite, llama-3.3-70b-versatile)"
    )
    temperature: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Optional LLM temperature override (0.0 to 1.0)"
    )
    top_k: Optional[int] = Field(
        None,
        ge=1,
        le=10,
        description="Optional chunk retrieval top_k override (1 to 10)"
    )

    @validator("query")
    def validate_query(cls, v):
        """Validate query is not empty after stripping whitespace."""
        if not v.strip():
            raise ValueError("Query cannot be empty")
        return v.strip()


class ChatMessageResponse(BaseModel):
    """Response schema for a single chat message."""

    id: UUID
    role: str
    content: str
    sources: Optional[List[SourceReference]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    """Response schema for chat endpoint."""

    session_id: UUID
    message: ChatMessageResponse


class ChatSessionSummary(BaseModel):
    """Summary of a chat session for listing."""

    id: UUID
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    message_count: int

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    """Response schema for chat history endpoint."""

    session_id: UUID
    messages: List[ChatMessageResponse]
    total_count: int
    limit: int
    offset: int


class ChatHistoryListResponse(BaseModel):
    """Response schema for listing user's chat sessions."""

    sessions: List[ChatSessionSummary]
    total_count: int
    limit: int
    offset: int


class DeleteSessionResponse(BaseModel):
    """Response schema for session deletion."""

    success: bool
    message: str
    session_id: UUID
