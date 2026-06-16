"""Prompt template management for RAG system."""

from typing import List, Dict, Any, Optional


class PromptManager:
    """Manages structured prompt templates for RAG queries."""

    SYSTEM_PROMPT = """You are a helpful AI assistant that answers questions based on provided context from documents.

IMPORTANT RULES:
1. Answer ONLY using information from the Context section below
2. If the context doesn't contain enough information to answer the question, say "I don't have enough information in the uploaded documents to answer that question."
3. When citing sources, use ONLY the exact format shown in the context (e.g., [Source 1], [Source 1, Page 1]).
4. NEVER add document names or "Unknown Document" to citations - only use Source numbers and page references
5. Be concise and accurate
6. Do not make up or infer information that isn't explicitly stated in the context
7. If asked about something unrelated to the documents, politely explain that you can only answer questions about the uploaded documents"""

    @staticmethod
    def build_rag_prompt(
        query: str,
        context_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Build a complete RAG prompt with context and optional conversation history.

        Args:
            query: User's question
            context_chunks: List of retrieved chunks with metadata
            conversation_history: Optional list of previous messages

        Returns:
            Formatted prompt string
        """
        prompt_parts = []

        # System instructions
        prompt_parts.append(PromptManager.SYSTEM_PROMPT)
        prompt_parts.append("\n" + "="*80 + "\n")

        # Context section
        if context_chunks:
            prompt_parts.append("CONTEXT FROM DOCUMENTS:\n")
            # Document mapping to map Source indexes to filenames
            prompt_parts.append("Document Source Mapping:\n")
            seen_docs = {}
            for idx, chunk in enumerate(context_chunks, 1):
                doc_name = chunk.get("document_name", "Unknown Document")
                if doc_name not in seen_docs:
                    seen_docs[doc_name] = []
                seen_docs[doc_name].append(idx)
            for doc_name, indices in seen_docs.items():
                indices_str = ", ".join(f"Source {i}" for i in indices)
                prompt_parts.append(f"- Document \"{doc_name}\" corresponds to: {indices_str}\n")
            prompt_parts.append("\n")

            for idx, chunk in enumerate(context_chunks, 1):
                page_ref = chunk.get("page_reference", "")
                content = chunk.get("content", "")

                # Build source label without showing document name if unknown
                if page_ref:
                    prompt_parts.append(f"\n[Source {idx}, {page_ref}]\n")
                else:
                    prompt_parts.append(f"\n[Source {idx}]\n")
                prompt_parts.append(content)
                prompt_parts.append("\n")
        else:
            prompt_parts.append("CONTEXT: No relevant documents found.\n")

        prompt_parts.append("\n" + "="*80 + "\n")

        # Conversation history
        if conversation_history:
            prompt_parts.append("CONVERSATION HISTORY:\n")
            for msg in conversation_history:
                role = msg.get("role", "").upper()
                content = msg.get("content", "")
                prompt_parts.append(f"{role}: {content}\n")
            prompt_parts.append("\n" + "="*80 + "\n")

        # Current query
        prompt_parts.append(f"USER QUESTION: {query}\n\n")
        prompt_parts.append("ASSISTANT RESPONSE (with source citations):")

        return "".join(prompt_parts)

    @staticmethod
    def build_chat_messages(
        query: str,
        context_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> List[Dict[str, str]]:
        """
        Build chat messages in the format expected by LangChain/Gemini.

        Args:
            query: User's question
            context_chunks: List of retrieved chunks with metadata
            conversation_history: Optional list of previous messages

        Returns:
            List of message dicts with 'role' and 'content'
        """
        messages = []

        # System message with context
        context_text = PromptManager._format_context(context_chunks)
        system_content = f"{PromptManager.SYSTEM_PROMPT}\n\n{context_text}"

        messages.append({
            "role": "system",
            "content": system_content
        })

        # Add conversation history
        if conversation_history:
            for msg in conversation_history:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

        # Add current query
        messages.append({
            "role": "user",
            "content": query
        })

        return messages

    @staticmethod
    def _format_context(context_chunks: List[Dict[str, Any]]) -> str:
        """
        Format context chunks into a readable string.

        Args:
            context_chunks: List of retrieved chunks with metadata

        Returns:
            Formatted context string
        """
        if not context_chunks:
            return "CONTEXT: No relevant documents found."

        parts = ["CONTEXT FROM DOCUMENTS:\n"]
        
        # Document mapping to map Source indexes to filenames
        parts.append("Document Source Mapping:\n")
        seen_docs = {}
        for idx, chunk in enumerate(context_chunks, 1):
            doc_name = chunk.get("document_name", "Unknown Document")
            if doc_name not in seen_docs:
                seen_docs[doc_name] = []
            seen_docs[doc_name].append(idx)
        for doc_name, indices in seen_docs.items():
            indices_str = ", ".join(f"Source {i}" for i in indices)
            parts.append(f"- Document \"{doc_name}\" corresponds to: {indices_str}\n")
        parts.append("\n")

        for idx, chunk in enumerate(context_chunks, 1):
            page_ref = chunk.get("page_reference", "")
            content = chunk.get("content", "")

            # Build simple source label without document name
            if page_ref:
                parts.append(f"\n[Source {idx}, {page_ref}]\n")
            else:
                parts.append(f"\n[Source {idx}]\n")
            parts.append(content)
            parts.append("\n")

        return "".join(parts)

    @staticmethod
    def extract_sources_from_chunks(
        context_chunks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Extract source references from context chunks.

        Args:
            context_chunks: List of retrieved chunks with metadata

        Returns:
            List of source reference dicts
        """
        sources = []

        for chunk in context_chunks:
            source = {
                "document_id": chunk.get("document_id"),
                "document_name": chunk.get("document_name", "Unknown"),
                "chunk_index": chunk.get("chunk_index", 0),
                "page_reference": chunk.get("page_reference"),
                "relevance_score": chunk.get("relevance_score", 0.0)
            }
            sources.append(source)

        return sources


# Global prompt manager instance
prompt_manager = PromptManager()
