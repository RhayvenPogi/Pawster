CREATE TABLE missing_pets (
    id            BIGSERIAL PRIMARY KEY,
    type          VARCHAR(10)  NOT NULL,
    name          VARCHAR(100),
    species       VARCHAR(50),
    breed         VARCHAR(100),
    area          VARCHAR(100),
    color         VARCHAR(100),
    details       TEXT,
    reported_date DATE,
    address       VARCHAR(255),
    latitude      DOUBLE PRECISION,
    longitude     DOUBLE PRECISION,
    photo_url     VARCHAR(500),
    status        VARCHAR(50)
);