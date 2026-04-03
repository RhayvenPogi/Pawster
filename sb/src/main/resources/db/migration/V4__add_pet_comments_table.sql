CREATE TABLE pet_comments (
    id          BIGSERIAL PRIMARY KEY,
    pet_id      BIGINT       NOT NULL REFERENCES missing_pets(id) ON DELETE CASCADE,
    user_id     INT          REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(100) NOT NULL,
    content     TEXT         NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pet_comments_pet_id  ON pet_comments(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_comments_user_id ON pet_comments(user_id);