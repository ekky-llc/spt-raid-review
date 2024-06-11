import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'

// you would have to import / invoke this in another file
export async function database() : Promise<Database<sqlite3.Database, sqlite3.Statement>> {

    const filename = `${__dirname}/../../../data/stats_mod.db`;
    const migrations = `${__dirname}/migrations`;
    console.log('[STATS] Database Path: ', filename);
    console.log('[STATS] Migration Paths: ', migrations);

    const db = await open({
        filename: filename,
        driver: sqlite3.Database
    });

    await db.migrate({
        migrationsPath : migrations,
    })

    return db;
};