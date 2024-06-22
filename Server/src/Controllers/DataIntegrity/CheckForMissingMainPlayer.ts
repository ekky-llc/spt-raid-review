import _ from 'lodash';
import sqlite3 from 'sqlite3';
import { Database } from "sqlite"
import { IAkiProfile } from '@spt-aki/models/eft/profile/IAkiProfile';

async function CheckForMissingMainPlayer(db: Database<sqlite3.Database, sqlite3.Statement>, profiles: Record<string, IAkiProfile>) {

    console.log(`[RAID-REVIEW] Starting 'Missing main player' check.`);

    // Get All The Raids
    const raids_sql = `SELECT * FROM raid WHERE timeInRaid > 0;`;
    const raids = await db.all(raids_sql).catch((e: Error) => console.error(e)) as any[];
    const raidsByPlayer = _.groupBy(raids, 'profileId');
    
    // Check the player table, and find the raids where the Main Player is missing.
    const missingPlayers = [];
    const players = Object.keys(raidsByPlayer);
    for (let i = 0; i < players.length; i++) {

        const player = players[i];
        for (let j = 0; j < raidsByPlayer[player].length; j++) {

            const raid = raidsByPlayer[player][j];
            const playerCheck_sql = `SELECT * FROM player WHERE raidId = ? AND profileId = ? AND type = 'HUMAN'`; // Prevents Scav Raids from being 
            const playerCheck = await db.all(playerCheck_sql, [
                raid.raidId,
                raid.profileId
            ]).catch((e: Error) => console.error(e));

            if (playerCheck && playerCheck.length > 0) continue;

            const profile = profiles[raid.profileId];
            if (profile) {
                missingPlayers.push({
                    raidId : raid.raidId,
                    profileId : raid.profileId,
                    level : profile.characters.pmc.Info.Level,
                    team : profile.characters.pmc.Info.Side,
                    name : profile.characters.pmc.Info.Nickname,
                    group : 0,
                    spawnTime : 5,
                    mod_SAIN_brain : "PLAYER",
                    type : "HUMAN"
                })
            }
        }
    }

    if (missingPlayers.length === 0) {
        console.log(`[RAID-REVIEW] All raids appear to be healthy, nice!`);
        return;
    };
    console.log(`[RAID-REVIEW] Found '${missingPlayers.length}' unique raids with 'main player' missing.`);

    // If they are missing, add an entry to the table with a spawnTime of 0
    for (let i = 0; i < missingPlayers.length; i++) {

        const missingPlayer = missingPlayers[i];
        const raidInsert_sql = `INSERT INTO player (raidId, profileId, level, team, name, "group", spawnTime, mod_SAIN_brain, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        await db.run(raidInsert_sql, [
            missingPlayer.raidId,
            missingPlayer.profileId,
            missingPlayer.level,
            missingPlayer.team,
            missingPlayer.name,
            missingPlayer.group,
            missingPlayer.spawnTime,
            missingPlayer.mod_SAIN_brain,
            missingPlayer.type
        ]).catch((e: Error) => console.error(e));
    }

    console.log(`[RAID-REVIEW] Completed 'Missing main player' check, fixed '${missingPlayers.length}' raids.`);
}

export {
    CheckForMissingMainPlayer,
}