CREATE TABLE IF NOT EXISTS message_attachments (
    id                BIGSERIAL    PRIMARY KEY,
    original_filename VARCHAR(255) NOT NULL,
    content_type      VARCHAR(100) NOT NULL,
    file_size         BIGINT       NOT NULL,
    data              BYTEA        NOT NULL
);