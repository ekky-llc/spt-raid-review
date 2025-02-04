
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
  imported: boolean
  public: boolean
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
    profileId: string
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
  profileId: string
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

export interface DiscordAccount {
    id: string
    username: string
    avatar: string
    discriminator: string
    public_flags: number
    flags: number
    banner: any
    accent_color: number
    global_name: string
    avatar_decoration_data: any
    banner_color: string
    clan: any
    primary_guild: any
    mfa_enabled: boolean
    locale: string
    premium_type: number
    email: string
    verified: boolean
    phone: string
    nsfw_allowed: boolean
    analytics_token: string
    linked_users: Array<any>
    purchased_flags: number
    bio: string
    authenticator_types: Array<number>
}

export interface RaidReviewAccount {
    id: string
    discordId: string
    uploadToken: string
    isActive: boolean
    isBanned: boolean
    membership: number
    stripe_customer_id: string
    stripe_subscrption_id: string
    created_at: string
}

export interface ShareRaidPayload {
  title: string
  description: string
  uploadToken: string
  isPublic: boolean
  overwriteOldest: boolean
}