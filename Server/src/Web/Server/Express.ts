import express, { Express, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import _ from 'lodash';

import { SaveServer } from "@spt-aki/servers/SaveServer";
import { IAkiProfile } from '@spt-aki/models/eft/profile/IAkiProfile';

const app: Express = express();
const port = 7829;

import { getSessiondata } from '../../mod';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3'
import { FileExists, ReadFile } from '../../Controllers/Collection/DataSaver';
import CompileRaidPositionalData from '../../Controllers/Collection/CompileRaidPositionalData';
import { generateInterpolatedFramesBezier } from '../../Utils/utils';

export interface TrackingPositionalData {
    id: Number
    raidId: String
    profileId: String
    time: Number
    x: Number
    y: Number
    z: Number
    dir: Number
    created_at: Date
}

function StartWebServer(saveServer: SaveServer, db: Database<sqlite3.Database, sqlite3.Statement>) {

  app.use(cors())

  const publicFolder = path.join(__dirname, '/public/');
  app.use(express.static(publicFolder));

  app.get('/', (req: Request, res: Response) => {
    return res.sendFile(path.join(__dirname, '/public/index.html'));
  });
  
  app.get('/api/profile/active', (req: Request, res: Response) => {
    let { session_id, profile_id } = getSessiondata();
    if (!session_id && !profile_id) return res.json({ profileId: null, sessionId: session_id });
    return res.json({ profileId: profile_id, sessionId: session_id  });
  });

  app.get('/api/profile/all', (req: Request, res: Response) => {
    let profiles = saveServer.getProfiles() as Record<string, IAkiProfile>;

    for (const profile_k in profiles) {
      let profile = profiles[profile_k];
      if (typeof profile?.characters?.pmc?.Info?.Side !== "string") {
        console.log(`[RAID-REVIEW] It appears that profile id '${profile_k}' is using an old data structure not compatible with RAID-REVIEW.`);
        delete profiles[profile_k]
      }
    }

    return res.json(profiles);
  });

  app.get('/api/profile/:profileId', (req: Request, res: Response) => {
    const profiles = saveServer.getProfiles() as Record<string, IAkiProfile>;

    return res.json(profiles[req.params.profileId]);
  });

  app.get('/api/profile/:profileId/raids/all', async (req: Request, res: Response) => {
    let { profileId } = req.params;

    const sqlRaidQuery = `SELECT * FROM raid WHERE profileId = ? AND timeInRaid > 10 ORDER BY id DESC`;
    const sqlRaidValues = [ profileId ];
    const data = await db.all(sqlRaidQuery, sqlRaidValues).catch((e: Error) => console.error(e));

    res.json(data);
  })

  app.get('/api/profile/:profileId/raids/:raidId', async (req: Request, res: Response) => {
    let { profileId, raidId } = req.params;

    // Need to fix this; N+1 Problem
    const sqlRaidQuery = `SELECT * FROM raid WHERE profileId = ? AND timeInRaid > 10 AND raidId = ?`;
    const sqlRaidValues = [ profileId, raidId ];
    const raid = await db.get(sqlRaidQuery, sqlRaidValues).catch((e: Error) => console.error(e));

    const keys = ["kills","looting","player"];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const sqlKeyQuery = `SELECT * FROM ${key} WHERE raidId = ?`;
      const sqlKeyValues = [ raidId ];
      raid[key] = await db.all(sqlKeyQuery, sqlKeyValues).catch((e: Error) => console.error(e)); 
    }

    // Positions check
    raid.positionsTracked = FileExists('positions', '', '', `${raidId}_positions.json`);

    // Quick Fix
    raid.players = raid.player;
    delete raid.player;

    res.json(raid);
  })

  app.get('/api/profile/:profileId/raids/:raidId/positions', async (req: Request, res: Response) => {
    let { raidId } = req.params;
    
    const positionalDataRaw = ReadFile('positions', '', '', `${raidId}_positions.json`);
    if (positionalDataRaw) {
      const positionalData = JSON.parse(positionalDataRaw);

      for (let i = 0; i < positionalData.length; i++) {
        let playerPositions = positionalData[i];
        positionalData[i] = generateInterpolatedFramesBezier(playerPositions, 5, 24);
      }

      return res.json(positionalData);
    }

    return [];
  })

  app.get('/api/profile/:profileId/raids/:raidId/positions/compile', async (req: Request, res: Response) => {
    let { raidId } = req.params;
    CompileRaidPositionalData(raidId);
    res.json({ message: "OK"})
  });

  app.get('*', (req: Request, res: Response) => {
    return res.sendFile(path.join(__dirname, '/public/index.html'));
  });

  app.listen(port, () => {
    return console.log(`[RAID-REVIEW] Web Server is running at 'http://127.0.0.1:${port}'`);
  });

}

export default StartWebServer;