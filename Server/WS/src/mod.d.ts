enum ExitStatus {
  Survived = 0,
  Killed = 1,
  Left = 2,
  Runner = 3,
  MissingInAction = 4,
}

enum EPlayerSide {
  Usec = 1,
  Bear = 2,
  Savage = 4,
}

enum EBodyPartColliderType {
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

interface TrackingRaid {
  id: string;
  location: string;
  time: Date;
  timeInRaid: number;
  exitName: string;
  exitStatus: ExitStatus;
}

interface TrackingPlayer {
  id: number;
  profileId: string;
  level: number;
  team: EPlayerSide;
  name: string;
  type: string;
  group: string;
  spawnTime: number;
}

interface TrackingRaidKill {
  time: number;
  killerId: string;
  killedId: string;
  weapon: string;
  distance: number;
  bodyPart: string;
  type: string;
}

interface TrackingAggression {
  time: number;
  aggressorId: string;
  aggresseId: string;
  weapon: string;
  distance: number;
  bodyPart: EBodyPartColliderType;
}

interface TrackingLootItem {
  playerId: string;
  time: number;
  id: string;
  name: string;
  qty: number;
  type: string;
  added: boolean;
}

interface TrackingPlayerData {
  playerId: number;
  time: number;
  x: number;
  y: number;
  z: number;
  dir: number;
  alive: boolean;
  health: TrackingPlayerHealth[];
}

interface TrackingPlayerHealth {
    Item1: number
    Item2: number
}