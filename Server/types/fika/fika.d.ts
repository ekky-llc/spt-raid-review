export interface IFikaUpdateRaidAddPlayerData {
    serverId: string;
    profileId: string;
    isSpectator: boolean;
}

export interface IFikaUpdateRaidAddPlayerData {
    serverId: string;
    profileId: string;
    isSpectator: boolean;
}


export interface IFikaRaidCreateRequestData {
    raidCode: string;
    serverId: string;
    hostUsername: string;
    timestamp: string;
    settings?: any;
    gameVersion: string;
    fikaVersion: string;
    side?: any;
    time?: any;
    isSpectator: boolean;
}

export interface IFikaRaidLeaveRequestData {
    serverId: string;
    profileId: string;
}