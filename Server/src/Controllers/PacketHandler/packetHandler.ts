import { ExtractKeysAndValues } from "../../Utils/utils";
import cron from "node-cron";
import { WriteLineToFile } from "../FileSystem/DataSaver";
import { NoOneLeftBehind } from "../DataIntegrity/NoOneLeftBehind";
import { SessionManager, SessionManagerPlayerMap } from "../StateManagers/sessionManager";
import { ModDetector } from "../Integrations/modDetection";
import { CONSTANTS } from "src/constant";

async function messagePacketHandler(str: string, sessionManager: SessionManager, modDetector: ModDetector, post_raid_processing: cron.ScheduledTask) {
    try {
        if (str.includes("WS_CONNECTED")) {
            console.log(`[RAID-REVIEW] Web Socket Client Connected`);
            return;
        }

        let data = JSON.parse(str);
        let filename = "";

        if (data && data.Action && data.Payload) {
            const payload_object = JSON.parse(data.Payload);

            // "sessionId" is the profileId of the player we're getting the data from
            let sessionManagerProfile = sessionManager.getProfile(payload_object.sessionId);
            if (!sessionManagerProfile) return;

            // "raidId" is pulled from the 'raidId' property against a 'RaidManagerPlayer'
            let raidId = sessionManagerProfile.raidId;

            // Keeps the raid and profile alive (...takes approx. 3 minutes to timeout).
            sessionManager.pingRaid(raidId);
            sessionManager.pingProfile(payload_object.sessionId);

            // Fika Check
            const isFikaInstalled = modDetector.isModInstalled(CONSTANTS.MOD_SIGNATURES.SAIN);

            const { keys, values } = ExtractKeysAndValues(payload_object);
            switch (data.Action) {
                case "START":
                    console.log(`[RAID-REVIEW] Recieved 'START' trigger.`);

                    // FIKA Raid Handler
                    if (isFikaInstalled.client && isFikaInstalled.server) {
                        console.log(`[RAID-REVIEW] SERVER Mod Detected: FIKA Server.`);
                        console.log(`[RAID-REVIEW] CLIENT Mod Detected: FIKA Client.`);
                    }

                    // SPT Raid Start Handler
                    else {
                        const raidId = crypto.randomUUID();
                        const players = null as SessionManagerPlayerMap;
                        players.set(payload_object.sessionId, sessionManagerProfile.profile);
                        sessionManager.addRaid(raidId, { raidId, players, timeout: 0 });
                    }

                    post_raid_processing.stop();
                    console.log(`[RAID-REVIEW] Disabled Post Processing`);

                    const start_raid_sql = `INSERT INTO raid (raidId, profileId, location, time, timeInRaid, exitName, exitStatus, detectedMods) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                    this.database.run(start_raid_sql, [
                        raidId,
                        payload_object.profileId,
                        payload_object.location,
                        payload_object.time,
                        payload_object.timeInRaid,
                        payload_object.exitName || "",
                        payload_object.exitStatus || -1,
                        payload_object.detectedMods || "",
                    ]);

                    break;

                case "END":
                    const end_raid_sql = `INSERT INTO raid (raidId, profileId, location, time, timeInRaid, exitName, exitStatus, detectedMods) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                    this.database
                        .run(end_raid_sql, [
                            raidId,
                            payload_object.profileId,
                            payload_object.location,
                            payload_object.time,
                            payload_object.timeInRaid,
                            payload_object.exitName || "",
                            payload_object.exitStatus || -1,
                            payload_object.detectedMods || "",
                        ])
                        .catch((e: Error) => console.error(e));

                    this.raids_to_process.push(raidId);

                    // FIKA Raid Handler
                    if (isFikaInstalled.client && isFikaInstalled.server) {
                    }

                    // SPT Raid End Handler
                    if (raidId) {
                        sessionManager.removeRaid(raidId, CONSTANTS.REASON_RAID_REMOVAL__CLIENT_PACKET);
                    }

                    post_raid_processing.start();
                    console.log(`[RAID-REVIEW] Enabled Post Processing`);
                    break;

                case "PLAYER_CHECK":
                    await NoOneLeftBehind(this.database, raidId, payload_object);
                    break;

                case "PLAYER_UPDATE":
                    const player_update_sql = "UPDATE player SET mod_SAIN_brain = ?, type = ? WHERE raidId = ? AND profileId = ?";
                    this.database.run(player_update_sql, [payload_object.mod_SAIN_brain, payload_object.type, this.raid_id, payload_object.profileId]).catch((e: Error) => console.error(e));
                    break;

                case "PLAYER":
                    const playerExists_sql = `SELECT * FROM player WHERE raidId = ? AND profileId = ?`;
                    const playerExists = await this.database.all(playerExists_sql, [raidId, payload_object.profileId]).catch((e: Error) => console.error(e));

                    // Stops duplicates, it's hacky, but it's working...
                    if (playerExists && playerExists.length) {
                        return;
                    }

                    const player_sql = `INSERT INTO player (raidId, profileId, level, team, name, "group", spawnTime, mod_SAIN_brain, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    this.database
                        .run(player_sql, [
                            raidId,
                            payload_object.profileId,
                            payload_object.level,
                            payload_object.team,
                            payload_object.name,
                            payload_object.group,
                            payload_object.spawnTime,
                            payload_object.mod_SAIN_brain,
                            payload_object.type,
                        ])
                        .catch((e: Error) => console.error(e));

                    break;

                case "KILL":
                    const kill_sql = `INSERT INTO kills (raidId, time, profileId, killedId, weapon, distance, bodyPart, positionKiller, positionKilled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    this.database
                        .run(kill_sql, [
                            raidId,
                            payload_object.time,
                            payload_object.profileId,
                            payload_object.killedId,
                            payload_object.weapon,
                            payload_object.distance,
                            payload_object.bodyPart,
                            payload_object.positionKiller,
                            payload_object.positionKilled,
                        ])
                        .catch((e: Error) => console.error(e));

                    break;

                case "POSITION":
                    if (raidId) {
                        filename = `${raidId}_positions`;
                        WriteLineToFile("positions", "", "", filename, keys, values);
                    }

                    break;

                case "LOOT":
                    const loot_sql = `INSERT INTO looting (raidId, profileId, time, qty, itemId, itemName, added) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                    this.database
                        .run(loot_sql, [raidId, payload_object.profileId, payload_object.time, payload_object.qty, payload_object.itemId, payload_object.itemName, payload_object.added])
                        .catch((e: Error) => console.error(e));

                    break;

                default:
                    break;
            }
        }
    } catch (error) {
        console.log(`[RAID-REVIEW] Message recieved was not valid JSON Object, something broke.`);
        console.log(`[RAID-REVIEW:ERROR]`, error);
        console.log(`[RAID-REVIEW:DUMP]`, str);
    }
}

async function errorPacketHandler(error: Error) {
    console.log(`[RAID-REVIEW] Websocket Error.`);
    console.log(`[RAID-REVIEW:ERROR]`, error);
}

export { messagePacketHandler, errorPacketHandler };
