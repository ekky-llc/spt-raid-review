CREATE TABLE IF NOT EXISTS tracking_ballistic (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "raidId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "time" INTEGER NOT NULL,
    "weaponId" TEXT NOT NULL,
    "ammoId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    FOREIGN KEY ("raidId") REFERENCES raid("id")
);