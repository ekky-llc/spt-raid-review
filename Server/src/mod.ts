// @ts-ignore
import { DependencyContainer } from 'tsyringe'
import { WebSocketServer } from 'ws'
import cron from 'node-cron'
import sqlite3 from 'sqlite3'
import { Database } from 'sqlite'
import _ from 'lodash'

import type { IPreAkiLoadMod } from '@spt-aki/models/external/IPreAkiLoadMod'
import type { IPostAkiLoadMod } from '@spt-aki/models/external/IPostAkiLoadMod'
import type { ILogger } from '@spt-aki/models/spt/utils/ILogger'
import { StaticRouterModService } from '@spt-aki/services/mod/StaticRouter/StaticRouterModService'
import { SaveServer } from '@spt-aki/servers/SaveServer'
import { ProfileHelper } from '@spt-aki/helpers/ProfileHelper'

import config from '../config.json'
import WebServer from './Web/Server/Express'
import { database } from './Database/sqlite'
import { MigratePositionsStructure } from './Controllers/PositionalData/PositionsMigration'
import { CheckForMissingMainPlayer } from './Controllers/DataIntegrity/CheckForMissingMainPlayer'
import {
    GarbageCollectOldRaids,
    GarbageCollectUnfinishedRaids,
} from './Controllers/DataIntegrity/TheGarbageCollector'
import { sendStatistics } from './Controllers/Telemetry/RaidStatistics'
import CompileRaidPositionalData from './Controllers/PositionalData/CompileRaidPositionalData'
import {
    errorPacketHandler,
    messagePacketHandler,
} from './Controllers/PacketHandler/packetHandler'
import { WebSocketConfig } from './constant'
import { SessionManager } from './Controllers/StateManagers/sessionManager'
import { ModDetector } from './Controllers/Integrations/modDetection'
class Mod implements IPreAkiLoadMod, IPostAkiLoadMod {
    saveServer: SaveServer
    profileHelper: ProfileHelper
    logger: ILogger

    wss: WebSocketServer
    database: Database<sqlite3.Database, sqlite3.Statement>
    modDetector: ModDetector
    sessionManager: SessionManager
    raids_to_process: string[]

    constructor() {
        this.wss = null
        this.database = null
        this.sessionManager = new SessionManager()
        this.raids_to_process = []
    }

    public preAkiLoad(container: DependencyContainer): void {
        const staticRouterModService = container.resolve<StaticRouterModService>('StaticRouterModService')

        /**
         * Adds
         **/    
        staticRouterModService.registerStaticRouter(
            'GetPlayerInfo',
            [
                {
                    url: '/client/game/start',
                    action: ( _url: string, __info: any, sessionId: string) => {
                        this.profileHelper = container.resolve<ProfileHelper>('ProfileHelper');
                        const profile = this.profileHelper.getFullProfile(sessionId);
                        this.sessionManager.addProfile(profile.info.id, { profile, raidId: null, timeout: 0 });
                    },
                },
            ],
            'aki'
        )
    }

    public async postAkiLoad(container: DependencyContainer): Promise<void> {
        this.database = await database()
        console.log(`[RAID-REVIEW] Database Connected`)


        // Get Installed Mods
        this.modDetector = new ModDetector()


        // Data Position Migration
        // @ekky @ 2024-06-18: Added this for the move from v0.0.3 to v0.0.4
        await MigratePositionsStructure(this.database)


        // Missing Player Fix
        // @ekky @ 2024-06-19: Added this to help fix this 'Issue # 25'
        const profileHelper = container.resolve<ProfileHelper>('ProfileHelper')
        const profiles = profileHelper.getProfiles()
        await CheckForMissingMainPlayer(this.database, profiles)


        // Storage Saving Helpers
        await GarbageCollectOldRaids(this.database)
        await GarbageCollectUnfinishedRaids(this.database)
        if (config.autoDeleteCronJob) {
            cron.schedule('0 */1 * * *', async () => {
                await GarbageCollectOldRaids(this.database)
                await GarbageCollectUnfinishedRaids(this.database)
            })
        }

        
        // Automatic Processor
        const post_raid_processing = cron.schedule(
            '*/1 * * * *',
            async () => {
                if (this.raids_to_process.length > 0) {
                    for (let i = 0; i < this.raids_to_process.length; i++) {
                        const raidIdToProcess = this.raids_to_process[i]
                        let positional_data =
                            CompileRaidPositionalData(raidIdToProcess)

                        let telemetryEnabled = config.telemetry
                        if (telemetryEnabled) {
                            console.log(`[RAID-REVIEW] Telemetry is enabled.`)
                            await sendStatistics(
                                this.database,
                                raidIdToProcess,
                                positional_data
                            )
                        } else {
                            console.log(`[RAID-REVIEW] Telemetry is disabled.`)
                        }

                        this.raids_to_process = []
                    }
                }
            },
            { scheduled: false }
        )
        post_raid_processing.start()



        this.saveServer = container.resolve<SaveServer>('SaveServer')
        console.log(`[RAID-REVIEW] SPT Server Connected.`)



        this.wss = new WebSocketServer(WebSocketConfig)
        this.wss.on('connection', async (ws) => {
            ws.on('error', errorPacketHandler)
            ws.on('message', (str: string) =>
                messagePacketHandler(
                    str,
                    this.sessionManager,
                    this.modDetector,
                    post_raid_processing
                )
            )
        })
        console.log(
            `[RAID-REVIEW] Websocket Server Listening on 'ws://127.0.0.1:7828'.`
        )

        WebServer(this.saveServer, this.database)
    }
}

module.exports = { mod: new Mod() }
