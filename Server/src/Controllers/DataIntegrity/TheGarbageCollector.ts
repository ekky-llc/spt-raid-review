import _ from 'lodash'
import sqlite3 from 'sqlite3'
import { Database } from 'sqlite'

import config from '../../../config.json'
import { DeleteFile } from '../FileSystem/DataSaver'
import { Logger } from '../../Utils/logger'

/**
 * If enabled in config, auto deletes any raids are older than the set 'autoDeleteLimit'.
 * @param db Sqlite database instance
 */
async function GarbageCollectOldRaids(db: Database<sqlite3.Database, sqlite3.Statement>, logger: Logger) {
    if (config.autoDelete) {
        logger.log(`Garbage collector deleting old raids, only keeping data for the last '${config.autoDeleteLimit}' raids.`)

        // Get raids that are offset by {config.autoDeleteLimit}.
        const oldRaids_sql = `SELECT * FROM raid WHERE timeInRaid > 10 ORDER BY created_at DESC LIMIT 1000000 OFFSET ${config.autoDeleteLimit};`
        const oldRaids = await db.all(oldRaids_sql)

        // Delete these raids, including temp and positional data.
        if (oldRaids.length > 0) {
            logger.log(`Found '${oldRaids.length}' raids to delete.`)
            for (let i = 0; i < oldRaids.length; i++) {
                const oldRaid = oldRaids[i]

                const keys = ['raid', 'kills', 'looting', 'player']
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i]
                    const sqlKeyQuery = `DELETE FROM ${key} WHERE raidId = ?`
                    const sqlKeyValues = [oldRaid.raidId]
                    await db.run(sqlKeyQuery, sqlKeyValues).catch((e: Error) => logger.error(`[ERR:GARBAGE_COLLECT_OLD_RAIDS] `, e))
                }

                DeleteFile('positions', '', '', `${oldRaid.raidId}_positions`)
                DeleteFile('positions', '', '', `${oldRaid.raidId}_V2_positions.json`)
            }
            logger.log(`Garbage collector is done deleting old raids.`)
        } else {
            logger.log(`All good, no old raids to purge.`)
        }
    } else {
        logger.warn(`Garbage collector for 'old raids' is disabled, watch storage space!`)
    }
}

/**
 * If enabled in config, auto deletes any raids that might have been unfinished due to a crash or alt+f4 rage quit.
 * @param db Sqlite database instance
 */
async function GarbageCollectUnfinishedRaids(db: Database<sqlite3.Database, sqlite3.Statement>, logger: Logger) {
    if (config.autoDeleteUnfinishedRaids) {
        logger.log(`Garbage collector deleting unfinished raids.`)

        // Get raids that are offset by {config.autoDeleteLimit}.
        const raids_sql = `SELECT * FROM raid LIMIT 1000000;`
        const raids = await db.all(raids_sql)

        // Filter the raids that don't have a matching end marker
        const raidsWithMissingEndMarker = raids.filter((r) => {
            const noMatchingEndMarker = raids.filter((rr) => rr.raidId === r.raidId)?.length !== 2
            if (noMatchingEndMarker) return true
            return false
        });

        if (raidsWithMissingEndMarker.length > 0) {
            logger.log(`Found '${raidsWithMissingEndMarker.length}' raids to delete.`)
            for (let i = 0; i < raidsWithMissingEndMarker.length; i++) {
                const raid = raidsWithMissingEndMarker[i]

                const keys = ['raid', 'kills', 'looting', 'player']
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i]
                    const sqlKeyQuery = `DELETE FROM ${key} WHERE raidId = ?`
                    const sqlKeyValues = [raid.raidId]
                    await db.all(sqlKeyQuery, sqlKeyValues).catch((e: Error) => logger.error(`[ERR:GARBAGE_COLLECT_UNFINISHED_RAIDS] `, e))
                }

                DeleteFile('positions', '', '', `${raid.raidId}_positions`)
                DeleteFile('positions', '', '', `${raid.raidId}_V2_positions.json`)
            }
            logger.log(`Garbage collector is done deleting unfinished raids.`)
        } else {
            logger.log(`All good, no unfinished raids to purge.`)
        }
    } else {
        logger.warn(`Garbage collector for 'unfinished raids' is disabled, watch storage space!`)
    }
}

export { GarbageCollectOldRaids, GarbageCollectUnfinishedRaids }
