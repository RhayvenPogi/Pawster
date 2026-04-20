-- ── Messages table for in-app WebSocket direct messaging ────────────────────
-- Drop first if re-running in dev
-- Migration: V99__create_messages_table.sql
-- Place in: sb/src/main/resources/db/migration/

CREATE TABLE IF NOT EXISTS messages (
    id          BIGSERIAL       PRIMARY KEY,
    user_id     INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id   INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_role VARCHAR(20)     NOT NULL CHECK (sender_role IN ('user', 'admin')),
    content     TEXT            NOT NULL,
    is_read     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_user_id   ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);