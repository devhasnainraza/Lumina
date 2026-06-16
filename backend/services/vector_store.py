import chromadb
from typing import List, Dict, Optional
from uuid import UUID
from core.config import settings as app_settings
from core.logging import get_logger

logger = get_logger(__name__)

# Collection name
COLLECTION_NAME = "document_chunks"

# Lazy-loaded ChromaDB client (only initialized on first use)
_chroma_client = None


def _get_client():
    """Get or initialize the ChromaDB client (lazy initialization)."""
    global _chroma_client
    if _chroma_client is None:
        logger.info(f"Initializing ChromaDB client at: {app_settings.VECTOR_DB_PATH}")
        import os
        os.makedirs(app_settings.VECTOR_DB_PATH, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(
            path=app_settings.VECTOR_DB_PATH,
        )
        logger.info("ChromaDB client initialized successfully")
    return _chroma_client


def initialize_collection():
    """Initialize or get the ChromaDB collection"""
    try:
        client = _get_client()
        collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"description": "Document chunks with embeddings"}
        )
        logger.info(f"Initialized collection: {COLLECTION_NAME}")
        return collection
    except Exception as e:
        logger.error(f"Failed to initialize collection: {e}")
        raise


def insert_embeddings(
    chunk_ids: List[str],
    embeddings: List[List[float]],
    texts: List[str],
    metadatas: List[Dict]
) -> None:
    """
    Insert embeddings into ChromaDB

    Args:
        chunk_ids: List of chunk IDs (as strings)
        embeddings: List of embedding vectors
        texts: List of chunk texts
        metadatas: List of metadata dicts (must include user_id, document_id, chunk_index)
    """
    try:
        collection = initialize_collection()

        collection.add(
            ids=chunk_ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )

        logger.info(f"Inserted {len(chunk_ids)} embeddings into vector store")

    except Exception as e:
        logger.error(f"Failed to insert embeddings: {e}")
        raise ValueError(f"Vector store insertion failed: {str(e)}")


def delete_embeddings(document_id: str) -> int:
    """
    Delete all embeddings for a document

    Args:
        document_id: Document ID

    Returns:
        Number of embeddings deleted
    """
    try:
        collection = initialize_collection()

        # Query for all chunks with this document_id
        results = collection.get(
            where={"document_id": document_id}
        )

        if results and results['ids']:
            collection.delete(ids=results['ids'])
            count = len(results['ids'])
            logger.info(f"Deleted {count} embeddings for document {document_id}")
            return count

        return 0

    except Exception as e:
        logger.error(f"Failed to delete embeddings: {e}")
        raise ValueError(f"Vector store deletion failed: {str(e)}")


def search_similar(
    query_embedding: List[float],
    user_id: str,
    n_results: int = 5
) -> Dict:
    """
    Search for similar chunks using vector similarity

    Args:
        query_embedding: Query embedding vector
        user_id: User ID for filtering (multi-tenant isolation)
        n_results: Number of results to return

    Returns:
        Dictionary with ids, documents, metadatas, distances
    """
    try:
        collection = initialize_collection()

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where={"user_id": user_id}  # Filter by user for multi-tenant isolation
        )

        logger.info(f"Found {len(results['ids'][0])} similar chunks for user {user_id}")
        return results

    except Exception as e:
        logger.error(f"Failed to search similar chunks: {e}")
        raise ValueError(f"Vector search failed: {str(e)}")
