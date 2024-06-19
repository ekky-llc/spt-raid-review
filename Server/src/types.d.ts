import 'express';

// Client Side Class Mirrors
export enum ExitStatus {
  Survived = 0,
  Killed = 1,
  Left = 2,
  Runner = 3,
  MissingInAction = 4,
}

export enum EPlayerSide {
  Usec = 1,
  Bear = 2,
  Savage = 4,
}

export enum EBodyPartColliderType {
  None = -1,
  Head = 0,
  Ribcage = 1,
  Stomach = 2,
  Pelvis = 3,
  LeftUpperArm = 4,
  LeftForearm = 5,
  RightUpperArm = 6,
  RightForearm = 7,
  LeftThigh = 8,
  LeftCalf = 9,
  RightThigh = 10,
  RightCalf = 1,
}

export interface TrackingRaid {
  id: string;
  location: string;
  time: Date;
  timeInRaid: number;
  exitName: string;
  exitStatus: ExitStatus;
}

export interface TrackingPlayer {
  id: number;
  profileId: string;
  level: number;
  team: EPlayerSide;
  name: string;
  type: string;
  group: string;
  spawnTime: number;
  mod_SAIN_brain: string;
}

export interface TrackingRaidKill {
  time: number;
  killerId: string;
  killedId: string;
  weapon: string;
  distance: number;
  bodyPart: string;
  type: string;
}

export interface TrackingLootItem {
  playerId: string;
  time: number;
  id: string;
  name: string;
  qty: number;
  type: string;
  added: boolean;
}

export interface TrackingPlayerData {
  playerId: number;
  time: number;
  x: number;
  y: number;
  z: number;
  dir: number;
  alive: boolean;
  health: TrackingPlayerHealth[];
}

export interface TrackingPlayerHealth {
  Item1: number;
  Item2: number;
}

// Custom
export interface FileImport {
  datapoint: string;
  data: string;
}

export interface NotificationLimiter {
  raid_start: boolean;
  raid_end: boolean;
  player: boolean;
  kill: boolean;
  position: boolean;
  loot: boolean;
}

export interface RaidReviewSettings {
  id : number;
  key : string;
  value : string;
  type : string;
  created_at : Date;
  updated_at : Date;
}

declare module 'express' {
  interface Request {
      auth?: {
          user: string;
          password: string;
      };
  }
}
