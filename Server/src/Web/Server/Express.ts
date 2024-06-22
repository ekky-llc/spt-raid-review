import express, { Express, NextFunction, Request, Response } from "express";
import { mkdirSync, rmSync } from "fs";
import path from "path";
import cors from "cors";
import _ from "lodash";
import { Database } from "sqlite";
import sqlite3 from "sqlite3";
import cookieParser from 'cookie-parser';
import basicAuth from 'express-basic-auth';

import { SaveServer } from "@spt-aki/servers/SaveServer";
import { IAkiProfile } from "@spt-aki/models/eft/profile/IAkiProfile";

import config from '../../../config.json';
import { DeleteFile, ReadFile } from "../../Controllers/FileSystem/DataSaver";
import CompileRaidPositionalData from "../../Controllers/PositionalData/CompileRaidPositionalData";
import { generateInterpolatedFramesBezier } from "../../Utils/utils";
import { getRaidData } from "../../Controllers/Collection/GetRaidData";
import { sendStatistics } from "../../Controllers/Telemetry/RaidStatistics";

const app: Express = express();
const port = config.web_client_port || 7829;
export interface TrackingPositionalData {
  id: Number;
  raidId: String;
  profileId: String;
  time: Number;
  x: Number;
  y: Number;
  z: Number;
  dir: Number;
  created_at: Date;
}

function isUserAdmin(req: Request, res: Response, next: NextFunction) {

  if (config.basic_auth && req.auth) {
    console.log(`[RAID-REVIEW] Confirming if '${req.auth.user}' is an admin`);
    const isAdmin = config.admin[req.auth.user];
    if (isAdmin) {
      console.log(`[RAID-REVIEW] '${req.auth.user}' is an admin.`);
      return next();
    }
    res.status(401).json({ status: 'ERROR', message: 'You are not authorised.' })
  }

  return next();
}

