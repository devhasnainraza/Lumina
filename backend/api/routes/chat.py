"""Chat API endpoints for RAG query processing."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
from uuid import UUID
import json
from datetime import datetime

from api.deps import get_current_user
from db.session import get_db
from models.user import User
from models.chat_session import ChatSession
from models.chat_message import ChatMessage
from models.document import Document, DocumentStatus
from models.chunk import Chunk
from schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatMessageResponse,
    ChatHistoryResponse,
    ChatHistoryListResponse,
    ChatSessionSummary,
    DeleteSessionResponse,
    SourceReference
)
from services.retriever import retriever
from services.context_builder import context_builder
from services.llm import llm_service
from services.memory import memory_service
from services.intent_classifier import should_retrieve_documents, classify_query_intent, get_intent_system_prompt
from core.logging import get_logger
import re

logger = get_logger(__name__)


def generate_conversation_title(first_message: str, max_length: int = 40) -> str:
    """
    Generate a short, descriptive title from the first user message.

    Args:
        first_message: The user's first message
        max_length: Maximum length for the title

    Returns:
        A concise title for the conversation
    """
    # Clean the message
    message = first_message.strip()

    # Remove common question words at the start for cleaner titles
    message = re.sub(r'^(can you |could you |please |would you |will you )', '', message, flags=re.IGNORECASE)

    # Capitalize first letter
    if message:
        message = message[0].upper() + message[1:]

    # Truncate if too long
    if len(message) > max_length:
        # Try to break at a word boundary
        truncated = message[:max_length].rsplit(' ', 1)[0]
        if len(truncated) < max_length - 10:  # If we cut too much, just use character limit
            return message[:max_length - 3] + "..."
        return truncated + "..."

    return message

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/session", response_model=ChatSessionSummary)
async def create_chat_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new empty chat session.
    """
    try:
        new_session = ChatSession(
            user_id=current_user.id,
            title="New Chat"
        )
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)
        logger.info(f"Created new empty session {new_session.id}")
        
        return ChatSessionSummary(
            id=new_session.id,
            title=new_session.title,
            created_at=new_session.created_at,
            updated_at=new_session.updated_at,
            message_count=0
        )
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create chat session"
        )


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Process a chat query with RAG (non-streaming mode).

    - Creates new session if session_id not provided
    - Retrieves relevant document chunks
    - Builds context with conversation history
    - Generates grounded response with source attribution
    - Stores user query and assistant response
    """
    try:
        # Step 1: Create or resume chat session
        if request.session_id:
            # Verify session ownership
            is_owner = await memory_service.verify_session_ownership(
                request.session_id,
                current_user.id,
                db
            )
            if not is_owner:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Session not found"
                )
            session_id = request.session_id
            logger.info(f"Resuming session {session_id}")
        else:
            # Create new session
            new_session = ChatSession(user_id=current_user.id, title="New Chat")
            db.add(new_session)
            await db.commit()
            await db.refresh(new_session)
            session_id = new_session.id
            logger.info(f"Created new session {session_id}")

        # Step 2: Generate title for sessions if it is a new session or has default/no title
        session_query = select(ChatSession).where(ChatSession.id == session_id)
        session_result = await db.execute(session_query)
        session = session_result.scalar_one_or_none()
        if session and (not session.title or session.title == "New Chat"):
            title = generate_conversation_title(request.query)
            session.title = title
            await db.commit()
            logger.info(f"Generated title for session {session_id}: {title}")

        # Step 3: Store user message
        user_message = ChatMessage(
            session_id=session_id,
            role="user",
            content=request.query,
            sources=None
        )
        db.add(user_message)
        await db.commit()

        # Step 4: Classify query intent to determine if document retrieval is needed
        query_intent = classify_query_intent(request.query)
        should_retrieve = should_retrieve_documents(request.query)

        logger.info(f"Query intent: {query_intent}, Should retrieve documents: {should_retrieve}")

        # Step 5: Retrieve relevant chunks only if needed
        chunks = []
        if should_retrieve:
            logger.info(f"Retrieving chunks for query: {request.query[:50]}...")
            logger.info(f"User ID for retrieval: {current_user.id}")

            chunks = await retriever.retrieve_relevant_chunks(
                query=request.query,
                user_id=current_user.id,
                top_k=request.top_k
            )

            logger.info(f"Retrieved {len(chunks)} chunks from vector database")

            if chunks:
                # Log first few chunks for debugging
                for i, chunk in enumerate(chunks[:3]):
                    logger.info(f"Chunk {i+1}: score={chunk.get('relevance_score', 0):.4f}, doc={chunk.get('document_name', 'Unknown')[:30]}")
            else:
                logger.warning(f"No chunks found in vector database for user {current_user.id}")

            # Filter chunks by relevance score (minimum 50% similarity)
            if chunks:
                original_count = len(chunks)
                chunks = [chunk for chunk in chunks if chunk.get('relevance_score', 0) >= 0.50]
                if len(chunks) < original_count:
                    logger.info(f"Filtered {original_count - len(chunks)} low-relevance chunks (< 50% similarity)")
                logger.info(f"Final chunk count after filtering: {len(chunks)}")

            # Smart Fallback for Summarization & General Queries when no chunks are found or query requests a summary
            query_lower = request.query.lower()
            is_summary_query = any(re.search(pat, query_lower) for pat in [
                r"\b(summarize|summary|overview|recap|outline|explain)\b",
                r"\b(what\s+is\s+in|what'?s\s+in|tell\s+me\s+about|describe)\s+(the|my|this)?\s*(document|file|paper|pdf|upload)s?\b",
                r"\b(what\s+does\s+(the|my|this)?\s*(document|file|paper|pdf|upload)\s+(say|mean|contain|include|about|show))\b",
                r"\b(what\s+is\s+(this|the|my)?\s*(document|file|paper|pdf|upload)\s+about)\b"
            ])

            if is_summary_query or not chunks:
                # Check if user has uploaded completed documents
                doc_query = select(Document).where(
                    Document.user_id == current_user.id,
                    Document.status == DocumentStatus.COMPLETED
                ).order_by(Document.updated_at.desc())
                doc_result = await db.execute(doc_query)
                completed_docs = doc_result.scalars().all()

                if completed_docs:
                    # Match filename if mentioned in query, else use the most recent
                    target_doc = None
                    for doc in completed_docs:
                        doc_name_base = doc.filename.rsplit('.', 1)[0].lower()
                        if doc_name_base in query_lower or doc.filename.lower() in query_lower:
                            target_doc = doc
                            break
                    
                    if not target_doc:
                        target_doc = completed_docs[0]

                    logger.info(f"Summarization/Fallback matched. Loading chunks directly from DB for document: {target_doc.filename}")
                    
                    # Fetch first 12 chunks directly from Postgres
                    chunk_query = select(Chunk).where(
                        Chunk.document_id == target_doc.id
                    ).order_by(Chunk.chunk_index.asc()).limit(12)
                    chunk_result = await db.execute(chunk_query)
                    db_chunks = chunk_result.scalars().all()

                    if db_chunks:
                        # Re-populate chunks with sequential chunks from the document
                        chunks = [
                            {
                                "chunk_id": str(c.id),
                                "content": c.text,
                                "document_id": str(target_doc.id),
                                "document_name": target_doc.filename,
                                "chunk_index": c.chunk_index,
                                "page_reference": f"Page {c.chunk_index + 1}",
                                "relevance_score": 1.0
                            }
                            for c in db_chunks
                        ]
                        logger.info(f"Loaded {len(chunks)} chunks directly from PostgreSQL for {target_doc.filename}")
        else:
            logger.info(f"Skipping document retrieval for {query_intent} query")

        # Step 6: Check if we have relevant context. If not, fallback to general knowledge conversation.
        if not chunks:
            if should_retrieve:
                logger.warning("No relevant chunks found - falling back to general LLM conversation")

            # Use intent-based system prompt
            system_content = get_intent_system_prompt(query_intent)

            messages = [
                {
                    "role": "system",
                    "content": system_content
                }
            ]

            if request.session_id:
                history = await memory_service.get_conversation_history(
                    session_id=session_id,
                    db=db,
                    limit=10
                )
                # Exclude the user message we just inserted (last element)
                history_messages = history[:-1] if len(history) > 1 else []
                for msg in history_messages:
                    messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })

            messages.append({
                "role": "user",
                "content": request.query
            })

            context = {
                "messages": messages,
                "sources": []
            }
        else:
            # Step 7: Get conversation history for RAG context
            conversation_history = None
            if request.session_id:
                history = await memory_service.get_conversation_history(
                    session_id=session_id,
                    db=db,
                    limit=10  # Last 10 messages
                )
                # Exclude the current user message we just added
                conversation_history = history[:-1] if len(history) > 1 else None

            # Step 8: Build context using retrieved document chunks
            logger.info("Building context with chunks and history")
            context = context_builder.build_context(
                query=request.query,
                context_chunks=chunks,
                conversation_history=conversation_history
            )


        # Step 9: Generate response
        api_key = current_user.gemini_api_key

        if request.stream:
            # Return streaming response
            return StreamingResponse(
                stream_chat_response(
                    session_id=session_id,
                    messages=context["messages"],
                    sources=context["sources"],
                    db=db,
                    api_key=api_key,
                    model_name=request.model,
                    temperature=request.temperature
                ),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache, no-transform",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",
                }
            )
        else:
            # Generate non-streaming response
            logger.info("Generating response with LLM")
            response_text = await llm_service.generate_response(
                messages=context["messages"],
                api_key=api_key,
                model_name=request.model,
                temperature=request.temperature
            )

            # Step 10: Store assistant response
            assistant_message = ChatMessage(
                session_id=session_id,
                role="assistant",
                content=response_text,
                sources=context["sources"]
            )
            db.add(assistant_message)
            await db.commit()
            await db.refresh(assistant_message)

            # Step 11: Update session timestamp
            session_query = select(ChatSession).where(ChatSession.id == session_id)
            session_result = await db.execute(session_query)
            session = session_result.scalar_one_or_none()
            if session:
                session.updated_at = datetime.utcnow()
                await db.commit()
            else:
                logger.warning(f"Session {session_id} not found during timestamp update")
                await db.commit()  # Still commit the assistant message

            logger.info(f"Chat completed for session {session_id}")

            return ChatResponse(
                session_id=session_id,
                message=ChatMessageResponse(
                    id=assistant_message.id,
                    role=assistant_message.role,
                    content=assistant_message.content,
                    sources=[SourceReference(**src) for src in context["sources"]],
                    created_at=assistant_message.created_at
                )
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat processing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat query: {str(e)}"
        )


async def stream_chat_response(
    session_id: UUID,
    messages: List[dict],
    sources: List[dict],
    db: AsyncSession,
    api_key: str = None,
    model_name: str = None,
    temperature: float = None
):
    """
    Stream chat response as Server-Sent Events.

    Yields:
        SSE formatted events with tokens and final sources
    """
    accumulated_response = ""

    try:
        # Stream tokens
        async for token in llm_service.generate_streaming_response(
            messages,
            api_key=api_key,
            model_name=model_name,
            temperature=temperature
        ):
            accumulated_response += token

            # Send token event
            event_data = json.dumps({
                "type": "token",
                "content": token
            })
            yield f"data: {event_data}\n\n"

        # Store complete response in database
        assistant_message = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=accumulated_response,
            sources=sources
        )
        db.add(assistant_message)

        # Update session timestamp in same transaction
        session_query = select(ChatSession).where(ChatSession.id == session_id)
        session_result = await db.execute(session_query)
        session = session_result.scalar_one_or_none()
        if session:
            session.updated_at = datetime.utcnow()

        # Single commit for both operations
        await db.commit()
        await db.refresh(assistant_message)

        # Send completion event with sources
        done_data = json.dumps({
            "type": "done",
            "sources": sources,
            "message_id": str(assistant_message.id),
            "session_id": str(session_id),
            "sessionId": str(session_id)
        })
        yield f"data: {done_data}\n\n"

        logger.info(f"Streaming completed for session {session_id}")

    except Exception as e:
        logger.error(f"Streaming failed: {e}")
        error_data = json.dumps({
            "type": "error",
            "message": "Streaming generation failed"
        })
        yield f"data: {error_data}\n\n"


@router.get("/history", response_model=ChatHistoryListResponse)
async def list_chat_sessions(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List user's chat sessions with pagination.

    Returns sessions ordered by most recent activity.
    """
    try:
        # Get sessions
        sessions = await memory_service.get_recent_sessions(
            user_id=current_user.id,
            db=db,
            limit=limit,
            offset=offset
        )

        # Get message counts for each session
        session_summaries = []
        for session in sessions:
            message_count = await memory_service.get_session_message_count(
                session_id=session.id,
                db=db
            )

            session_summaries.append(
                ChatSessionSummary(
                    id=session.id,
                    title=session.title,
                    created_at=session.created_at,
                    updated_at=session.updated_at,
                    message_count=message_count
                )
            )

        # Get total count
        total_count = await memory_service.count_user_sessions(
            user_id=current_user.id,
            db=db
        )

        return ChatHistoryListResponse(
            sessions=session_summaries,
            total_count=total_count,
            limit=limit,
            offset=offset
        )

    except Exception as e:
        logger.error(f"Failed to list sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat sessions"
        )


