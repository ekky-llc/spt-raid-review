CREATE TABLE IF NOT EXISTS player_status (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "raidId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "time" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    FOREIGN KEY ("raidId") REFERENCES raid("id")
);