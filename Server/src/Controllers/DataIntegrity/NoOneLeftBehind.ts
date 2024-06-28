import _ from 'lodash';
import sqlite3 from 'sqlite3';
import { Database } from "sqlite"
import { Logger } from '../../Utils/logger';

export interface Player {
    raidId : string;
    profileId : string;
    level : string;
    team : string;
    name : string;
    group : number;
    spawnTime : number;
    mod_SAIN_brain : string;
    type : string;
    mod_SAIN_difficulty : string;
};

async function NoOneLeftBehind(db: Database<sqlite3.Database, sqlite3.Statement>, logger: Logger, raidId: string, players : Player[]) {
    logger.log(`Validating that all players/bots are accounted for.`)

    // Filter out the ones already there
    let playersMissingFromRaid = 0;
    let playersInserted = 0;
    for (let i = 0; i < players.length; i++) {
        const player = players[i];

        const checkQuery = `SELECT 1 FROM player WHERE raidId = ? OR profileId = ? LIMIT 1`;
        const playerExists = await db.get(checkQuery, [raidId, player.profileId]);
        if (playerExists === undefined) {
            playersMissingFromRaid++;
            const player_sql = `INSERT INTO player (raidId, profileId, level, team, name, "group", spawnTime, mod_SAIN_brain, type, mod_SAIN_difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(player_sql, [
                raidId,
                player.profileId,
                player.level,
                player.team,
                player.name,
                player.group,
                player.spawnTime,
                player.mod_SAIN_brain,
                player.type,
                player.mod_SAIN_difficulty
              ])
              .catch((e: Error) => logger.error(`[ERR:MISSING_MAIN_PLAYER] `, e));
              playersInserted++;
        }
    }

    logger.log(`There was a total of '${playersMissingFromRaid}' and '${playersInserted}' escorted back to the database.`)
    logger.log(`Validated that all players/bots are accounted for.`)

    return;
}

export {
    NoOneLeftBehind
}