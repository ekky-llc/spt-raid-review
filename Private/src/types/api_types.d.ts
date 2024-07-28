
export interface TrackingCoreDataRaids {
  id: string;
  raidId: string;
  playerId: string;
  location: string;
  time: Date;
  timeInRaid: number;
  exitName: string;
  exitStatus: string;
}

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


export interface TrackingRaidData {
  detectedMods: any;
  positionsTracked: string;
  id: string;
  raidId: string;
  profileId: string
  location: string
  time: string
  timeInRaid: string
  exitName: string
  exitStatus: string
  type: string
  player_status?: TrackingPlayerStatus[]
  players?: TrackingRaidDataPlayers[]
  kills?: TrackingRaidDataKills[]
  ballistic?: TrackingBallistic[]
  looting?: TrackingRaidDataLoot[]
}

export interface TrackingRaidDataPlayers {
  id: string
  profileId: string
  level: string
  team: string
  name: string
  type: string
  group: number
  spawnTime: number
  mod_SAIN_brain: string
  mod_SAIN_difficulty: string
}

export interface TrackingRaidDataKills {
    time: number
    killerId: string
    killedId: string
    weapon: string
    distance: string
    bodyPart: string
    type: string
}

export interface TrackingRaidDataLoot {
  profileId: string
  time: number
  id: string
  name: string
  qty: string
  type: string
  added: string
}

export interface TrackingPlayerStatus {
  raidId: string
  playerId: string
  time: number
  status: string
}

export interface TrackingBallistic {
  sessionId: string;
  profileId: string;
  time: number;
  weaponId: string;
  ammoId: string;
  hitPlayerId: string;
  source: string;
  target: string;
}

export interface RaidReviewServerSettings {
  telemetry_enabled: string,
}