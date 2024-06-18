import { Database } from "sqlite";
import sqlite3 from 'sqlite3'
import { FileExists } from "./DataSaver";

export async function getRaidData(db: Database<sqlite3.Database, sqlite3.Statement>, profileId: string, raidId: string) {

    // Need to fix this; N+1 Problem
    const sqlRaidQuery = `SELECT * FROM raid WHERE profileId = ? AND timeInRaid > 10 AND raidId = ?`;
    const sqlRaidValues = [profileId, raidId];
    const raid = await db
      .get(sqlRaidQuery, sqlRaidValues)
      .catch((e: Error) => console.error(e));

    const keys = ["kills", "looting", "player"];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const sqlKeyQuery = `SELECT * FROM ${key} WHERE raidId = ?`;
      const sqlKeyValues = [raidId];
      const sqlResult = await db.all(sqlKeyQuery, sqlKeyValues).catch((e: Error) => console.error(e));
      raid[key] = sqlResult || [];
    }

    // Positions check
    raid.positionsTracked = FileExists(
      "positions",
      "",
      "",
      `${raidId}_positions.json`
    );

    // Quick Fix
    raid.players = raid.player;
    delete raid.player;

    return raid;
}