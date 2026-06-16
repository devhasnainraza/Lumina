-- SQL Migration Script: Remove overly strict sources constraint
-- Date: 2026-06-13
-- Issue: The check_sources_for_assistant constraint fails when assistant messages
--        have an empty array [] for sources (valid case when no docs found)

-- Drop the problematic constraint if it exists
ALTER TABLE chat_messages
DROP CONSTRAINT IF EXISTS check_sources_for_assistant;

-- Verify the constraint is removed
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cls ON cls.oid = c.conrelid
WHERE cls.relname = 'chat_messages'
  AND conname LIKE '%sources%';

-- Expected: No rows should be returned if the constraint was successfully dropped
