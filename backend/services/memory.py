"""Memory service for managing conversation history."""

from typing import List, Dict, Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from models.chat_message import ChatMessage
from models.chat_session import ChatSession
from core.logging import get_logger

logger = get_logger(__name__)


class MemoryService:
    """Manages conversation history retrieval and context window management."""

    async def get_conversation_history(
        self,
        session_id: UUID,
        db: AsyncSession,
        limit: Optional[int] = None
    ) -> List[Dict[str, str]]:
        """
        Retrieve conversation history for a session.

        Args:
            session_id: Chat session ID
            db: Database session
            limit: Optional limit on number of messages (most recent)

        Returns:
            List of message dicts with 'role' and 'content' (chronologically ordered)
        """
        try:
            if limit:
                # Get most recent N messages by ordering desc, limiting, then reversing
                query = (
                    select(ChatMessage)
                    .where(ChatMessage.session_id == session_id)
                    .order_by(ChatMessage.created_at.desc())
                    .limit(limit)
                )
                result = await db.execute(query)
                messages = list(reversed(result.scalars().all()))
            else:
                # Get all messages in chronological order
                query = (
                    select(ChatMessage)
                    .where(ChatMessage.session_id == session_id)
                    .order_by(ChatMessage.created_at.asc())
                )
                result = await db.execute(query)
                messages = result.scalars().all()

            history = [
                {
                    "role": msg.role,
                    "content": msg.content
                }
                for msg in messages
            ]

            logger.info(f"Retrieved {len(history)} messages for session {session_id}")
            return history

        except Exception as e:
            logger.error(f"Failed to retrieve conversation history: {e}")
            raise ValueError(f"Failed to retrieve conversation history: {str(e)}")

    async def get_session_message_count(
        self,
        session_id: UUID,
        db: AsyncSession
    ) -> int:
        """
        Get the number of messages in a session.

        Args:
            session_id: Chat session ID
            db: Database session

        Returns:
            Number of messages
        """
        try:
            query = select(func.count(ChatMessage.id)).where(
                ChatMessage.session_id == session_id
            )
            result = await db.execute(query)
            count = result.scalar()
            return count or 0

        except Exception as e:
            logger.error(f"Failed to count messages: {e}")
            return 0

    async def verify_session_ownership(
        self,
        session_id: UUID,
        user_id: UUID,
        db: AsyncSession
    ) -> bool:
        """
        Verify that a session belongs to a user.

        Args:
            session_id: Chat session ID
            user_id: User ID
            db: Database session

        Returns:
            True if session belongs to user, False otherwise
        """
        try:
            query = select(ChatSession).where(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id
            )
            result = await db.execute(query)
            session = result.scalar_one_or_none()

            return session is not None

        except Exception as e:
            logger.error(f"Failed to verify session ownership: {e}")
            return False

    async def get_recent_sessions(
        self,
        user_id: UUID,
        db: AsyncSession,
        limit: int = 20,
        offset: int = 0
    ) -> List[ChatSession]:
        """
        Get user's recent chat sessions.

        Args:
            user_id: User ID
            db: Database session
            limit: Maximum number of sessions to return
            offset: Number of sessions to skip

        Returns:
            List of ChatSession objects
        """
        try:
            query = (
                select(ChatSession)
                .where(ChatSession.user_id == user_id)
                .order_by(ChatSession.updated_at.desc())
                .limit(limit)
                .offset(offset)
            )

            result = await db.execute(query)
            sessions = result.scalars().all()

            logger.info(f"Retrieved {len(sessions)} sessions for user {user_id}")
            return sessions

        except Exception as e:
            logger.error(f"Failed to retrieve sessions: {e}")
            raise ValueError(f"Failed to retrieve sessions: {str(e)}")

    async def count_user_sessions(
        self,
        user_id: UUID,
        db: AsyncSession
    ) -> int:
        """
        Count total number of sessions for a user.

        Args:
            user_id: User ID
            db: Database session

        Returns:
            Number of sessions
        """
        try:
            query = select(func.count(ChatSession.id)).where(
                ChatSession.user_id == user_id
            )
            result = await db.execute(query)
            count = result.scalar()
            return count or 0

        except Exception as e:
            logger.error(f"Failed to count sessions: {e}")
            return 0


# Global memory service instance
memory_service = MemoryService()
