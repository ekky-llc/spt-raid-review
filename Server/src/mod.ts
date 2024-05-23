// @ts-ignore
import { DependencyContainer } from "tsyringe";
import { WebSocketServer } from "ws";

import type { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import type { IPostAkiLoadMod } from "@spt-aki/models/external/IPostAkiLoadMod";
import type { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { StaticRouterModService } from "@spt-aki/services/mod/StaticRouter/StaticRouterModService";
import { SaveServer } from "@spt-aki/servers/SaveServer";
import { ProfileHelper } from '@spt-aki/helpers/ProfileHelper';

import WebServer from "./Web/Server/Express";
import { ExtractKeysAndValues } from "./Utils/utils";
import { WriteLineToFile } from "./Controllers/PostRaid/DataSaver";
import CompileRaidData from "./Controllers/PostRaid/CompileRaidData";
import CompileCoreData from "./Controllers/PostRaid/CompileCoreData";
import CompileRaidPositionalData from "./Controllers/PostRaid/CompileRaidPositionalData";

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
  return { session_id, profile_id }
}
class Mod implements IPreAkiLoadMod, IPostAkiLoadMod {
  wss: WebSocketServer;
  logger: ILogger;
  raid_id: string;
  saveServer: SaveServer;

  constructor() {
    this.wss = null;
    this.raid_id = "";
  }

StaticRouter

  public preAkiLoad(container: DependencyContainer):void
  {
    const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService")

    staticRouterModService.registerStaticRouter(
      "GetPlayerInfo",
      [{
        url: "/client/game/start",
        action: (url : string, info : any, sessionId : string, output: string) => 
        {
          setSessionId(sessionId);
          const profileHelper = container.resolve<ProfileHelper>("ProfileHelper");
          const profile = profileHelper.getFullProfile(sessionId);
          setProfileId(profile.info.id);
          console.log(`[STATS] PROFILE_ID: ${profile.info.id}`);
          console.log(`[STATS] PROFILE_NICKNAME: ${profile.info.username}`);
          return output;
        }
      }], "aki"
    )
  }

  public postAkiLoad(container: DependencyContainer): void {
    
    this.saveServer = container.resolve<SaveServer>("SaveServer");     

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

    this.wss.on("connection", function connection(ws) {
      ws.on("error", function (error) {
        console.log(`[STATS] Websocket Error.`);
        console.log(`[STATS:ERROR]`, error);
      });

      ws.on("message", function message(str: string) {
        try {
          let data = JSON.parse(str);

          if (data && data.Action && data.Payload) {
            const payload_object = JSON.parse(data.Payload);
            const { keys, values } = ExtractKeysAndValues(payload_object);
          
            let filename = '';
            switch (data.Action) {
              case "START":
                this.raid_id = payload_object.id;
                console.log(`[STATS] RAID IS SET: ${this.raid_id}`);
                
                filename = `${this.raid_id}_raid`;
                WriteLineToFile(profile_id, 'raids', this.raid_id, filename, keys, values);
                WriteLineToFile(profile_id, 'core', null, 'core', keys, values);
                
                break;
              case "END":
                this.raid_id = payload_object.id;
                console.log(`[STATS] RAID IS SET: ${this.raid_id}`);

                filename = `${this.raid_id}_raid`;
                WriteLineToFile(profile_id, 'raids', this.raid_id, filename, keys, values);
                WriteLineToFile(profile_id, 'core', null, 'core', keys, values);
                CompileRaidData(profile_id, this.raid_id);
                CompileRaidPositionalData(profile_id, this.raid_id);
                CompileCoreData(profile_id);

                this.raid_id = "";
                break;

              case "PLAYER":
                filename = `${this.raid_id}_players`;
                WriteLineToFile(profile_id, 'raids', this.raid_id, filename, keys, values);
                break;

              case "KILL":
                filename = `${this.raid_id}_kills`;
                WriteLineToFile(profile_id, 'raids', this.raid_id, filename, keys, values);
                break;

              case "POSITION":
                filename = `${this.raid_id}_positions`;
                WriteLineToFile(profile_id, 'raids', this.raid_id, filename, keys, values);
                break;

              case "LOOT":
                filename = `${this.raid_id}_looting`;
                WriteLineToFile(profile_id, 'raids', this.raid_id, filename, keys, values);
                break;

              default:
                break;
            }
          }    
        } catch (error) {
          console.log(`[STATS] Message recieved was not valid JSON Object, something broke.`);
          console.log(`[STATS:ERROR]`, error);
          console.log(`[STATS:DUMP]`, str);
        }
      });
    });

    console.log(`[STATS] Websocket Server Listening on 'ws://127.0.0.1:7828'.`);

    WebServer(this.saveServer);
  }

}


module.exports = { mod: new Mod() };
