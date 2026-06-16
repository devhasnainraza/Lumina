"""
Database migration script to remove the check_sources_for_assistant constraint.

This constraint was causing chat to fail when no relevant documents were found
(empty sources array).

Run this script once to apply the fix.
"""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Convert asyncpg URL format (remove +asyncpg if present)
if "+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")


async def apply_migration():
    """Apply the database migration to remove the constraint."""

    print("[*] Connecting to database...")

    try:
        # Connect to database
        conn = await asyncpg.connect(DATABASE_URL)
        print("[OK] Connected successfully")

        # Check if constraint exists
        print("\n[*] Checking for existing constraint...")
        check_query = """
            SELECT conname, pg_get_constraintdef(c.oid) as definition
            FROM pg_constraint c
            JOIN pg_class cls ON cls.oid = c.conrelid
            WHERE cls.relname = 'chat_messages'
              AND conname = 'check_sources_for_assistant';
        """

        result = await conn.fetch(check_query)

        if result:
            print(f"[!] Found constraint: {result[0]['conname']}")
            print(f"    Definition: {result[0]['definition']}")

            # Drop the constraint
            print("\n[*] Dropping constraint...")
            drop_query = """
                ALTER TABLE chat_messages
                DROP CONSTRAINT IF EXISTS check_sources_for_assistant;
            """
            await conn.execute(drop_query)
            print("[OK] Constraint dropped successfully")
        else:
            print("[OK] Constraint does not exist (already removed or never created)")

        # Verify constraint is gone
        print("\n[*] Verifying constraint was removed...")
        verify_result = await conn.fetch(check_query)

        if not verify_result:
            print("[OK] Verification successful - constraint is removed")
        else:
            print("[ERROR] Verification failed - constraint still exists")
            return False

        # Show all remaining constraints on chat_messages
        print("\n[INFO] Remaining constraints on chat_messages:")
        all_constraints_query = """
            SELECT conname, pg_get_constraintdef(c.oid) as definition
            FROM pg_constraint c
            JOIN pg_class cls ON cls.oid = c.conrelid
            WHERE cls.relname = 'chat_messages'
            ORDER BY conname;
        """

        constraints = await conn.fetch(all_constraints_query)
        if constraints:
            for constraint in constraints:
                print(f"  - {constraint['conname']}: {constraint['definition']}")
        else:
            print("  (No constraints found)")

        await conn.close()
        print("\n[OK] Migration completed successfully!")
        return True

    except Exception as e:
        print(f"\n[ERROR] Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 70)
    print("DATABASE MIGRATION - Remove check_sources_for_assistant constraint")
    print("=" * 70)

    success = asyncio.run(apply_migration())

    if success:
        print("\n[OK] All done! Your chat application should now work correctly.")
        print("   - Chat will no longer crash when no documents are found")
        print("   - Assistant messages can have empty sources arrays")
    else:
        print("\n[WARNING] Migration had issues. Check the error messages above.")

    print("=" * 70)
