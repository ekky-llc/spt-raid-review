CREATE TABLE IF NOT EXISTS raid (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "raidId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "timeInRaid" TEXT NOT NULL,
    "exitName" TEXT NOT NULL,
    "exitStatus" TEXT NOT NULL,
    "detectedMods" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "raidId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "team" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" INTEGER NOT NULL,
    "spawnTime" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("raidId") REFERENCES raid("id")
);

CREATE TABLE IF NOT EXISTS kills (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "raidId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL, 
    "time" INTEGER NOT NULL,
    "killedId" TEXT NOT NULL,
    "weapon" TEXT NOT NULL,
    "distance" TEXT NOT NULL,
    "bodyPart" TEXT NOT NULL,
    "positionKilled" TEXT NOT NULL,
    "positionKiller" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("raidId") REFERENCES raid("id")
);

CREATE TABLE IF NOT EXISTS looting (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "raidId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "qty" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "added" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("raidId") REFERENCES raid("id")
);

CREATE TABLE IF NOT EXISTS positions (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "raidId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "time" INTEGER NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "z" INTEGER NOT NULL,
    "dir" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("raidId") REFERENCES raid("id")
);
