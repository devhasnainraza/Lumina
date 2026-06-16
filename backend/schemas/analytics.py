"""Pydantic schemas for analytics API responses."""

from pydantic import BaseModel, Field
from typing import List, Dict


class UsageStats(BaseModel):
    """Usage statistics summary."""

    query_count: int = Field(ge=0, description="Total number of queries")
    document_count: int = Field(ge=0, description="Total number of documents")
    session_count: int = Field(ge=0, description="Total number of chat sessions")


class ActivityPoint(BaseModel):
    """Activity data point representing queries on a specific date."""

    date: str = Field(description="Date in YYYY-MM-DD format")
    count: int = Field(ge=0, description="Number of queries")


class DocumentTypeStats(BaseModel):
    """Breakdown of documents by file type."""

    pdf: int = Field(0, ge=0)
    docx: int = Field(0, ge=0)
    txt: int = Field(0, ge=0)


class AnalyticsResponse(BaseModel):
    """Full dashboard analytics response."""

    stats: UsageStats
    activity_timeline: List[ActivityPoint]
    document_types: DocumentTypeStats
    storage_used: int = Field(ge=0, description="Total storage used in bytes")
