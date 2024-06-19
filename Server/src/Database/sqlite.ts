import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import { mkdirSync } from 'fs';

// you would have to import / invoke this in another file
export async function database() : Promise<Database<sqlite3.Database, sqlite3.Statement>> {

    mkdirSync(`${__dirname}/../../data`, { recursive: true });

    const filename = `${__dirname}/../../data/raid_review_mod.db`;
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

    return db;
};