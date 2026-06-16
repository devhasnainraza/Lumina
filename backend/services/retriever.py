"""Retriever service for RAG query processing."""

from typing import List, Dict, Any, Optional
from uuid import UUID
from core.config import settings
from core.logging import get_logger
from services.embedder import generate_embedding
from services.vector_store import search_similar

logger = get_logger(__name__)


class Retriever:
    """Handles vector search and chunk retrieval for RAG queries."""

    def __init__(
        self,
        top_k: int = None,
        min_relevance_score: float = None
    ):
        """
        Initialize retriever with configuration.

        Args:
            top_k: Number of chunks to retrieve (default from settings)
            min_relevance_score: Minimum relevance threshold (default from settings)
        """
        self.top_k = top_k or settings.TOP_K
        self.min_relevance_score = min_relevance_score or settings.MIN_RELEVANCE_SCORE

    async def retrieve_relevant_chunks(
        self,
        query: str,
        user_id: UUID,
        top_k: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant document chunks for a query.

        Args:
            query: User's question
            user_id: User ID for multi-tenant isolation
            top_k: Optional override for the number of chunks to retrieve

        Returns:
            List of relevant chunks with metadata and relevance scores
        """
        try:
            # Step 1: Generate query embedding using Gemini
            logger.info(f"Generating embedding for query: {query[:50]}...")
            query_embedding = await generate_embedding(query)

            # Step 2: Search vector database with user isolation
            limit_k = top_k or self.top_k
            logger.info(f"Searching vector DB for user {user_id}, top_k={limit_k}")
            results = search_similar(
                query_embedding=query_embedding,
                user_id=str(user_id),
                n_results=limit_k
            )

            # Step 3: Process and filter results
            chunks = self._process_search_results(results)

            # Step 4: Filter by relevance score
            filtered_chunks = [
                chunk for chunk in chunks
                if chunk["relevance_score"] >= self.min_relevance_score
            ]

            logger.info(
                f"Retrieved {len(filtered_chunks)} chunks "
                f"(filtered from {len(chunks)} by relevance >= {self.min_relevance_score})"
            )

            return filtered_chunks

        except Exception as e:
            logger.error(f"Retrieval failed: {e}")
            raise ValueError(f"Failed to retrieve relevant chunks: {str(e)}")

    def _process_search_results(self, results: Dict) -> List[Dict[str, Any]]:
        """
        Process ChromaDB search results into structured chunks.

        Args:
            results: Raw results from ChromaDB query

        Returns:
            List of processed chunk dictionaries
        """
        chunks = []

        if not results or not results.get("ids") or not results["ids"][0]:
            logger.warning("No results returned from vector search")
            return chunks

        # ChromaDB returns results as lists within lists
        ids = results["ids"][0]
        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0]

        for idx, (chunk_id, content, metadata, distance) in enumerate(
            zip(ids, documents, metadatas, distances)
        ):
            # Convert distance to similarity score (ChromaDB uses L2 distance)
            # Lower distance = higher similarity
            # Convert to 0-1 scale where 1 is most similar
            relevance_score = 1.0 / (1.0 + distance)

            chunk = {
                "chunk_id": chunk_id,
                "content": content,
                "document_id": metadata.get("document_id"),
                "document_name": metadata.get("document_name", "Unknown Document"),
                "chunk_index": metadata.get("chunk_index", idx),
                "page_reference": metadata.get("page_reference"),
                "relevance_score": round(relevance_score, 4)
            }

            chunks.append(chunk)

        return chunks


# Global retriever instance
retriever = Retriever()
