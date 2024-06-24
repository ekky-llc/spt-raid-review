import { IAkiProfile } from "@spt-aki/models/eft/profile/IAkiProfile";

export interface RaidManagerRaid {
    raidId: string,
    players: Map<string, IAkiProfile>,
    timeout: number
}

export type RaidManagerPlayerMap = Map<string, IAkiProfile>;

export interface RaidManagerPlayer {
    raidId: string, 
    profile: IAkiProfile,
    timeout: number
}

export class RaidManager {
    protected raids: Map<string, RaidManagerRaid>;
    protected profiles: Map<string, RaidManagerPlayer>;
    protected timeoutIntervals: Map<string, NodeJS.Timeout>;

    constructor() {
        this.raids = new Map<string, RaidManagerRaid>();
        this.profiles = new Map<string, RaidManagerPlayer>();
        this.timeoutIntervals = new Map<string, NodeJS.Timeout>;
    }



    
    private addTimeoutInterval(timeoutId: string, target: string): void {
        if (this.timeoutIntervals.has(timeoutId)) {
            this.removeTimeoutInterval(timeoutId);
        }

        this.timeoutIntervals.set(
            timeoutId,
            setInterval(() => {

                if (target === "raid") {
                    const raid = this.getRaid(timeoutId);
                    raid.timeout++;

                    // If raid times out after 2 minutes, remove the raid.
                    if (raid.timeout >= 2) {
                        this.removeRaid(timeoutId);
                    }
                }

                if (target === "player") {
                    const player = this.getProfile(timeoutId);
                    player.timeout++;

                    // If raid times out after 5 minutes, remove the profile.
                    if (player.timeout >= 5) {
                        if (player.raidId) {
                            this.removePlayerFromRaid(player.raidId, timeoutId);
                        }
                        this.removeProfile(timeoutId);
                    }
                }
            }, 60 * 1000),
        );
    }

    private removeTimeoutInterval(timeoutId: string): void {
        if (!this.timeoutIntervals.has(timeoutId)) {
            return;
        }
        clearInterval(this.timeoutIntervals.get(timeoutId));
        this.timeoutIntervals.delete(timeoutId);
    }




    // Profile Handlers
    addProfile(profileId: string, data: RaidManagerPlayer): void {
        this.profiles.set(profileId, data);
    }

    removeProfile(profileId: string): void {
        this.profiles.delete(profileId);
    }

    getProfiles() : Map<string, RaidManagerPlayer> {
        return this.profiles;
    }

    getProfile(profileId: string): RaidManagerPlayer {
        return this.profiles.get(profileId);
    }

    pingProfile(profileId: string): void {
        if (!this.profiles.has(profileId)) {
            return;
        }

        this.getProfile(profileId).timeout = 0;
    }




    // Raid Handlers
    addRaid(raidId: string, raidData: RaidManagerRaid): void {
        this.raids.set(raidId, raidData);
        this.addTimeoutInterval(raidId, 'raid');
    }

    removeRaid(raidId: string): void {
        this.removeTimeoutInterval(raidId);

        const raid = this.getRaid(raidId);

        // Remove all players from the raid, and reset Ids for profiles.
        const playersInRaid = Array.from(raid.players.keys());
        for (let i = 0; i < playersInRaid.length; i++) {
            this.removePlayerFromRaid(raidId, playersInRaid[i]);
        }
        
        // Delete Raid
        this.raids.delete(raidId);
    }

    getRaids(): Map<string, RaidManagerRaid> {
        return this.raids;
    }

    getRaid(raidId: string): RaidManagerRaid {
        return this.raids.get(raidId);
    }

    pingRaid(raidId: string): void {
        if (!this.raids.has(raidId)) {
            return;
        }

        this.getRaid(raidId).timeout = 0;
    }
    



    // Player To Raid Handler
    addPlayerToRaid(raidId: string, profileId: string) : void {
        const player = this.getProfile(profileId);
        player.raidId = raidId;

        const raid = this.getRaid(raidId)
        raid.players.set(profileId, player.profile);
    }

    removePlayerFromRaid(raidId: string, profileId: string) : void {
        const player = this.getProfile(profileId);
        player.raidId = null;
        
        const raid = this.getRaid(raidId);
        raid.players.delete(profileId);
    }

}
