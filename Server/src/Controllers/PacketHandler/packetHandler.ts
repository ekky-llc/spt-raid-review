import sqlite3 from 'sqlite3';
import { Database } from "sqlite"
import cron from "node-cron";
import type { RawData } from 'ws';
import { ExtractKeysAndValues } from "../../Utils/utils";
import { WriteLineToFile } from "../FileSystem/DataSaver";
import { NoOneLeftBehind } from "../DataIntegrity/NoOneLeftBehind";
import { SessionManager, SessionManagerPlayerMap } from "../StateManagers/sessionManager";
import { ModDetector } from "../Integrations/modDetection";
import { CONSTANTS } from "../../constant";
import { Logger } from '../../Utils/logger';
import { ISptProfile } from '@spt/models/eft/profile/ISptProfile';
import { CheckForMissingMainPlayer } from '../DataIntegrity/CheckForMissingMainPlayer';
import { persist } from '../Persistance/persistanceHandlers';

async function messagePacketHandler(rawData: RawData, db: Database<sqlite3.Database, sqlite3.Statement>, sessionManager: SessionManager, modDetector: ModDetector, logger : Logger, profiles: Record<string, ISptProfile>, post_raid_processing: cron.ScheduledTask) {
    try {

        // Convert RawData to string if it's a buffer
        let str: string;
        if (typeof rawData === 'string') {
            str = rawData;
        } 
        
        else if (rawData instanceof Buffer) {
            str = rawData.toString('utf-8');
        } 
        
        else {
            logger.error(`Unsupported message format received.`, rawData);
            return;
        }

        if (str.includes('WS_CONNECTED')) {
            logger.log(`Web Socket Client Connected`);
            return;
        }

        let data = JSON.parse(str);
        let filename = "";

        if (data && data.Action && data.Payload) {
            const payload_object = JSON.parse(data.Payload);

            // Debug payloads
            if (data.Action !== "POSITION") {
                logger.debug(`${data.Action}|${JSON.stringify(payload_object)}`);
            }

            // "sessionId" is the profileId of the player we're getting the data from
            let sessionManagerProfile = sessionManager.getProfile(payload_object.sessionId);
            if (!sessionManagerProfile) return;

            // "raidId" is pulled from the 'raidId' property against a 'RaidManagerPlayer'
            let raidId = sessionManagerProfile.raidId;

            // Keeps the raid and profile alive (...takes approx. 3 minutes to timeout).
            if (raidId) {
                sessionManager.pingRaid(raidId);
                sessionManager.pingProfile(payload_object.sessionId);
            }
            
            else if (!raidId && data.Action !== "START") {
                // Throw away statements without a RAID Id, should catch random errors too.
                logger.debug(`[MISSING_VALUE:'raidId'] ${data.Action}|${JSON.stringify(payload_object)}`)
                return;
            }

            // Fika Check
            const isFikaInstalled = modDetector.isModInstalled(CONSTANTS.MOD_SIGNATURES.FIKA);
            const { keys, values } = ExtractKeysAndValues(payload_object);
            switch (data.Action) {
                case "START":
                    logger.log(`Recieved 'START' trigger.`);

                    // FIKA Raid Handler
                    if (isFikaInstalled.server) {
                        logger.debug(`[START:RAID_GENERATOR] IS_FIKA_RAID: TRUE`);

                        raidId = crypto.randomUUID();
                        logger.debug(`[START:RAID_GENERATOR] RAID_ID: '${raidId}'`);
    
                        // Add RaidId to player
                        let player = sessionManager.getProfile(payload_object.sessionId);
                        player.raidId = raidId;
                        
                        // Create Player Map, and register raid
                        const players = new Map<string, string>();
                        players.set(payload_object.sessionId, sessionManagerProfile.profile.info.id);
                        sessionManager.addRaid(raidId, { raidId, players, timeout: 0, isFikaRaid: true });  
                    }

                    // SPT Raid Start Handler
                    else {
                        logger.debug(`[START:RAID_GENERATOR] IS_FIKA_RAID: FALSE`);

                        raidId = crypto.randomUUID();
                        logger.debug(`[START:RAID_GENERATOR] RAID_ID: '${raidId}'`);
    
                        // Add RaidId to player
                        let player = sessionManager.getProfile(payload_object.sessionId);
                        player.raidId = raidId;
                        
                        // Create Player Map, and register raid
                        const players = new Map<string, string>();
                        players.set(payload_object.sessionId, sessionManagerProfile.profile.info.id);
                        sessionManager.addRaid(raidId, { raidId, players, timeout: 0, isFikaRaid: false });    
                    }
                    
                    logger.debug(`[START:RAIDS] ` +  JSON.stringify(Array.from(sessionManager.getRaids().entries())));

                    post_raid_processing.stop();
                    logger.log(`Disabled Post Processing: Raid Started`);

                    persist.startRaid(db, raidId, payload_object, logger);

                    break;

                case "END":

                    logger.debug(`[END:RAIDS] ` + JSON.stringify(Array.from(sessionManager.getRaids().entries())));
                    logger.debug(`[END:PROFILES] ` + JSON.stringify(Array.from(sessionManager.getProfiles().entries()).map(p => p[1].profile = null)));

                    persist.endRaid(db, raidId, payload_object, logger);

                    // FIKA Raid Handler
                    if (isFikaInstalled.client && isFikaInstalled.server) {
                        sessionManager.removeRaid(raidId, CONSTANTS.REASON_RAID_REMOVAL__CLIENT_PACKET);
                    }

                    // SPT Raid End Handler
                    if (raidId) {
                        sessionManager.removeRaid(raidId, CONSTANTS.REASON_RAID_REMOVAL__CLIENT_PACKET);
                    }

                    CheckForMissingMainPlayer(db, logger, profiles);

                    post_raid_processing.start();
                    logger.log(`Enabled Post Processing: Raid Finished`);
                    break;

                case "PLAYER_CHECK":
                    
                    await NoOneLeftBehind(db, logger, raidId, payload_object);
                    break;

                case "PLAYER_UPDATE":
                    
                    persist.updatePlayer(db, raidId, payload_object, logger);
                    break;
                
                case "PLAYER_STATUS":

                    persist.insertPlayerStatus(db, raidId, payload_object, logger);
                    break;
                    
                case "PLAYER":

                    const playerExists = await persist.checkPlayerExists(db, raidId, payload_object, logger);
                    if (playerExists && playerExists.length) return;
                    persist.insertPlayer(db, raidId, payload_object, logger);
                    break;

                case "BALLISTIC":

                    persist.insertBallistic(db, raidId, payload_object, logger);
                    break;

                case "KILL":

                    persist.insertKill(db, raidId, payload_object, logger);
                    break;

                case "POSITION":
                    if (raidId) {
                        filename = `${raidId}_positions`;
                        WriteLineToFile(logger, "positions", "", "", filename, keys, values);
                    }

                    break;

                case "LOOT":

                    persist.insertLoot(db, raidId, payload_object, logger);
                    break;

                default:
                    break;
            }
        }
    } catch (err) {
        logger.error(`[WS_DATA_ERR]`, err);
        logger.error(`[WS_DATA_ERR]`, rawData);
    }
}

async function errorPacketHandler(error: Error, logger: Logger) {
    logger.error(`[WS_ERR]`, error);
}

export { messagePacketHandler, errorPacketHandler };
