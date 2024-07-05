import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import { mkdirSync } from 'fs';
import { Logger } from '../Utils/logger';

// you would have to import / invoke this in another file
export async function database(logger: Logger) : Promise<Database<sqlite3.Database, sqlite3.Statement>> {

    mkdirSync(`${__dirname}/../../data`, { recursive: true });

    const filename = `${__dirname}/../../data/raid_review_mod.db`;
    const migrations = `${__dirname}/migrations`;
    logger.log('Database Path: ' + filename);
    logger.log('Migration Paths: ' + migrations);

    const db = await open({
        filename: filename,
        driver: sqlite3.Database
    });

    await db.migrate({
        migrationsPath : migrations
    })

    return db;
};