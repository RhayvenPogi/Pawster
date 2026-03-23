CREATE TABLE IF NOT EXISTS users (
    id            SERIAL          PRIMARY KEY,
    first_name    VARCHAR(50)     NOT NULL,
    last_name     VARCHAR(50)     NOT NULL,
    email         VARCHAR(100)    NOT NULL UNIQUE,
    phone         VARCHAR(20)     NOT NULL,
    password_hash VARCHAR(255)    NOT NULL,
    address       TEXT,
    city          VARCHAR(50),
    province      VARCHAR(50),
    zip_code      VARCHAR(15),
 
    -- ID verification file stored as binary (no folder needed)
    id_file       BYTEA,
    id_file_type  VARCHAR(50),
    id_file_name  VARCHAR(255),
 
    created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    status        VARCHAR(20)     NOT NULL DEFAULT 'pending',
    role          VARCHAR(20)     NOT NULL DEFAULT 'user',
    is_active     INTEGER                  DEFAULT 1,
    last_login    TIMESTAMP
);