function StartWebServer(
  saveServer: SaveServer,
  db: Database<sqlite3.Database, sqlite3.Statement>
) {

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // Basic Auth has been implemented for people who host Fika remotely.
  // It's not the greatest level of protection, but I cannot be arsed to implement oAuth for sucha niche use case.
  if (config.basic_auth) {
    app.use(basicAuth({
      users: config.users,
      challenge: true
    }));

    // Cookie Setter, currently used for the following:
    // - is_auth_configured : used to determine if 'is_admin' should even be considered to toggle visbility.
    // - is_admin : used to show/hide buttons that should only be visible to admins if 'Basic Auth' is enabled.
    app.use((req: Request, res: Response, next: NextFunction) => {
      
      // is_auth_configured
      if (config.basic_auth) {
        var is_auth_configured = req.cookies.is_auth_configured;
        if (is_auth_configured === undefined) {
            res.cookie('is_auth_configured', 'true', { maxAge: 900000 });
        }
      } else {
        var is_auth_configured = req.cookies.is_auth_configured;
        if (is_auth_configured === undefined) {
            res.cookie('is_auth_configured', 'false', { maxAge: 900000 });
        }
      }

      // is_admin
      if (config.basic_auth && req.cookies && config.admin[req.auth.user]) {
        var is_admin_cookie = req.cookies.is_admin_cookie;
        if (is_admin_cookie === undefined) {
            res.cookie('is_admin_cookie', 'true', { maxAge: 900000 });
        }
      }

      return next();
    })
  }

  const publicFolder = path.join(__dirname, "/public/");
  app.use(express.static(publicFolder));

  app.get("/", (req: Request, res: Response) => {
    return res.sendFile(path.join(__dirname, "/public/index.html"));
  });

  app.get("/api/server/settings", isUserAdmin, async (req: Request, res: Response) => {
    try {
      const sqlSettingsQuery = `SELECT * FROM setting ORDER BY id ASC`;
      const data = await db.all(sqlSettingsQuery).catch((e: Error) => console.error(e)) as any[];
      const settings = _.groupBy(data, 'key');
      res.json(settings);
    } catch (error) {
      res.json(null);
    }
  });

  app.put("/api/server/settings", isUserAdmin, async (req: Request, res: Response) => {
    try {
      const settingsToUpdate = req.body() as { key: string, value: string }[];

      // Could improve this into a single query...
      for (let i = 0; i < settingsToUpdate.length; i++) {
        const setting = settingsToUpdate[i];
        const sqlSettingsQuery = `UPDATE setting * SET value = ? WHERE key = ?`;
        const sqlSettingsValues = [setting.key, setting.value]
        await db.all(sqlSettingsQuery, sqlSettingsValues).catch((e: Error) => console.error(e));
      }
      
      // I'm not too worried about performance, I just need it to work right now...
      const sqlSettingsQuery = `SELECT * FROM setting ORDER BY id ASC`;
      const data = await db.all(sqlSettingsQuery).catch((e: Error) => console.error(e)) as any[];
      const settings = _.groupBy(data, 'key');
      
      res.json(settings);
    } catch (error) {
      res.json(null);
    }
  });

  app.get("/api/server/deleteAllData", isUserAdmin, async (req: Request, res: Response) => {
    try {

      // Burn it all
      const keys = ["raid", "kills", "looting", "player"];
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const sqlKeyQuery = `DELETE FROM ${key}`;
        await db.all(sqlKeyQuery).catch((e: Error) => console.error(e));

        rmSync(`${__dirname}/../../../data/positions`, { force: true, recursive: true });
        mkdirSync(`${__dirname}/../../../data/positions`);
      }

      res.json(true);
    } catch (error) {
      res.json(true);
    }
  });

  app.get("/api/profile/all", (req: Request, res: Response) => {
    let profiles = saveServer.getProfiles() as Record<string, IAkiProfile>;

    for (const profile_k in profiles) {
      let profile = profiles[profile_k];
      if (typeof profile?.characters?.pmc?.Info?.Side !== "string") {
        console.log(
          `[RAID-REVIEW] It appears that profile id '${profile_k}' is using an old data structure not compatible with RAID-REVIEW.`
        );
        delete profiles[profile_k];
      }
    }

    return res.json(profiles);
  });

  app.get("/api/profile/:profileId", (req: Request, res: Response) => {
    const profiles = saveServer.getProfiles() as Record<string, IAkiProfile>;

    return res.json(profiles[req.params.profileId]);
  });

  app.get(
    "/api/profile/:profileId/raids/all",
    async (req: Request, res: Response) => {
      let { profileId } = req.params;

      const sqlRaidQuery = `SELECT * FROM raid WHERE profileId = '${profileId}' AND timeInRaid > 10 ORDER BY id DESC`;

      const data = await db
        .all(sqlRaidQuery)
        .catch((e: Error) => console.error(e));

      res.json(data);
    }
  );

  app.post("/api/profile/:profileId/raids/deleteAllData", isUserAdmin, async (req: Request, res: Response) => {
      const deletedRaids = [];
      try {
        let { raidIds } = req.body;

        for (let i = 0; i < raidIds.length; i++) {
          const raidId = raidIds[i];
          const keys = ["raid", "kills", "looting", "player"];
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const sqlKeyQuery = `DELETE FROM ${key} WHERE raidId = ?`;
            const sqlKeyValues = [raidId];
            await db
              .all(sqlKeyQuery, sqlKeyValues)
              .catch((e: Error) => console.error(e));
          }

          DeleteFile("positions", "", "", `${raidId}_positions`);
          DeleteFile("positions", "", "", `${raidId}_V2_positions.json`);
          
          deletedRaids.push(raidId);
        }

        res.json(deletedRaids);
      } catch (error) {
        console.log(error);
        res.json(deletedRaids);
      }
    }
  );

  app.post("/api/profile/:profileId/raids/deleteTempFiles", isUserAdmin, async (req: Request, res: Response) => {
      const deletedTempFiles = [];
      try {
        let { raidIds } = req.body;

        for (let i = 0; i < raidIds.length; i++) {
          const raidId = raidIds[i];
          console.log(`[RAID-REVIEW] Deleting temp files for Raid Id: '${raidId}'.`)
          DeleteFile("positions", "", "", `${raidId}_positions`);
          deletedTempFiles.push(raidId)
        }

        res.json(deletedTempFiles);
      } catch (error) {
        console.log(error);
        res.json(deletedTempFiles);
      }
    }
  );

  app.get(
    "/api/profile/:profileId/raids/:raidId",
    async (req: Request, res: Response) => {
      try {
        let { profileId, raidId } = req.params;

        const raid = await getRaidData(db, profileId, raidId);

        if (raid.positionsTracked === "RAW") {
            let positional_data = CompileRaidPositionalData(raidId);
            let telemetryEnabled = config.telemetry;
            if (telemetryEnabled) {
              console.log(`[RAID-REVIEW] Telemetry is enabled.`)
              await sendStatistics(db, profileId, raidId, positional_data);
            } else {
              console.log(`[RAID-REVIEW] Telemetry is disabled.`)
            }
            raid.positionsTracked = "COMPILED"
        }

        return res.json(raid);
      } catch (error) {
        console.log(error);
        return res.json(null)
      }
    }
  );

  app.get(
    "/api/profile/:profileId/raids/:raidId/tempFiles",
    async (req: Request, res: Response) => {
      let { raidId } = req.params;

      const tempFiles = ReadFile("positions","","",`${raidId}_positions`);
      if (tempFiles) {
        return res.json(true);
      }

      return res.json(false);
    }
  );

  app.get(
    "/api/profile/:profileId/raids/:raidId/positions",
    async (req: Request, res: Response) => {
      let { raidId } = req.params;

      const positionalDataRaw = ReadFile(
        "positions",
        "",
        "",
        `${raidId}_V2_positions.json`
      );

      if (positionalDataRaw) {
        let positionalData = JSON.parse(positionalDataRaw);

        positionalData = generateInterpolatedFramesBezier(
          positionalData,
          5,
          24
        );

        return res.json(positionalData);
      }

      return [];
    }
  );

  app.get(
    "/api/profile/:profileId/raids/:raidId/positions/compile",
    async (req: Request, res: Response) => {
      let { raidId } = req.params;
      CompileRaidPositionalData(raidId);
      res.json({ message: "OK" });
    }
  );

  app.get("*", (req: Request, res: Response) => {
    return res.sendFile(path.join(__dirname, "/public/index.html"));
  });

  app.listen(port, () => {
    return console.log(
      `[RAID-REVIEW] Web Server is running at 'http://127.0.0.1:${port}'.`
    );
  });
}

export default StartWebServer;
