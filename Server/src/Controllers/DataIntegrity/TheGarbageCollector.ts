import _ from 'lodash';
import sqlite3 from 'sqlite3';
import { Database } from "sqlite"

import config from '../../../config.json';
import { DeleteFile } from '../FileSystem/DataSaver';

/**
 * If enabled in config, auto deletes any raids are older than the set 'autoDeleteLimit'.
 * @param db Sqlite database instance
 */
async function GarbageCollectOldRaids(db: Database<sqlite3.Database, sqlite3.Statement>) {

    try  {

        if (config.autoDelete) {
            console.log(`[RAID-REVIEW] Garbage collector deleting old raids, only keeping data for the last '${config.autoDeleteLimit}' raids.`);

            // Get raids that are offset by {config.autoDeleteLimit}.
            const oldRaids_sql = `SELECT * FROM raid WHERE timeInRaid > 10 ORDER BY created_at DESC LIMIT 1000000 OFFSET ${config.autoDeleteLimit};`
            const oldRaids = await db.all(oldRaids_sql);
            
            // Delete these raids, including temp and positional data.
            if (oldRaids.length > 0) {
                console.log(`[RAID-REVIEW] Found '${oldRaids.length}' raids to delete.`);
                for (let i = 0; i < oldRaids.length; i++) {
                    const oldRaid = oldRaids[i];

                    const keys = ["raid", "kills", "looting", "player"];
                    for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const sqlKeyQuery = `DELETE FROM ${key} WHERE raidId = ?`;
                    const sqlKeyValues = [oldRaid.raidId];
                    await db
                        .run(sqlKeyQuery, sqlKeyValues)
                        .catch((e: Error) => console.error(e));
                    }
        
                    DeleteFile("positions", "", "", `${oldRaid.raidId}_positions`);
                    DeleteFile("positions", "", "", `${oldRaid.raidId}_V2_positions.json`);
                }
                console.log(`[RAID-REVIEW] Garbage collector is done deleting old raids.`);
            } 
            
            else {
                console.log(`[RAID-REVIEW] All good, no old raids to purge.`);
            }
        } else {
            console.warn(`[RAID-REVIEW] Garbage collector for 'old raids' is disabled, watch storage space!`)
        }

    } catch(e) {
        console.log(e)
    }

}


/**
 * If enabled in config, auto deletes any raids that might have been unfinished due to a crash or alt+f4 rage quit.
 * @param db Sqlite database instance
 */
async function GarbageCollectUnfinishedRaids(db: Database<sqlite3.Database, sqlite3.Statement>) {

    if (config.autoDeleteUnfinishedRaids) {
        console.log(`[RAID-REVIEW] Garbage collector deleting unfinished raids.`);

        // Get raids that are offset by {config.autoDeleteLimit}.
        const raids_sql = `SELECT * FROM raid;`
        const raids = await db.all(raids_sql);
        
        // Filter the raids that don't have a matching end marker
        const raidsWithMissingEndMarker = raids.filter(r => {
            const noMatchingEndMarker = raids.filter(rr => rr.raidId === r.raidId)?.length < 2;
            if (noMatchingEndMarker) return true;
            return false;
        })
        
        
        if (raidsWithMissingEndMarker.length > 0) {
            console.log(`[RAID-REVIEW] Found '${raidsWithMissingEndMarker.length}' raids to delete.`);
            for (let i = 0; i < raidsWithMissingEndMarker.length; i++) {
                const raid = raidsWithMissingEndMarker[i];

                const keys = ["raid", "kills", "looting", "player"];
                for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const sqlKeyQuery = `DELETE FROM ${key} WHERE raidId = ?`;
                const sqlKeyValues = [raid.raidId];
                await db
                    .all(sqlKeyQuery, sqlKeyValues)
                    .catch((e: Error) => console.error(e));
                }
    
                DeleteFile("positions", "", "", `${raid.raidId}_positions`);
                DeleteFile("positions", "", "", `${raid.raidId}_V2_positions.json`);
            }
            console.log(`[RAID-REVIEW] Garbage collector is done deleting unfinished raids.`);
        } 
        
        else {
            console.log(`[RAID-REVIEW] All good, no unfinished raids to purge.`);
        }
    } else {
        console.warn(`[RAID-REVIEW] Garbage collector for 'unfinished raids' is disabled, watch storage space!`)
    }

}

export {
    GarbageCollectOldRaids,
    GarbageCollectUnfinishedRaids
}