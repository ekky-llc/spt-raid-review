import _ from 'lodash';
import sqlite3 from 'sqlite3';
import { Database } from "sqlite"

export interface Players {
    raidId : string;
    profileId : string;
    level : string;
    team : string;
    name : string;
    group : number;
    spawnTime : number;
    mod_SAIN_brain : string;
    type : string;
};

async function NoOneLeftBehind(db: Database<sqlite3.Database, sqlite3.Statement>, raidId: string, profileId: string, players : Players[]) {
    console.log(`[RAID-REVIEW] Validating that all players/bots are accounted for.`)

    // Get all the players in the db
    const raidPlayer_sql = `SELECT * FROM player WHERE raidId = ?`;
    const raidPlayersArr = db.all(raidPlayer_sql, [ raidId ]).catch(e => console.log(e));
    const raidPlayersDict = _.groupBy(raidPlayersArr, 'profileId');
    
    // Filter out the ones already there
    let playersMissingFromRaid = 0;
    let playersInserted = 0;
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const playerExists = raidPlayersDict[player.profileId];
        if (playerExists === undefined) {
            playersMissingFromRaid++;
            const player_sql = `INSERT INTO player (raidId, profileId, level, team, name, "group", spawnTime, mod_SAIN_brain, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(player_sql, [
                this.raid_id,
                player.profileId,
                player.level,
                player.team,
                player.name,
                player.group,
                player.spawnTime,
                player.mod_SAIN_brain,
                player.type
              ])
              .catch((e: Error) => console.error(e));
              playersInserted++;
        }
    }
    console.log(`[RAID-REVIEW] There was a total of '${playersMissingFromRaid}' and '${playersInserted}' escorted back to the database.`)

    console.log(`[RAID-REVIEW] Validated that all players/bots are accounted for.`)
    return;
}

export {
    NoOneLeftBehind
}