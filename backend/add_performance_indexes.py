"""
Database Performance Indexes Migration

Adds indexes to improve query performance for:
- Chat messages by session and timestamp
- Chat sessions by user and update time
- Documents by user and creation time
"""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL").replace("postgresql+asyncpg://", "postgresql://")


async def add_performance_indexes():
    """Add database indexes for better query performance."""

    print("=" * 70)
    print("Adding Performance Indexes")
    print("=" * 70)

    conn = await asyncpg.connect(DATABASE_URL)

    indexes = [
        {
            "name": "idx_chat_messages_session_created",
            "sql": "CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages(session_id, created_at DESC)",
            "purpose": "Fast message retrieval by session"
        },
        {
            "name": "idx_chat_sessions_user_updated",
            "sql": "CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated ON chat_sessions(user_id, updated_at DESC)",
            "purpose": "Fast session list for user"
        },
        {
            "name": "idx_documents_user_created",
            "sql": "CREATE INDEX IF NOT EXISTS idx_documents_user_created ON documents(user_id, created_at DESC)",
            "purpose": "Fast document list for user"
        },
        {
            "name": "idx_chat_messages_role",
            "sql": "CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role)",
            "purpose": "Filter messages by role"
        }
    ]

    for idx in indexes:
        try:
            print(f"\n[*] Creating index: {idx['name']}")
            print(f"    Purpose: {idx['purpose']}")
            await conn.execute(idx['sql'])
            print(f"[OK] Index created successfully")
        except Exception as e:
            print(f"[WARNING] Index creation failed or already exists: {e}")

    # Verify indexes
    print("\n[*] Verifying indexes...")
    result = await conn.fetch("""
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname
    """)

    if result:
        print(f"[OK] Found {len(result)} performance indexes:")
        for row in result:
            print(f"  - {row['tablename']}.{row['indexname']}")
    else:
        print("[WARNING] No indexes found")

    await conn.close()
    print("\n[OK] Migration complete!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(add_performance_indexes())
