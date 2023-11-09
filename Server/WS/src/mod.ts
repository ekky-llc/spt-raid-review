import { DependencyContainer } from "tsyringe";
import type { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import type { IPostAkiLoadMod } from "@spt-aki/models/external/IPostAkiLoadMod";
import type { ILogger } from "@spt-aki/models/spt/utils/ILogger";

import { WebSocketServer } from "ws";

class Mod implements IPreAkiLoadMod, IPostAkiLoadMod {
  wss: null | WebSocketServer;
  logger: ILogger;

  constructor() {
    this.wss = null;
  }

  public preAkiLoad(container: DependencyContainer): void {
    this.logger = container.resolve<ILogger>("WinstonLogger");
    this.logger.info(`STATS: Mod Loaded`);
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

      this.wss.on("start", () => {
        console.log("STATS: Start Raid");
      });

      this.wss.on("kill", () => {
        console.log("STATS: Someone was killed");
      });

      this.wss.on("loot", () => {
        console.log("STATS: Someone looted something");
      });

      this.wss.on("position", () => {
        console.log("STATS: Someones moved somewhere");
      });

      this.wss.on("end", () => {
        console.log("STATS: Finished Raid");
      });

      this.logger.info(`STATS: Websocket Server Listening on 'ws://127.0.0.1:7828'.`);

    }, 1000);
  }
}

module.exports = { mod: new Mod() };
