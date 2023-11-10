import { DependencyContainer } from "tsyringe";
import type { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import type { IPostAkiLoadMod } from "@spt-aki/models/external/IPostAkiLoadMod";
import type { ILogger } from "@spt-aki/models/spt/utils/ILogger";

import { WebSocketServer } from "ws";
import { ExtractKeysAndValues } from './utils';
import { WriteLineToFile } from './stats_saver';
 
class Mod implements IPreAkiLoadMod, IPostAkiLoadMod {
  wss: null | WebSocketServer;
  logger: ILogger;
  raid_id: string;

  constructor() {
    this.wss = null;
    this.raid_id = '';
  }

  public preAkiLoad(container: DependencyContainer): void {
    console.log(`[STATS] Mod Loaded`);
  }

  public postAkiLoad(container: DependencyContainer): void {
    setTimeout(() => {
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

      this.wss.on('connection', function connection(ws) {
        ws.on('error', function(error) {
          console.log(`[STATS] Websocket Error.`);
          console.log(error);
        });
      
        ws.on("message", function message(str : string) {
          try {
            let data = JSON.parse(str);
            if (data && data.Action && data.Payload) {

              const payload_object = JSON.parse(data.Payload);
              const { keys, values } = ExtractKeysAndValues(payload_object)

              switch (data.Action) {
                case "START":
                  this.raid_id = JSON.parse(data.Payload).id;
                  WriteLineToFile(this.raid_id, `${this.raid_id}_raid`, keys, values);
                  break;
                case "END":
                  WriteLineToFile(this.raid_id, `${this.raid_id}_raid`, keys, values);
                  this.raid_id = '';
                  break;
                case "PLAYER":
                  WriteLineToFile(this.raid_id, `${this.raid_id}_players`, keys, values);
                  break;
                case "KILL":
                  WriteLineToFile(this.raid_id, `${this.raid_id}_kills`, keys, values);
                  break;
                case "AGGRESSION":
                  WriteLineToFile(this.raid_id, `${this.raid_id}_aggressions`, keys, values);
                  break;
                case "POSITION":
                  WriteLineToFile(this.raid_id, `${this.raid_id}_positions`, keys, values);
                  break;
                case "LOOT":
                  WriteLineToFile(this.raid_id, `${this.raid_id}_looting`, keys, values);
                  break;
                default:
                  break;
              }
            }
          } 
          
          catch (error) {
            console.log(`[STATS] Message '${str}' was not valid JSON Object, something broke.`);
          }
        });
      });

      console.log(`[STATS] Websocket Server Listening on 'ws://127.0.0.1:7828'.`);

    }, 1000);
  }
}

module.exports = { mod: new Mod() };
