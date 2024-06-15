import express, { Express, Request, Response } from "express";
import path from "path";
import cors from "cors";
import _ from "lodash";
import { Database } from "sqlite";
import sqlite3 from "sqlite3";

import { SaveServer } from "@spt-aki/servers/SaveServer";
import { IAkiProfile } from "@spt-aki/models/eft/profile/IAkiProfile";


import config from '../../../config.json';
import { getSessiondata } from "../../mod";
import { DeleteFile, FileExists, ReadFile } from "../../Controllers/Collection/DataSaver";
import CompileRaidPositionalData from "../../Controllers/Collection/CompileRaidPositionalData";
import { generateInterpolatedFramesBezier } from "../../Utils/utils";

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

function StartWebServer(
  saveServer: SaveServer,
  db: Database<sqlite3.Database, sqlite3.Statement>
) {

  app.use(cors());
  app.use(express.json())

  const publicFolder = path.join(__dirname, "/public/");
  app.use(express.static(publicFolder));

  app.get("/", (req: Request, res: Response) => {
    return res.sendFile(path.join(__dirname, "/public/index.html"));
  });

  app.get("/api/profile/active", (req: Request, res: Response) => {
    let { session_id, profile_id } = getSessiondata();
    if (!session_id && !profile_id)
      return res.json({ profileId: null, sessionId: session_id });
    return res.json({ profileId: profile_id, sessionId: session_id });
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

      const sqlRaidQuery = `SELECT * FROM raid WHERE profileId = ? AND timeInRaid > 10 ORDER BY id DESC`;
      const sqlRaidValues = [profileId];
      const data = await db
        .all(sqlRaidQuery, sqlRaidValues)
        .catch((e: Error) => console.error(e));

      res.json(data);
    }
  );

  app.post("/api/profile/:profileId/raids/deleteAllData", async (req: Request, res: Response) => {
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
          DeleteFile("positions", "", "", `${raidId}_positions.json`);
          
          deletedRaids.push(raidId);
        }

        res.json(deletedRaids);
      } catch (error) {
        console.log(error);
        res.json(deletedRaids);
      }
    }
  );

  app.post("/api/profile/:profileId/raids/deleteTempFiles", async (req: Request, res: Response) => {
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

        // Need to fix this; N+1 Problem
        const sqlRaidQuery = `SELECT * FROM raid WHERE profileId = ? AND timeInRaid > 10 AND raidId = ?`;
        const sqlRaidValues = [profileId, raidId];
        const raid = await db
          .get(sqlRaidQuery, sqlRaidValues)
          .catch((e: Error) => console.error(e));

        const keys = ["kills", "looting", "player"];
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const sqlKeyQuery = `SELECT * FROM ${key} WHERE raidId = ?`;
          const sqlKeyValues = [raidId];
          const sqlResult = await db.all(sqlKeyQuery, sqlKeyValues).catch((e: Error) => console.error(e));
          raid[key] = sqlResult || [];
        }

        // Positions check
        raid.positionsTracked = FileExists(
          "positions",
          "",
          "",
          `${raidId}_positions.json`
        );

        // Quick Fix
        raid.players = raid.player;
        delete raid.player;

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
        `${raidId}_positions.json`
      );
      if (positionalDataRaw) {
        const positionalData = JSON.parse(positionalDataRaw);

        for (let i = 0; i < positionalData.length; i++) {
          let playerPositions = positionalData[i];
          positionalData[i] = generateInterpolatedFramesBezier(
            playerPositions,
            5,
            24
          );
        }

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
      `[RAID-REVIEW] Web Server is running at 'http://127.0.0.1:${port}'`
    );
  });
}

export default StartWebServer;
