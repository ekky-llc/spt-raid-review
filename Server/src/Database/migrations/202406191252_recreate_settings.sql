-- Step 1: Create the new table
CREATE TABLE IF NOT EXISTS setting_new (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE setting;

INSERT INTO setting_new (key, value, type) VALUES ('telemetry_enabled', '0', 'SERVER');
INSERT INTO setting_new (key, value, type) VALUES ('v1_to_v2_migration__completed', '0', 'MIGRATION');

ALTER TABLE setting_new RENAME TO setting;