@router.get("/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    session_id: UUID,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve full conversation history for a session.

    Returns messages ordered chronologically.
    """
    try:
        # Verify session ownership
        is_owner = await memory_service.verify_session_ownership(
            session_id=session_id,
            user_id=current_user.id,
            db=db
        )

        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        # Get messages
        query = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(limit)
            .offset(offset)
        )

        result = await db.execute(query)
        messages = result.scalars().all()

        # Get total count
        total_count = await memory_service.get_session_message_count(
            session_id=session_id,
            db=db
        )

        message_responses = [
            ChatMessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                sources=[SourceReference(**src) for src in (msg.sources or [])],
                created_at=msg.created_at
            )
            for msg in messages
        ]

        return ChatHistoryResponse(
            session_id=session_id,
            messages=message_responses,
            total_count=total_count,
            limit=limit,
            offset=offset
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve chat history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat history"
        )


@router.delete("/{session_id}", response_model=DeleteSessionResponse)
async def delete_chat_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a chat session and all its messages.

    Cascade delete removes all associated messages.
    """
    try:
        # Verify session ownership
        is_owner = await memory_service.verify_session_ownership(
            session_id=session_id,
            user_id=current_user.id,
            db=db
        )

        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        # Delete session (cascade deletes messages)
        await db.execute(
            delete(ChatSession).where(
                ChatSession.id == session_id,
                ChatSession.user_id == current_user.id
            )
        )
        await db.commit()

        logger.info(f"Deleted session {session_id}")

        return DeleteSessionResponse(
            success=True,
            message="Session deleted successfully",
            session_id=session_id
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete session"
        )
