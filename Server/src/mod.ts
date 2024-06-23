// @ts-ignore
import { DependencyContainer } from "tsyringe";
import { WebSocketServer } from "ws";
import cron from 'node-cron';
import sqlite3 from "sqlite3";
import { Database } from "sqlite";
import _ from 'lodash';

import type { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import type { IPostAkiLoadMod } from "@spt-aki/models/external/IPostAkiLoadMod";
import type { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { StaticRouterModService } from "@spt-aki/services/mod/StaticRouter/StaticRouterModService";
import { SaveServer } from "@spt-aki/servers/SaveServer";
import { ProfileHelper } from "@spt-aki/helpers/ProfileHelper";
import { MailSendService } from "@spt-aki/services/MailSendService";

import config from '../config.json';
import { NotificationLimiter } from './types'
import WebServer from "./Web/Server/Express";
import { database } from "./Database/sqlite";
import { ExtractKeysAndValues } from "./Utils/utils";
import { NOTIFICATION_LIMITER_DEFAULT } from "./Utils/constant";
import { WriteLineToFile } from "./Controllers/FileSystem/DataSaver";
import { MigratePositionsStructure } from "./Controllers/PositionalData/PositionsMigration";
import { CheckForMissingMainPlayer } from "./Controllers/DataIntegrity/CheckForMissingMainPlayer";
import { NoOneLeftBehind } from "./Controllers/DataIntegrity/NoOneLeftBehind";
import { GarbageCollectOldRaids, GarbageCollectUnfinishedRaids } from "./Controllers/DataIntegrity/TheGarbageCollector";
import { sendStatistics } from "./Controllers/Telemetry/RaidStatistics";
import CompileRaidPositionalData from "./Controllers/PositionalData/CompileRaidPositionalData";

export let session_id = null;
export let profile_id = null;

export function setSessionId(sessionId: string) {
  session_id = sessionId;
  return;
}

export function setProfileId(profileId: string) {
  profile_id = profileId;
  return;
}

export function getSessiondata() {
  return { session_id, profile_id };
}
class Mod implements IPreAkiLoadMod, IPostAkiLoadMod {
  wss: WebSocketServer;
  logger: ILogger;
  raid_id: string;
  raids_to_process: string[];
  notificationLimiter: NotificationLimiter;
  post_process: boolean;
  saveServer: SaveServer;
  mailSendService: MailSendService;
  database: Database<sqlite3.Database, sqlite3.Statement>;

  constructor() {
    this.wss = null;
    this.raid_id = "";
    this.raids_to_process = [];
    this.database = null;
    this.post_process = true;
    this.notificationLimiter = NOTIFICATION_LIMITER_DEFAULT;
  }

  public preAkiLoad(container: DependencyContainer): void {
    const staticRouterModService = container.resolve<StaticRouterModService>(
      "StaticRouterModService"
    );

    staticRouterModService.registerStaticRouter(
      "EnablePostProcess",
      [
        {
          url : "/client/hideout/areas",
          action : (
            url: string,
            info: any,
            sessionId: string,
            output: string
          ) => {
            if (!this.raid_id && !this.post_process){
              console.log(`[RAID-REVIEW] Enabling Post Processing`);
              this.post_process = true;
            }
            return output;
          },
        }
      ],
      "aki"
    );

    staticRouterModService.registerStaticRouter(
      "GetPlayerInfo",
      [
        {
          url: "/client/game/start",
          action: (
            url: string,
            info: any,
            sessionId: string,
            output: string
          ) => {
            setSessionId(sessionId);
            const profileHelper =
              container.resolve<ProfileHelper>("ProfileHelper");
            const profile = profileHelper.getFullProfile(sessionId);
            setProfileId(profile.info.id);
            console.log(`[RAID-REVIEW] PROFILE_ID: ${profile.info.id}`);
            console.log(`[RAID-REVIEW] PROFILE_NICKNAME: ${profile.info.username}`);
            return output;
          },
        }
      ],
      "aki"
    );
    
  }

  public async postAkiLoad(container: DependencyContainer): Promise<void> {
    this.database = await database();
    console.log(`[RAID-REVIEW] Database Connected`);

    // Data Position Migration
    // @ekky @ 2024-06-18: Added this for the move from v0.0.3 to v0.0.4
    await MigratePositionsStructure(this.database);

    // Missing Player Fix
    // @ekky @ 2024-06-19: Added this to help fix this 'Issue # 25'
    const profileHelper = container.resolve<ProfileHelper>("ProfileHelper");
    const profiles = profileHelper.getProfiles();
    await CheckForMissingMainPlayer(this.database, profiles)

    // Storage Saving Helpers
    await GarbageCollectOldRaids(this.database);
    await GarbageCollectUnfinishedRaids(this.database);
    if (config.autoDeleteCronJob) {
      cron.schedule('0 */1 * * *', async () => {
        await GarbageCollectOldRaids(this.database);
        await GarbageCollectUnfinishedRaids(this.database);
      });
    }

    // Automatic Processor
    const post_raid_processing = cron.schedule('*/1 * * * *', async () => {
      if (this.raids_to_process.length > 0) {
        for (let i = 0; i < this.raids_to_process.length; i++) {
          const raidIdToProcess = this.raids_to_process[i];
          let positional_data = CompileRaidPositionalData(raidIdToProcess);
          
          let telemetryEnabled = config.telemetry;
          if (telemetryEnabled) {
            console.log(`[RAID-REVIEW] Telemetry is enabled.`)
            await sendStatistics(this.database, profile_id, raidIdToProcess, positional_data);
          } else {
            console.log(`[RAID-REVIEW] Telemetry is disabled.`)
          }

          this.raids_to_process = [];
        }
      }
    }, { scheduled: false });
    post_raid_processing.start();

    this.saveServer = container.resolve<SaveServer>("SaveServer");
    console.log(`[RAID-REVIEW] SPT Server Connected.`);

    this.wss = new WebSocketServer({
      port: config.web_socket_port || 7828,
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3,
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024,
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10,
        threshold: 1024,
      },
    });

    this.wss.on("connection", async (ws) => {

      ws.on("error", async (error) => {
        console.log(`[RAID-REVIEW] Websocket Error.`);
        console.log(`[RAID-REVIEW:ERROR]`, error);
      });

      ws.on("message", async (str: string) => {
        try {

          if (str.includes('WS_CONNECTED')) {
            console.log(`[RAID-REVIEW] Web Socket Client Connected`);
            return;
          }

          let data = JSON.parse(str);
          let filename = '';

          if (data && data.Action && data.Payload) {
            const payload_object = JSON.parse(data.Payload);

            if (this.raid_id) {
              payload_object.raid_id = this.raid_id
            }

            if (!payload_object.profileId) {
              payload_object.profileId = profile_id;
            }

            const { keys, values } = ExtractKeysAndValues(payload_object);
            switch (data.Action) {
              case "START":
                post_raid_processing.stop();
                console.log(`[RAID-REVIEW] Disabled Post Processing`);

                this.raid_id = payload_object.id;
                console.log(`[RAID-REVIEW] RAID IS SET: ${this.raid_id}`);

                const start_raid_sql = `INSERT INTO raid (raidId, profileId, location, time, timeInRaid, exitName, exitStatus, detectedMods) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                this.database.run(start_raid_sql, [
                  this.raid_id,
                  profile_id || payload_object.profileId,
                  payload_object.location,
                  payload_object.time,
                  payload_object.timeInRaid,
                  payload_object.exitName || '',
                  payload_object.exitStatus || -1,
                  payload_object.detectedMods || '',
                ]);

                console.log(`[RAID-REVIEW] Recieved 'Recording Start' trigger.`)
                this.notificationLimiter.raid_start = true;
                ws.send("RECORDING_START");

                break;

              case "END":
                this.raid_id = payload_object.id;
                console.log(`[RAID-REVIEW] RAID IS SET: ${this.raid_id}`);

                const end_raid_sql = `INSERT INTO raid (raidId, profileId, location, time, timeInRaid, exitName, exitStatus, detectedMods) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                this.database
                  .run(end_raid_sql, [
                    this.raid_id,
                    profile_id || payload_object.profileId,
                    payload_object.location,
                    payload_object.time,
                    payload_object.timeInRaid,
                    payload_object.exitName || '',
                    payload_object.exitStatus || -1,
                    payload_object.detectedMods || '',
                  ])
                  .catch((e: Error) => console.error(e));

                this.raids_to_process.push(this.raid_id)

                this.raid_id = "";
                console.log(`[RAID-REVIEW] Clearing Raid Id`);

                post_raid_processing.start();
                console.log(`[RAID-REVIEW] Enabled Post Processing`);
                break;
                
              case "PLAYER_CHECK":

                await NoOneLeftBehind(this.database, this.raid_id, payload_object);
                break;

              case "PLAYER":

                const playerExists_sql = `SELECT * FROM player WHERE raidId = ? AND profileId = ?`
                const playerExists = await this.database
                .all(playerExists_sql, [
                  this.raid_id,
                  payload_object.profileId
                ])
                .catch((e: Error) => console.error(e));

                // Stops duplicates, it's hacky, but it's working...
                if (playerExists && playerExists.length) {
                  return;
                }

                const player_sql = `INSERT INTO player (raidId, profileId, level, team, name, "group", spawnTime, mod_SAIN_brain, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                this.database
                  .run(player_sql, [
                    this.raid_id,
                    payload_object.profileId,
                    payload_object.level,
                    payload_object.team,
                    payload_object.name,
                    payload_object.group,
                    payload_object.spawnTime,
                    payload_object.mod_SAIN_brain,
                    payload_object.type
                  ])
                  .catch((e: Error) => console.error(e));

                break;

              case "KILL":
                const kill_sql = `INSERT INTO kills (raidId, time, profileId, killedId, weapon, distance, bodyPart, positionKiller, positionKilled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                this.database
                  .run(kill_sql, [
                    this.raid_id,
                    payload_object.time,
                    payload_object.profileId,
                    payload_object.killedId,
                    payload_object.weapon,
                    payload_object.distance,
                    payload_object.bodyPart,
                    payload_object.positionKiller,
                    payload_object.positionKilled
                  ])
                  .catch((e: Error) => console.error(e));

                break;

              case "POSITION":

              if (this.raid_id) {
                filename = `${this.raid_id}_positions`;
                WriteLineToFile('positions', '', '', filename, keys, values);
              }

                break;

              case "LOOT":

                const loot_sql = `INSERT INTO looting (raidId, profileId, time, qty, itemId, itemName, added) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                this.database
                  .run(loot_sql, [
                    this.raid_id,
                    payload_object.profileId,
                    payload_object.time,
                    payload_object.qty,
                    payload_object.itemId,
                    payload_object.itemName,
                    payload_object.added,
                  ])
                  .catch((e: Error) => console.error(e));

                break;

              default:
                break;
            }
          }
        } catch (error) {
          console.log(
            `[RAID-REVIEW] Message recieved was not valid JSON Object, something broke.`
          );
          console.log(`[RAID-REVIEW:ERROR]`, error);
          console.log(`[RAID-REVIEW:DUMP]`, str);
        }
      });
    });

    console.log(`[RAID-REVIEW] Websocket Server Listening on 'ws://127.0.0.1:7828'.`);

    WebServer(this.saveServer, this.database);
  }
}

module.exports = { mod: new Mod() };
