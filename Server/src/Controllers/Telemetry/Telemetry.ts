import { Database } from "sqlite"
import sqlite3 from 'sqlite3';

export async function isTelemetryEnabled(db: Database<sqlite3.Database, sqlite3.Statement>) : Promise<boolean> {
    try {
        const sqlSettingsQuery = `SELECT * FROM setting WHERE key = 'telemetry_enabled'`;
        const data = await db.all(sqlSettingsQuery).catch((e: Error) => console.error(e));
        
        let result = data[0];
        if (result.value === '1') {
            return true;
        }

        return false;
    }

    catch(e) {
        console.log(`[RAID-REVIEW] There was an issue checking if Telemetry is enabled.`)
        return false;
    }

}