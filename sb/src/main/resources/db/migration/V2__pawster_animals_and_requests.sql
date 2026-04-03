-- ─────────────────────────────────────────────────────────────────────────────
-- V2__pawster_animals_and_requests.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Animals ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS animals (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    type       VARCHAR(40)  NOT NULL DEFAULT 'Dog'
                   CHECK (type IN ('Dog', 'Cat', 'Bird', 'Rabbit', 'Other')),
    breed      VARCHAR(120),
    age        VARCHAR(40),
    health     VARCHAR(40)  NOT NULL DEFAULT 'Healthy'
                   CHECK (health IN ('Healthy', 'Needs Care', 'Under Treatment')),
    status     VARCHAR(40)  NOT NULL DEFAULT 'Available'
                   CHECK (status IN ('Available', 'Pending', 'Adopted', 'Not Available')),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ✅ NOW it's safe to ALTER
ALTER TABLE animals ADD COLUMN IF NOT EXISTS photo TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS notes TEXT;

-- ── Adoption requests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adoption_requests (
    id          SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id) ON DELETE SET NULL,
    pet_name    VARCHAR(120),
    name        VARCHAR(160),
    email       VARCHAR(180),
    phone       VARCHAR(30),
    address     VARCHAR(255),
    reason      TEXT,
    status      VARCHAR(40)  NOT NULL DEFAULT 'Pending'
                    CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    reject_note TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Rehome requests ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rehome_requests (
    id                  SERIAL PRIMARY KEY,
    user_id             INT REFERENCES users(id) ON DELETE SET NULL,
    animal_name         VARCHAR(120),
    owner_name          VARCHAR(160),
    contact             VARCHAR(180),
    contact_no          VARCHAR(30),
    city                VARCHAR(120),
    description         TEXT,
    status              VARCHAR(40)  NOT NULL DEFAULT 'Pending'
                            CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    reject_note         TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Pet detail fields
    pet_name            VARCHAR(120),
    species             VARCHAR(60),
    breed               VARCHAR(120),
    age                 VARCHAR(40),
    photo_base64        TEXT,
    ideal_home_desc     TEXT,
    behavior            TEXT,
    behavior_other      TEXT,
    medical_notes       TEXT,
    good_with_children  BOOLEAN,
    good_with_pets      BOOLEAN,
    is_house_trained    BOOLEAN,
    is_leash_trained    BOOLEAN,
    is_vaccinated       BOOLEAN,
    vaccine_type        VARCHAR(120)
);

-- ── Surveys ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS surveys (
    id           SERIAL PRIMARY KEY,
    adoption_id  INT REFERENCES adoption_requests(id) ON DELETE SET NULL,
    user_id      INT REFERENCES users(id) ON DELETE SET NULL,
    adopter_name VARCHAR(160),
    animal_name  VARCHAR(120),
    rating       SMALLINT CHECK (rating BETWEEN 1 AND 5),
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Activity log ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
    id         SERIAL PRIMARY KEY,
    action     VARCHAR(80) NOT NULL,
    details    TEXT,
    user_id    INT REFERENCES users(id) ON DELETE SET NULL,
    user_name  VARCHAR(160),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_adoption_status  ON adoption_requests(status);
CREATE INDEX IF NOT EXISTS idx_rehome_status    ON rehome_requests(status);
CREATE INDEX IF NOT EXISTS idx_animals_status   ON animals(status);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at DESC);