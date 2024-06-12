// @ts-ignore
import { DependencyContainer } from "tsyringe";
import { WebSocketServer } from "ws";

import type { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import type { IPostAkiLoadMod } from "@spt-aki/models/external/IPostAkiLoadMod";
import type { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { StaticRouterModService } from "@spt-aki/services/mod/StaticRouter/StaticRouterModService";
import { SaveServer } from "@spt-aki/servers/SaveServer";
import { ProfileHelper } from "@spt-aki/helpers/ProfileHelper";
import { MailSendService } from "@spt-aki/services/MailSendService";

import WebServer from "./Web/Server/Express";
import { ExtractKeysAndValues } from "./Utils/utils";
import { WriteLineToFile } from "./Controllers/Collection/DataSaver";
import { database } from "./Controllers/Database/sqlite";
import sqlite3 from "sqlite3";
import { Database } from "sqlite";
import _ from 'lodash';
import CompileRaidPositionalData from "./Controllers/Collection/CompileRaidPositionalData";

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
  post_process: boolean;
  saveServer: SaveServer;
  mailSendService: MailSendService;
  database: Database<sqlite3.Database, sqlite3.Statement>;

  constructor() {
    this.wss = null;
    this.raid_id = "";
    this.database = null;
    this.post_process = true;
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

    this.saveServer = container.resolve<SaveServer>("SaveServer");
    this.mailSendService = container.resolve<MailSendService>("MailSendService");
    console.log(`[RAID-REVIEW] SPT-AKI Server Connected`);

    this.wss = new WebSocketServer({
      port: 7828,
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
                this.post_process = false;
                console.log(`[RAID-REVIEW] Disabling Post Processing`);

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

                CompileRaidPositionalData(this.raid_id);

                this.raid_id = "";
                console.log(`[RAID-REVIEW] Clearing Raid Id`);

                this.post_process = true;
                console.log(`[RAID-REVIEW] Enabling Post Processing`);
                break;
                
              case "PLAYER":
                const player_sql = `INSERT INTO player (raidId, profileId, level, team, name, "group", spawnTime) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                this.database
                  .run(player_sql, [
                    this.raid_id,
                    payload_object.profileId,
                    payload_object.level,
                    payload_object.team,
                    payload_object.name,
                    payload_object.group,
                    payload_object.spawnTime,
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

                filename = `${this.raid_id}_positions`;
                WriteLineToFile('positions', '', '', filename, keys, values);

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
