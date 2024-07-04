import { IAkiProfile } from '@spt-aki/models/eft/profile/IAkiProfile'
import { CONSTANTS } from '../../constant'
import { Logger } from 'src/Utils/logger'

export interface SessionManagerRaid {
    raidId: string
    players: Map<string, string>
    timeout: number
}

export type SessionManagerPlayerMap = Map<string, IAkiProfile>

export interface SessionManagerPlayer {
    raidId: string
    profile: IAkiProfile
    timeout: number
}


/**
 * The role of the session manager is to keep track of:
 * - Raids
 * - Active Profiles
 */
export class SessionManager {
    protected raids: Map<string, SessionManagerRaid>
    protected profiles: Map<string, SessionManagerPlayer>
    protected timeoutIntervals: Map<string, NodeJS.Timeout>
    protected logger : Logger

    constructor(logger : Logger) {
        this.raids = new Map<string, SessionManagerRaid>
        this.profiles = new Map<string, SessionManagerPlayer>
        this.timeoutIntervals = new Map<string, NodeJS.Timeout>
        this.logger = logger;
    }

    private addTimeoutInterval(timeoutId: string, target: string): void {
        if (this.timeoutIntervals.has(timeoutId)) {
            this.removeTimeoutInterval(timeoutId)
        }

        this.timeoutIntervals.set(
            timeoutId,
            setInterval(() => {
                if (target === 'raid') {

                    // timeoutId would be the 'guid' of the raid
                    const raid = this.getRaid(timeoutId)
                    raid.timeout++

                    // If raid times out after 2 minutes, remove the raid.
                    if (raid.timeout >= 2) {
                        this.removeRaid(
                            timeoutId,
                            CONSTANTS.REASON_RAID_REMOVAL__TIMEOUT
                        )
                    }
                }

                if (target === 'player') {

                    // timeoutId would be the 'guid' of the player
                    const player = this.getProfile(timeoutId)
                    player.timeout++

                    // If player times out after 240 minutes, remove the profile.
                    if (player.timeout >= 240) {
                        if (player.raidId) {
                            this.removePlayerFromRaid(player.raidId, timeoutId)
                        }
                        this.removeProfile(timeoutId)
                    }
                }
            }, 60 * 1000)
        )
    }

    private removeTimeoutInterval(timeoutId: string): void {
        if (!this.timeoutIntervals.has(timeoutId)) {
            return
        }
        clearInterval(this.timeoutIntervals.get(timeoutId))
        this.timeoutIntervals.delete(timeoutId)
    }

    // Profile Handlers
    addProfile(profileId: string, data: SessionManagerPlayer): void {
        this.profiles.set(profileId, data);
        this.logger.log(`Registered player '${profileId}' to the session manager.`);
    }

    removeProfile(profileId: string): void {
        this.profiles.delete(profileId)
    }

    getProfiles(): Map<string, SessionManagerPlayer> {
        return this.profiles
    }

    getProfile(profileId: string): SessionManagerPlayer {
        return this.profiles.get(profileId)
    }

    pingProfile(profileId: string): void {
        if (!this.profiles.has(profileId)) {
            return
        }

        this.getProfile(profileId).timeout = 0
    }

    // Raid Handlers
    addRaid(raidId: string, raidData: SessionManagerRaid): void {
        this.raids.set(raidId, raidData);
        this.addTimeoutInterval(raidId, 'raid');
        this.logger.log(`Registered raid '${raidId}' for player(s) '${Array.from(raidData.players.keys()).join(',')}'.`);
    }

    removeRaid(raidId: string, removalReason: string): void {
        this.removeTimeoutInterval(raidId)

        const raid = this.getRaid(raidId)

        // Remove all players from the raid, and reset Ids for profiles.
        const playersInRaid = Array.from(raid.players.keys())
        for (let i = 0; i < playersInRaid.length; i++) {
            this.removePlayerFromRaid(raidId, playersInRaid[i])
        }

        // Delete Raid
        this.raids.delete(raidId)
        this.logger.log(
            `Deregistered raid '${raidId}', REASON: ${removalReason}`
        )

        // Create a new log file if all raids are over.
        if (this.raids.size === 0) {
            this.logger.init();
        }
    }

    getRaids(): Map<string, SessionManagerRaid> {
        return this.raids
    }

    getRaid(raidId: string): SessionManagerRaid {
        return this.raids.get(raidId)
    }

    pingRaid(raidId: string): void {
        if (!this.raids.has(raidId)) {
            return
        }
        this.getRaid(raidId).timeout = 0
    }

    // Player To Raid Handler
    addPlayerToRaid(raidId: string, profileId: string): void {
        const player = this.getProfile(profileId)
        player.raidId = raidId

        const raid = this.getRaid(raidId)
        raid.players.set(profileId, profileId)
    }

    removePlayerFromRaid(raidId: string, profileId: string): void {
        const player = this.getProfile(profileId)
        player.raidId = null

        const raid = this.getRaid(raidId)
        raid.players.delete(profileId)
    }
}
