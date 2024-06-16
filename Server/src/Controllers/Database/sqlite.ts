import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import { mkdirSync } from 'fs';

// you would have to import / invoke this in another file
export async function database() : Promise<Database<sqlite3.Database, sqlite3.Statement>> {

    mkdirSync(`${__dirname}/../../../data`, { recursive: true });

    const filename = `${__dirname}/../../../data/raid_review_mod.db`;
    const migrations = `${__dirname}/migrations`;
    console.log('[RAID-REVIEW] Database Path: ', filename);
    console.log('[RAID-REVIEW] Migration Paths: ', migrations);

    const db = await open({
        filename: filename,
        driver: sqlite3.Database
    });

    await db.migrate({
        migrationsPath : migrations,
    })

    // Check if the 'brain' column exists and add it if it does not
    const tableName = 'player';
    const columnName = 'brain';

    const exists = await columnExists(db, tableName, columnName);
    if (!exists) {
        await db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} TEXT DEFAULT 'UNKNOWN';`);
        console.log(`Column '${columnName}' added to table '${tableName}'.`);
    } else {
        console.log(`Column '${columnName}' already exists in table '${tableName}'.`);
    }

    return db;
};

// Function to check if a column exists
async function columnExists(db: Database<sqlite3.Database, sqlite3.Statement>, table: string, column: string): Promise<boolean> {
    const columns = await db.all(`PRAGMA table_info(${table});`);
    return columns.some((col: any) => col.name === column);
}