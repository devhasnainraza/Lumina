from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from uuid import UUID

from models.document import Document, DocumentStatus, FileType
from models.chunk import Chunk
from services.parser import parse_document
from services.chunker import chunk_text
from services.embedder import generate_embeddings
from services.vector_store import insert_embeddings, delete_embeddings
from core.logging import get_logger

logger = get_logger(__name__)


async def process_document(document_id: UUID, db: Optional[AsyncSession] = None) -> None:
    """
    Process a document through the full ingestion pipeline:
    1. Parse document to extract text
    2. Chunk text into segments
    3. Generate embeddings
    4. Store chunks and embeddings

    This function is called as a background task after document upload.
    """
    db_provided = db is not None
    if not db_provided:
        from db.session import AsyncSessionLocal
        db = AsyncSessionLocal()

    try:
        # Fetch document
        result = await db.execute(select(Document).where(Document.id == document_id))
        document = result.scalar_one_or_none()

        if not document:
            logger.error(f"Document {document_id} not found")
            return

        # Update status to processing
        document.status = DocumentStatus.PROCESSING
        await db.commit()

        logger.info(f"Starting processing for document {document_id}")

        # Step 1: Parse document
        try:
            text = parse_document(document.file_path, document.file_type.value)
            logger.info(f"Extracted {len(text)} characters from document {document_id}")
        except Exception as e:
            raise ValueError(f"Text extraction failed: {str(e)}")

        # Step 2: Chunk text
        try:
            chunks = chunk_text(text)
            logger.info(f"Created {len(chunks)} chunks from document {document_id}")
        except Exception as e:
            raise ValueError(f"Text chunking failed: {str(e)}")

        # Step 3: Generate embeddings
        try:
            chunk_texts = [chunk[0] for chunk in chunks]
            embeddings = await generate_embeddings(chunk_texts)
            logger.info(f"Generated {len(embeddings)} embeddings for document {document_id}")
        except Exception as e:
            raise ValueError(f"Embedding generation failed: {str(e)}")

        # Step 4: Store chunks in database
        try:
            chunk_records = []
            for idx, (chunk_txt, token_count) in enumerate(chunks):
                chunk_record = Chunk(
                    document_id=document.id,
                    chunk_index=idx,
                    text=chunk_txt,
                    token_count=token_count
                )
                chunk_records.append(chunk_record)
                db.add(chunk_record)

            await db.commit()

            # Refresh to get IDs
            for chunk_record in chunk_records:
                await db.refresh(chunk_record)

            logger.info(f"Stored {len(chunk_records)} chunks in database")
        except Exception as e:
            raise ValueError(f"Database storage failed: {str(e)}")

        # Step 5: Store embeddings in vector database
        try:
            chunk_ids = [str(chunk.id) for chunk in chunk_records]
            metadatas = [
                {
                    "user_id": str(document.user_id),
                    "document_id": str(document.id),
                    "chunk_index": chunk.chunk_index,
                    "document_name": document.filename  # Changed from document_filename to document_name
                }
                for chunk in chunk_records
            ]

            insert_embeddings(
                chunk_ids=chunk_ids,
                embeddings=embeddings,
                texts=chunk_texts,
                metadatas=metadatas
            )

            logger.info(f"Stored {len(embeddings)} embeddings in vector database")
        except Exception as e:
            raise ValueError(f"Vector storage failed: {str(e)}")

        # Update document status to completed
        document.status = DocumentStatus.COMPLETED
        document.error_message = None
        document.processed_at = datetime.utcnow()
        await db.commit()

        logger.info(f"Successfully processed document {document_id}")

    except Exception as e:
        logger.error(f"Document processing failed for {document_id}: {e}")

        # Update document status to failed
        try:
            result = await db.execute(select(Document).where(Document.id == document_id))
            document = result.scalar_one_or_none()
            if document:
                document.status = DocumentStatus.FAILED
                document.error_message = str(e)
                document.processed_at = datetime.utcnow()
                await db.commit()
        except Exception as db_error:
            logger.error(f"Failed to update document status: {db_error}")
    finally:
        if not db_provided:
            await db.close()


async def delete_document_data(document_id: UUID, db: AsyncSession) -> dict:
    """
    Delete all data associated with a document:
    - Chunks from database (cascade deletes chunks)
    - Embeddings from vector database
    - File from filesystem

    Returns:
        Dictionary with deletion counts
    """
    from utils.storage import delete_file

    # Fetch document
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()

    if not document:
        return {"chunks_deleted": 0, "embeddings_deleted": 0}

    # Count chunks before deletion
    chunk_result = await db.execute(
        select(Chunk).where(Chunk.document_id == document_id)
    )
    chunks = chunk_result.scalars().all()
    chunk_count = len(chunks)

    # Delete embeddings from vector database
    embeddings_deleted = delete_embeddings(str(document_id))

    # Delete file from filesystem
    delete_file(document.file_path)

    # Delete document (cascades to chunks)
    await db.delete(document)
    await db.commit()

    logger.info(f"Deleted document {document_id} with {chunk_count} chunks and {embeddings_deleted} embeddings")

    return {
        "chunks_deleted": chunk_count,
        "embeddings_deleted": embeddings_deleted
    }
