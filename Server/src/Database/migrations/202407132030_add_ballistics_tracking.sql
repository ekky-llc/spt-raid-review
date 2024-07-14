CREATE TABLE IF NOT EXISTS ballistic (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "raidId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "time" INTEGER NOT NULL,
    "weaponId" TEXT NOT NULL,
    "ammoId" TEXT NOT NULL,
    "hitPlayerId" TEXT,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("raidId") REFERENCES raid("id")
);