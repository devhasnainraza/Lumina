from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from uuid import UUID

from db.session import get_db
from models.user import User
from models.document import Document, DocumentStatus, FileType
from models.chunk import Chunk
from schemas.document import (
    DocumentUploadResponse,
    DocumentResponse,
    DocumentList,
    DocumentDetail,
    DocumentDeleteResponse
)
from api.deps import get_current_user
from utils.file_validation import validate_file_type, validate_file_size, sanitize_filename
from utils.storage import save_uploaded_file, get_file_path
from services.ingestion import process_document, delete_document_data
from core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/docs", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a document for processing"""

    # Validate file type
    mime_type = validate_file_type(file)

    # Validate file size
    file_size = validate_file_size(file)

    # Sanitize filename
    safe_filename = sanitize_filename(file.filename)

    # Determine file type
    if mime_type == "application/pdf":
        file_type = FileType.PDF
    elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        file_type = FileType.DOCX
    elif mime_type == "text/plain":
        file_type = FileType.TXT
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type"
        )

    # Generate file path
    file_path = get_file_path(str(current_user.id), safe_filename)

    # Save file to disk
    await save_uploaded_file(file, file_path)

    # Create document record
    document = Document(
        user_id=current_user.id,
        filename=safe_filename,
        file_path=file_path,
        file_size=file_size,
        file_type=file_type,
        status=DocumentStatus.UPLOADED
    )

    db.add(document)
    await db.commit()
    await db.refresh(document)

    # Trigger background processing
    background_tasks.add_task(process_document, document.id)

    logger.info(f"Document {document.id} uploaded by user {current_user.id}")

    return DocumentUploadResponse(
        id=document.id,
        filename=document.filename,
        file_size=document.file_size,
        file_type=document.file_type,
        status=document.status,
        created_at=document.created_at
    )


@router.get("", response_model=DocumentList)
async def list_documents(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[DocumentStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all documents for the authenticated user"""

    # Build query
    query = select(Document).where(Document.user_id == current_user.id)

    if status:
        query = query.where(Document.status == status)

    query = query.order_by(Document.created_at.desc())

    # Get total count
    count_query = select(func.count()).select_from(Document).where(Document.user_id == current_user.id)
    if status:
        count_query = count_query.where(Document.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get paginated results
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    documents = result.scalars().all()

    return DocumentList(
        documents=[DocumentResponse.model_validate(doc) for doc in documents],
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/{document_id}", response_model=DocumentDetail)
async def get_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get details of a specific document"""

    # Fetch document
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Count chunks
    chunk_count_result = await db.execute(
        select(func.count()).select_from(Chunk).where(Chunk.document_id == document_id)
    )
    chunk_count = chunk_count_result.scalar()

    return DocumentDetail(
        id=document.id,
        filename=document.filename,
        file_size=document.file_size,
        file_type=document.file_type,
        status=document.status,
        created_at=document.created_at,
        processed_at=document.processed_at,
        chunk_count=chunk_count,
        error_message=document.error_message
    )


@router.delete("/{document_id}", response_model=DocumentDeleteResponse)
async def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a document and all associated data"""

    # Fetch document
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Delete document and all associated data
    deletion_info = await delete_document_data(document_id, db)

    logger.info(f"Document {document_id} deleted by user {current_user.id}")

    return DocumentDeleteResponse(
        message="Document deleted successfully",
        deleted={
            "document_id": str(document_id),
            "chunks_deleted": deletion_info["chunks_deleted"],
            "embeddings_deleted": deletion_info["embeddings_deleted"]
        }
    )
