ALTER TABLE missing_pets
    ADD COLUMN IF NOT EXISTS photo      bytea,
    ADD COLUMN IF NOT EXISTS photo_type VARCHAR(100);

ALTER TABLE missing_pets DROP COLUMN IF EXISTS photo_url;