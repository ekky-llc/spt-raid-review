import { Database } from "sqlite";
import sqlite3 from 'sqlite3'
import { FileExists } from "../FileSystem/DataSaver";
import { Logger } from "../../Utils/logger";
import { ACTIVE_POSITIONAL_DATA_STRUCTURE } from "../PositionalData/CompileRaidPositionalData";

export async function getRaidData(db: Database<sqlite3.Database, sqlite3.Statement>, logger: Logger, raidId: string) {
  try {
    const sqlRaidQuery = `SELECT * FROM raid WHERE timeInRaid > 10 AND raidId = ?`;
    const raid = await db.get(sqlRaidQuery, [raidId]);

    if (!raid) {
      logger.error(`[ERR:GET_RAID_DATA_CORE] Raid not found for ID: ${raidId}`);
      return null;
    }

    const sqlBatchQuery = `
      SELECT * FROM kills WHERE raidId = ?
      UNION ALL
      SELECT * FROM looting WHERE raidId = ?
      UNION ALL
      SELECT * FROM player WHERE raidId = ?
      UNION ALL
      SELECT * FROM player_status WHERE raidId = ?
      UNION ALL
      SELECT * FROM ballistic WHERE raidId = ?
    `;

    const result = await db.all(sqlBatchQuery, [raidId, raidId, raidId, raidId, raidId]);

    raid.kills = result.filter(item => item.kills !== undefined);
    raid.looting = result.filter(item => item.looting !== undefined);
    raid.player = result.filter(item => item.player !== undefined);
    raid.player_status = result.filter(item => item.player_status !== undefined);
    raid.ballistic = result.filter(item => item.ballistic !== undefined);

    const rawPositionData = FileExists(logger, "positions", "", "", `${raidId}_positions`);
    const compiledPositionData = FileExists(logger, "positions", "", "", `${raidId}_${ACTIVE_POSITIONAL_DATA_STRUCTURE}_positions.json`);
    raid.positionsTracked = compiledPositionData ? 'COMPILED' : rawPositionData ? 'RAW' : 'NOT_AVAILABLE';

    raid.players = raid.player || [];
    delete raid.player;

    return raid;
  } catch (e) {
    logger.error(`[ERR:GET_RAID_DATA_CORE] Unexpected error fetching raid data for raidId: ${raidId}`, e);
    return null;
  }
}
