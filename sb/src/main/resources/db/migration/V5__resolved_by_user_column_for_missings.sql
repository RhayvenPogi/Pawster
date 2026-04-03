ALTER TABLE missing_pets
    ADD COLUMN IF NOT EXISTS resolved_by_user    BOOLEAN   NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS resolved_at         TIMESTAMP,
    ADD COLUMN IF NOT EXISTS reporter_user_id    INT       REFERENCES users(id) ON DELETE SET NULL;