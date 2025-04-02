export interface IRaidPayload {
    sessionId?: string;
    profileId: string;
    location: string;
    detectedMods: string;
    time: Date;
    timeInRaid: number;
    exitName: string;
    type: string;
    exitStatus: string;
    imported?: number;
}