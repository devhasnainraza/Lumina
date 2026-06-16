"""Analytics API endpoints for RAG chatbot usage tracking."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta
from typing import List

from api.deps import get_current_user
from db.session import get_db
from models.user import User
from models.document import Document
from models.chat_session import ChatSession
from models.chat_message import ChatMessage
from schemas.analytics import AnalyticsResponse, UsageStats, ActivityPoint, DocumentTypeStats
from core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=AnalyticsResponse)
async def get_dashboard_analytics(
    period: str = Query("7d", regex="^(7d|30d)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard analytics metrics for the current user.
    Calculates query usage, document metrics, storage usage, and activity.
    """
    try:
        # 1. Total Sessions
        sessions_query = select(func.count(ChatSession.id)).where(
            ChatSession.user_id == current_user.id
        )
        sessions_result = await db.execute(sessions_query)
        session_count = sessions_result.scalar() or 0

        # 2. Total Documents
        docs_query = select(func.count(Document.id)).where(
            Document.user_id == current_user.id
        )
        docs_result = await db.execute(docs_query)
        document_count = docs_result.scalar() or 0

        # 3. Total Queries (User messages)
        queries_query = (
            select(func.count(ChatMessage.id))
            .join(ChatSession, ChatMessage.session_id == ChatSession.id)
            .where(
                and_(
                    ChatSession.user_id == current_user.id,
                    ChatMessage.role == "user"
                )
            )
        )
        queries_result = await db.execute(queries_query)
        query_count = queries_result.scalar() or 0

        # 4. Storage Used (in bytes)
        storage_query = select(func.coalesce(func.sum(Document.file_size), 0)).where(
            Document.user_id == current_user.id
        )
        storage_result = await db.execute(storage_query)
        storage_used = int(storage_result.scalar() or 0)

        # 5. Document Types breakdown
        types_query = (
            select(Document.file_type, func.count(Document.id))
            .where(Document.user_id == current_user.id)
            .group_by(Document.file_type)
        )
        types_result = await db.execute(types_query)
        types_map = {row[0].value if hasattr(row[0], "value") else str(row[0]): row[1] for row in types_result.all()}

        doc_types = DocumentTypeStats(
            pdf=types_map.get("pdf", 0),
            docx=types_map.get("docx", 0),
            txt=types_map.get("txt", 0)
        )

        # 6. Activity Timeline (last 7 or 30 days)
        days_limit = 7 if period == "7d" else 30
        start_date = datetime.utcnow() - timedelta(days=days_limit)

        # Query messages grouped by date
        # Note: func.date works on both SQLite and PostgreSQL to extract the date portion
        timeline_query = (
            select(
                func.date(ChatMessage.created_at).label("date_label"),
                func.count(ChatMessage.id).label("queries_count")
            )
            .join(ChatSession, ChatMessage.session_id == ChatSession.id)
            .where(
                and_(
                    ChatSession.user_id == current_user.id,
                    ChatMessage.role == "user",
                    ChatMessage.created_at >= start_date
                )
            )
            .group_by(func.date(ChatMessage.created_at))
            .order_by(func.date(ChatMessage.created_at).asc())
        )
        timeline_result = await db.execute(timeline_query)
        timeline_data = timeline_result.all()

        # Build complete timeline dictionary to fill in missing dates with 0
        timeline_dict = {
            (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d"): 0
            for i in range(days_limit)
        }

        # Update with actual db results
        for row in timeline_data:
            # handle both string and date objects returned by different DB backends
            date_str = str(row[0]) if row[0] is not None else ""
            if date_str in timeline_dict:
                timeline_dict[date_str] = row[1]
            else:
                # If date format varies slightly, extract YYYY-MM-DD
                short_date = date_str[:10]
                if short_date in timeline_dict:
                    timeline_dict[short_date] = row[1]

        activity_timeline = [
            ActivityPoint(date=d, count=c)
            for d, c in sorted(timeline_dict.items())
        ]

        return AnalyticsResponse(
            stats=UsageStats(
                query_count=query_count,
                document_count=document_count,
                session_count=session_count
            ),
            activity_timeline=activity_timeline,
            document_types=doc_types,
            storage_used=storage_used
        )

    except Exception as e:
        logger.error(f"Failed to generate analytics dashboard: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate analytics dashboard"
        )
