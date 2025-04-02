import sqlite3 from 'sqlite3';
import { Database } from "sqlite"
import { Logger } from '../../Utils/logger';
import { randomUUID } from 'crypto';
import { ACTIVE_POSITIONAL_DATA_STRUCTURE } from '../PositionalData/CompileRaidPositionalData';
import { writeFileSync } from 'fs';
import { persist } from './persistanceHandlers';
import { IRaidPayload } from '@spt/raidreview/ws';

export async function importRaidData(db: Database<sqlite3.Database, sqlite3.Statement>, logger : Logger, payload: RaidImportPayload) {

    logger.log(`Starting import of raid, hopefully nothing breaks...`)
    try {
        const raidId = randomUUID();
        const { raid: raidData, positions } = payload;

        // Write positions
        writeFileSync(`${__dirname}/../../../data/positions/${raidId}_${ACTIVE_POSITIONAL_DATA_STRUCTURE}_positions.json`, JSON.stringify(positions), 'utf-8');
        
        const { kills, looting, player_status: player_statuses, ballistic, players, ...raid } = raidData;

        // Write Raid
        delete raid.id;
        delete raid.raidId;
        delete raid.created_at;
               raid.imported = 1;
        const raidPayload = { ...raid } as unknown as IRaidPayload;
        await persist.endRaid(db, raidId, raidPayload, logger);

        // Write Players
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            delete player.id;
            delete player.raidId;
            delete player.created_at;
            const playerPayload = { ...player }

            await persist.insertPlayer(db, raidId, playerPayload, logger)
        }

        // Write Kills
        for (let i = 0; i < kills.length; i++) {
            const kill = kills[i];
            delete kill.id;
            delete kill.raidId;
            delete kill.created_at;
            const killPayload = { ...kill }

            await persist.insertKill(db, raidId, killPayload, logger)
        }

        // Write Ballistics
        for (let i = 0; i < ballistic.length; i++) {
            const ball = ballistic[i];
            delete ball.id;
            delete ball.raidId;
            delete ball.created_at;
            const ballPayload = { ...ball }

            await persist.insertBallistic(db, raidId, ballPayload, logger)
        }
        
        // Write Looting
        for (let i = 0; i < looting.length; i++) {
            const loot = looting[i];
            delete loot.id;
            delete loot.raidId;
            delete loot.created_at;
            const lootPayload = { ...loot }

            await persist.insertLoot(db, raidId, lootPayload, logger)
        }
        
        // Write Player Status
        for (let i = 0; i < player_statuses.length; i++) {
            const player_status  = player_statuses[i];
            delete player_status.id;
            delete player_status.raidId;
            const playerStatusPayload = { ...player_status }

            await persist.insertPlayerStatus(db, raidId, playerStatusPayload, logger)
        }
        
        return raidId;
    } 
    
    catch (error) {
        logger.error(`There was a problem importing raid data, ooooops.`)
    }
    
    finally {
        logger.log(`We finished importing raid data!`)
    }

}

interface RaidImportPayload {
    raid: {
      id?: number
      raidId?: string
      profileId: string
      location: string
      time: string
      timeInRaid: string
      exitName: string
      exitStatus: string
      detectedMods: string
      created_at: string
      type: string
      imported?: number,
      kills: Array<{
        id: number
        raidId: string
        profileId: string
        time: number
        killedId: string
        weapon: string
        distance: string
        bodyPart: string
        positionKilled: string
        positionKiller: string
        created_at: string
      }>
      looting: Array<{
        id: number
        raidId: string
        profileId: string
        time: string
        qty: string
        itemId: string
        itemName: string
        added: string
        created_at: string
      }>
      player_status: Array<{
        id: number
        raidId: string
        profileId: string
        time: number
        status: string
      }>
      ballistic: Array<{
        id: number
        raidId: string
        profileId: string
        time: number
        weaponId: string
        ammoId: string
        hitPlayerId: any
        source: string
        target: string
        created_at: string
      }>
      positionsTracked: string
      players: Array<{
        id: number
        raidId: string
        profileId: string
        level: number
        team: string
        name: string
        group: number
        spawnTime: number
        created_at: string
        mod_SAIN_brain: string
        type: string
        mod_SAIN_difficulty: string
      }>
    }
    positions: {
      [key: string]: Array<{
        sessionId: string
        profileId: string
        time: number
        x: number
        y: number
        z: number
        dir: number
        health: number
        maxHealth: number
      }>
    }
}
  