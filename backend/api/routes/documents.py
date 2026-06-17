import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
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
    DocumentDeleteResponse,
    ChunkResponse,
    DocumentRenameRequest
)
from api.deps import get_current_user
from utils.file_validation import validate_file_type, validate_file_size, sanitize_filename
from utils.storage import save_uploaded_file, get_file_path
from services.ingestion import process_document, delete_document_data
from services.vector_store import update_document_name_in_embeddings
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


@router.get("/{document_id}/chunks", response_model=List[ChunkResponse])
async def get_document_chunks(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get text chunks of a specific document"""
    # Fetch document and verify ownership
    doc_result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
    )
    document = doc_result.scalar_one_or_none()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Fetch chunks
    chunks_result = await db.execute(
        select(Chunk)
        .where(Chunk.document_id == document_id)
        .order_by(Chunk.chunk_index.asc())
    )
    chunks = chunks_result.scalars().all()
    return chunks


@router.get("/{document_id}/view")
async def view_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """View / stream the original uploaded document file"""
    # Fetch document and verify ownership
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

    file_path = document.file_path
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on storage"
        )

    # Determine media type
    media_type = "application/octet-stream"
    if document.file_type == FileType.PDF:
        media_type = "application/pdf"
    elif document.file_type == FileType.TXT:
        media_type = "text/plain"
    elif document.file_type == FileType.DOCX:
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    # Serve as inline response
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=document.filename,
        headers={"Content-Disposition": f'inline; filename="{document.filename}"'}
    )


@router.patch("/{document_id}/rename", response_model=DocumentResponse)
async def rename_document(
    document_id: UUID,
    payload: DocumentRenameRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Rename a document and update its metadata in vector database"""
    # Fetch document and verify ownership
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

    # Sanitize new filename
    safe_filename = sanitize_filename(payload.filename)
    if not safe_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )

    # Keep original extension to avoid file type mismatches
    original_ext = os.path.splitext(document.filename)[1].lower()
    new_ext = os.path.splitext(safe_filename)[1].lower()

    if original_ext != new_ext:
        safe_filename = os.path.splitext(safe_filename)[0] + original_ext

    old_filename = document.filename
    document.filename = safe_filename

    # Sync filename change to ChromaDB chunks
    update_document_name_in_embeddings(str(document_id), safe_filename)

    await db.commit()
    await db.refresh(document)

    logger.info(f"Document {document_id} renamed from '{old_filename}' to '{safe_filename}' by user {current_user.id}")

    return document


