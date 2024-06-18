
import * as _ from 'lodash';
import { Database } from "sqlite";
import sqlite3 from 'sqlite3'

import { TrackingRaidData } from "src/Web/Client/src/types/api_types";
import { positonal_data } from "../Collection/CompileRaidPositionalData";
import { calculateTotalDistance } from "../../Utils/CalculateDistancesTravelled";
import { getRaidData } from '../Collection/GetRaidData';

export interface StatisticsPayload {
    location: string
    status: string
    time: string
    players: {
      total: number
      usec: number
      bear: number
      savage: number
    }
    kills: {
      total: number
      usec: number
      bear: number
      savage: number
    }
    distanceTravelled: number
}

export async function sendStatistics(db: Database<sqlite3.Database, sqlite3.Statement>, profileId: string, raidId: string, positions: positonal_data[][] = []): Promise<void> {
    const raidData = await getRaidData(db, profileId, raidId);
    console.log(`[RAID-REVIEW] Generating statistics payload.`)

    const payload = await generateStatisticsPayload(raidData, positions);
    console.log(`[RAID-REVIEW] Sending statistics payload.`)

    await sendStatisticsPayload(payload);
    console.log(`[RAID-REVIEW] Statistics payload recieved.`)
}

async function generateStatisticsPayload(raid: TrackingRaidData, positions: positonal_data[][] = []) : Promise<StatisticsPayload> {

    // Data points
    let players = {
        total: 0,
        usec: 0,
        bear: 0,
        savage: 0
    }

    let kills = {
        total: 0,
        usec: 0,
        bear: 0,
        savage: 0
    }

    // Should speed up data reads
    let playerDic = _.groupBy(raid.players ,'playerId');

    // Iterations
    let playersLen = raid.players.length;
    let killsLen = raid.kills.length;
    let lootingsLen = raid.looting.length;
    let longest = [playersLen, killsLen, lootingsLen].sort((a, b) => (a - b))[0];
    for (let i = 0; i < longest; i++) {
        const player = raid.players[i];
        const kill = raid.kills[i];
        const lootings = raid.looting[i];

        if (player) {
            if (player.team) {
                let lowercaseTeam = player.team.toLowerCase();
                players[lowercaseTeam] = players[lowercaseTeam] + 1;
                }
            }
                
            if (kill) {
            let killedPlayer = playerDic[kill.killedId][0];
            if (killedPlayer.team) {
                let lowercaseTeam = killedPlayer.team.toLowerCase();
                kills[lowercaseTeam] = kills[lowercaseTeam] + 1;
            }
        }
        
    }

    // Final Payload
    const data = { 
        location: raid.location,
        status: raid.exitStatus,
        time: raid.timeInRaid,
        players,
        kills,
        lootings: lootingsLen,
        distanceTravelled : calculateTotalDistance(positions)
    }

    return data;
}

async function sendStatisticsPayload(statisticsPayload : StatisticsPayload) : Promise<void> {

    try {
        await fetch(`https://telemetry.raid-review.online/statistics`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(statisticsPayload)
        });
    } catch (error) {
        console.log(`[RAID-REVIEW] There was an issue sending statistics to 'raid-review' server.`);
        console.log(error);
    }

}