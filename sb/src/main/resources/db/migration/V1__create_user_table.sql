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

    id_file       BYTEA,
    id_file_type  VARCHAR(50),
    id_file_name  VARCHAR(255),

    photo         BYTEA,
    photo_type    VARCHAR(50),
    photo_name    VARCHAR(255),

    created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    status        VARCHAR(20)     NOT NULL DEFAULT 'pending',
    role          VARCHAR(20)     NOT NULL DEFAULT 'user',
    is_active     INTEGER         DEFAULT 1,
    last_login    TIMESTAMP,

    -- ✅ ADD THESE
    reset_otp VARCHAR(6),
    reset_otp_expires_at TIMESTAMP,
    reset_otp_verified BOOLEAN DEFAULT FALSE
);