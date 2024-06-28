import { Database } from "sqlite";
import sqlite3 from 'sqlite3'
import { FileExists } from "../FileSystem/DataSaver";
import { Logger } from "../../Utils/logger";

export async function getRaidData(db: Database<sqlite3.Database, sqlite3.Statement>, logger: Logger, raidId: string) {

    // Need to fix this; N+1 Problem
    const sqlRaidQuery = `SELECT * FROM raid WHERE timeInRaid > 10 AND raidId = ?`;
    const sqlRaidValues = [raidId];
    const raid = await db
      .get(sqlRaidQuery, sqlRaidValues)
      .catch((e: Error) => logger.error(`[ERR:GET_RAID_DATA_CORE] `, e));

    const keys = ["kills", "looting", "player"];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      
      let sqlKeyQuery = `SELECT * FROM ${key} WHERE raidId = ? ORDER BY time ASC`; 
      if (key === 'player') {
        sqlKeyQuery = `SELECT * FROM ${key} WHERE raidId = ? ORDER BY spawnTime ASC, "group" ASC`;
      }

      const sqlKeyValues = [raidId];
      const sqlResult = await db.all(sqlKeyQuery, sqlKeyValues).catch((e: Error) => logger.error(`[ERR:GET_RAID_DATA_KEYS] `, e));
      raid[key] = sqlResult || [];
    }

    // Positions check
    const rawPositionData = FileExists(logger, "positions","","",`${raidId}_positions`);
    const compiledPositionData = FileExists(logger, "positions","","",`${raidId}_V2_positions.json`);
    raid.positionsTracked = compiledPositionData ? 'COMPILED' : rawPositionData ? 'RAW' : 'NOT_AVAILABLE';

    // Quick Fix
    raid.players = raid.player;
    delete raid.player;

    return raid;
}