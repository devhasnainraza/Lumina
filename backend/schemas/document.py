from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional, List
from models.document import DocumentStatus, FileType


class DocumentResponse(BaseModel):
    """Response schema for document data"""
    id: UUID
    filename: str
    file_size: int
    file_type: FileType
    status: DocumentStatus
    created_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    """Response schema for document upload"""
    id: UUID
    filename: str
    file_size: int
    file_type: FileType
    status: DocumentStatus
    created_at: datetime
    message: str = "Document uploaded successfully. Processing has started."

    class Config:
        from_attributes = True


class DocumentDetail(BaseModel):
    """Detailed response schema for document with chunk count"""
    id: UUID
    filename: str
    file_size: int
    file_type: FileType
    status: DocumentStatus
    created_at: datetime
    processed_at: Optional[datetime] = None
    chunk_count: int
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentList(BaseModel):
    """Response schema for document list"""
    documents: List[DocumentResponse]
    total: int
    limit: int
    offset: int


class DocumentDeleteResponse(BaseModel):
    """Response schema for document deletion"""
    message: str = "Document deleted successfully"
    deleted: dict
