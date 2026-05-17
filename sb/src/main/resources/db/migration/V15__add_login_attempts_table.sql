CREATE TABLE IF NOT EXISTS login_attempts (
    id               SERIAL PRIMARY KEY,
    email            VARCHAR(100)  NOT NULL,
    attempt_count    INTEGER       NOT NULL DEFAULT 0,
    locked_until     TIMESTAMP,
    permanently_locked BOOLEAN     NOT NULL DEFAULT FALSE,
    last_attempt_at  TIMESTAMP,
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);