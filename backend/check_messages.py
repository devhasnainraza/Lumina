"""Check recent chat messages in database"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL").replace("postgresql+asyncpg://", "postgresql://")

async def check_messages():
    print("=" * 70)
    print("Checking Recent Chat Messages")
    print("=" * 70)

    conn = await asyncpg.connect(DATABASE_URL)

    # Get recent messages
    messages = await conn.fetch("""
        SELECT
            cm.id,
            cm.role,
            LEFT(cm.content, 100) as content_preview,
            cm.created_at,
            cs.id as session_id
        FROM chat_messages cm
        JOIN chat_sessions cs ON cs.id = cm.session_id
        ORDER BY cm.created_at DESC
        LIMIT 10
    """)

    if messages:
        print(f"\n[OK] Found {len(messages)} recent messages:\n")
        for msg in messages:
            print(f"  {msg['created_at']} | {msg['role']:10} | {msg['content_preview']}")
            print(f"  Session: {msg['session_id']}")
            print()
    else:
        print("\n[INFO] No messages found in database")

    await conn.close()

if __name__ == "__main__":
    asyncio.run(check_messages())
