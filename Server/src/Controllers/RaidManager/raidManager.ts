import { IAkiProfile } from "@spt-aki/models/eft/profile/IAkiProfile";

interface RaidManagerRaid {
    raidId: string,
    players: Map<string, IAkiProfile>,
    timeout: Number
}

interface RaidManagerProfile {
    profile: IAkiProfile,
    timeout?: Number
    raidId?: string, 
}

export class RaidManager {
    public raids: Map<string, RaidManagerRaid>;
    public profiles: Map<string, RaidManagerProfile>;

    constructor() {
        this.raids = new Map<string, RaidManagerRaid>();
        this.profiles = new Map<string, RaidManagerProfile>();
    }

    // Profile Handlers
    addProfile(id: string, data: RaidManagerProfile): void {
        this.profiles.set(id, data);
    }

    removeProfile(id: string): void {
        this.profiles.delete(id);
    }

    getProfiles() : Map<string, RaidManagerProfile> {
        return this.profiles;
    }

    getProfile(id: string): RaidManagerProfile {
        return this.profiles.get(id);
    }


    // Raid Handlers
    addRaid(raidId: string, raidData: RaidManagerRaid): void {
        this.raids.set(raidId, raidData);
    }

    getRaids(): Map<string, RaidManagerRaid> {
        return this.raids;
    }

    getRaid(raidId: string): RaidManagerRaid {
        return this.raids.get(raidId);
    }
    
    // Player To Raid Handler
    addPlayerToRaid(raidId: string, playerProfile: IAkiProfile) : void {
        let raid = this.getRaid(raidId)
        raid.players.set(playerProfile.info.id, playerProfile);
        this.raids.set(raidId, raid);
    }

    removePlayerFromRaid(raidId: string, playerProfile: IAkiProfile) : void {
        let raid = this.getRaid(raidId)
        raid.players.delete(playerProfile.info.id);
        this.raids.set(raidId, raid);
    }

    removeRaid(raidId: string): void {
        this.raids.delete(raidId);
    }

}
