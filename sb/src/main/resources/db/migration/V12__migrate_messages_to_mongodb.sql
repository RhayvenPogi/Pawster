-- Messages have been migrated to MongoDB (pawster_messages collection).
-- The message_attachments table remains in Postgres.
-- This migration drops the old messages table.

DROP TABLE IF EXISTS messages;