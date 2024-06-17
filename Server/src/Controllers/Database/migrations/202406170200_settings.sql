CREATE TABLE IF NOT EXISTS setting (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO setting (key, value) VALUES ('telemetry_enabled', '0');