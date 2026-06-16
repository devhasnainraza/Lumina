"""Context builder service for assembling RAG prompts."""

from typing import List, Dict, Any, Optional
from core.config import settings
from core.logging import get_logger
from utils.token_counter import token_counter
from services.prompt_manager import prompt_manager

logger = get_logger(__name__)


class ContextBuilder:
    """Builds context for RAG queries with token budget management."""

    def __init__(
        self,
        max_context_tokens: int = None,
        max_response_tokens: int = None
    ):
        """
        Initialize context builder with token limits.

        Args:
            max_context_tokens: Maximum tokens for full context (default from settings)
            max_response_tokens: Maximum tokens for response (default from settings)
        """
        self.max_context_tokens = max_context_tokens or settings.MAX_CONTEXT_TOKENS
        self.max_response_tokens = max_response_tokens or settings.MAX_RESPONSE_TOKENS

    def build_context(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Build complete context for RAG query with token budget management.

        Args:
            query: User's question
            context_chunks: Retrieved document chunks
            conversation_history: Optional previous messages

        Returns:
            Dictionary with prompt, messages, and metadata
        """
        try:
            # Calculate token budgets
            system_prompt_tokens = token_counter.count_tokens(
                prompt_manager.SYSTEM_PROMPT
            )
            query_tokens = token_counter.count_tokens(query)

            # Reserve tokens for response
            available_tokens = (
                self.max_context_tokens
                - system_prompt_tokens
                - query_tokens
                - self.max_response_tokens
            )

            logger.info(
                f"Token budget: system={system_prompt_tokens}, "
                f"query={query_tokens}, available={available_tokens}"
            )

            # Allocate tokens between context chunks and history
            # Priority: context chunks (70%), conversation history (30%)
            context_budget = int(available_tokens * 0.7)
            history_budget = int(available_tokens * 0.3)

            # Truncate context chunks to fit budget
            truncated_chunks = self._truncate_chunks(context_chunks, context_budget)

            # Truncate conversation history to fit budget
            truncated_history = None
            if conversation_history:
                truncated_history = self._truncate_history(
                    conversation_history,
                    history_budget
                )

            # Build final prompt
            prompt = prompt_manager.build_rag_prompt(
                query=query,
                context_chunks=truncated_chunks,
                conversation_history=truncated_history
            )

            # Build chat messages format for LangChain
            messages = prompt_manager.build_chat_messages(
                query=query,
                context_chunks=truncated_chunks,
                conversation_history=truncated_history
            )

            # Calculate actual token usage
            total_tokens = token_counter.count_tokens(prompt)

            logger.info(
                f"Context built: {len(truncated_chunks)} chunks, "
                f"{len(truncated_history) if truncated_history else 0} history messages, "
                f"{total_tokens} tokens"
            )

            return {
                "prompt": prompt,
                "messages": messages,
                "chunks_used": len(truncated_chunks),
                "history_messages_used": len(truncated_history) if truncated_history else 0,
                "total_tokens": total_tokens,
                "sources": prompt_manager.extract_sources_from_chunks(truncated_chunks)
            }

        except Exception as e:
            logger.error(f"Context building failed: {e}")
            raise ValueError(f"Failed to build context: {str(e)}")

    def _truncate_chunks(
        self,
        chunks: List[Dict[str, Any]],
        token_budget: int
    ) -> List[Dict[str, Any]]:
        """
        Truncate chunks to fit within token budget.

        Args:
            chunks: List of retrieved chunks
            token_budget: Maximum tokens allowed

        Returns:
            Truncated list of chunks
        """
        if not chunks:
            return []

        truncated = []
        tokens_used = 0

        for chunk in chunks:
            content = chunk.get("content", "")
            chunk_tokens = token_counter.count_tokens(content)

            # Add metadata overhead (source citation)
            metadata_overhead = 50  # Approximate tokens for source citation

            if tokens_used + chunk_tokens + metadata_overhead <= token_budget:
                truncated.append(chunk)
                tokens_used += chunk_tokens + metadata_overhead
            else:
                # Try to fit a truncated version of this chunk
                remaining_budget = token_budget - tokens_used - metadata_overhead
                if remaining_budget > 100:  # Only if we have meaningful space
                    truncated_content = token_counter.truncate_to_token_limit(
                        content,
                        remaining_budget
                    )
                    truncated_chunk = chunk.copy()
                    truncated_chunk["content"] = truncated_content + "..."
                    truncated.append(truncated_chunk)
                break

        logger.info(
            f"Truncated chunks: {len(chunks)} -> {len(truncated)} "
            f"({tokens_used}/{token_budget} tokens)"
        )

        return truncated

    def _truncate_history(
        self,
        history: List[Dict[str, str]],
        token_budget: int
    ) -> List[Dict[str, str]]:
        """
        Truncate conversation history to fit within token budget.
        Keeps most recent messages.

        Args:
            history: List of previous messages
            token_budget: Maximum tokens allowed

        Returns:
            Truncated list of messages (most recent)
        """
        if not history:
            return []

        truncated = []
        tokens_used = 0

        # Process from most recent backward
        for message in reversed(history):
            message_tokens = token_counter.count_tokens(message.get("content", ""))

            if tokens_used + message_tokens <= token_budget:
                truncated.insert(0, message)  # Insert at beginning to maintain order
                tokens_used += message_tokens
            else:
                break

        logger.info(
            f"Truncated history: {len(history)} -> {len(truncated)} messages "
            f"({tokens_used}/{token_budget} tokens)"
        )

        return truncated


# Global context builder instance
context_builder = ContextBuilder()
