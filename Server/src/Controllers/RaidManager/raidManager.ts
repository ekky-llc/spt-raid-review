import { IAkiProfile } from "@spt-aki/models/eft/profile/IAkiProfile";

interface RaidManagerRaid {
    raidId: string,
    players: Map<string, IAkiProfile>,
    timeout: Number
}

interface RaidManagerProfile {
    profile: IAkiProfile,
    timeout: Number
}

export class RaidManager {
    public raids: Map<string, RaidManagerRaid>;
    public profiles: Map<string, RaidManagerProfile>;

    constructor() {
        this.raids = new Map<string, RaidManagerRaid>();
        this.profiles = new Map<string, RaidManagerProfile>();
    }

    // Profile Handlers
    addProfile(id: string, data: any[]): void {
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
    addRaid(id: string, data: RaidManagerRaid): void {
        this.raids.set(id, data);
    }

    addPlayerToRaid() : void {

    }

    removeRaid(id: string): void {
        this.raids.delete(id);
    }

    getRaids(): Map<string, RaidManagerRaid> {
        return this.raids;
    }

    getRaid(id: string): RaidManagerRaid {
        return this.raids.get(id);
    }


}
