// @ts-ignore
import { DependencyContainer } from 'tsyringe'
import { RawData, WebSocketServer } from 'ws'
import cron from 'node-cron'
import sqlite3 from 'sqlite3'
import { Database } from 'sqlite'
import _ from 'lodash'

import type { IPreAkiLoadMod } from '@spt-aki/models/external/IPreAkiLoadMod'
import type { IPostAkiLoadMod } from '@spt-aki/models/external/IPostAkiLoadMod'
import { StaticRouterModService } from '@spt-aki/services/mod/StaticRouter/StaticRouterModService'
import { SaveServer } from '@spt-aki/servers/SaveServer'
import { ProfileHelper } from '@spt-aki/helpers/ProfileHelper'
import { LocaleService } from '@spt-aki/services/LocaleService'

import config from '../config.json'
import WebServer from './Web/Server/Express'
import { database } from './Database/sqlite'
import { MigratePositionsStructure } from './Controllers/PositionalData/PositionsMigration'
import { CheckForMissingMainPlayer } from './Controllers/DataIntegrity/CheckForMissingMainPlayer'
import { GarbageCollectOldRaids, GarbageCollectUnfinishedRaids } from './Controllers/DataIntegrity/TheGarbageCollector'
import { sendStatistics } from './Controllers/Telemetry/RaidStatistics'
import CompileRaidPositionalData from './Controllers/PositionalData/CompileRaidPositionalData'
import { errorPacketHandler, messagePacketHandler } from './Controllers/PacketHandler/packetHandler'
import { SessionManager } from './Controllers/StateManagers/sessionManager'
import { ModDetector } from './Controllers/Integrations/modDetection'
import { WebSocketConfig } from './constant'
import { Logger } from './Utils/logger'

class Mod implements IPreAkiLoadMod, IPostAkiLoadMod {
    saveServer: SaveServer
    profileHelper: ProfileHelper
    intl: LocaleService
    logger: Logger

    wss: WebSocketServer
    database: Database<sqlite3.Database, sqlite3.Statement>
    modDetector: ModDetector
    sessionManager: SessionManager
    raids_to_process: string[]

    constructor() {
        this.saveServer = null
        this.wss = null
        this.database = null
        this.raids_to_process = []

        this.logger = new Logger()
        this.logger.init()
        this.sessionManager = new SessionManager(this.logger)
    }

    public preAkiLoad(container: DependencyContainer): void {
        const staticRouterModService = container.resolve<StaticRouterModService>('StaticRouterModService')

        staticRouterModService.registerStaticRouter(
            'GetPlayerInfo',
            [
                {
                    url: '/client/game/start',
                    action: (_url: string, __info: any, sessionId: string, output: string) => {
                        const profile = this.profileHelper.getFullProfile(sessionId)
                        this.sessionManager.addProfile(profile.info.id, {
                            profile,
                            raidId: null,
                            timeout: 0,
                        })

                        // Print 
                        this.logger.debug(`[ROUTE:/CLIENT/GAME/START] ADDED_PROFILE: ${profile.info.id}`);
                        this.logger.debug(`[ROUTE:/CLIENT/GAME/START] ACTIVE_PROFILES: ` + Array.from(this.sessionManager.getProfiles().entries()).map(p => profile.info.id).join(', '));

                        return output
                    },
                },
                {
                    url: '/client/game/keepalive',
                    action: (_url: string, __info: any, sessionId: string, output: string) => {
                        this.sessionManager.pingProfile(sessionId);
                        return output
                    },
                }
            ],
            'aki'
        )
    }

    public async postAkiLoad(container: DependencyContainer): Promise<void> {
        this.profileHelper = container.resolve<ProfileHelper>('ProfileHelper');
        this.intl = container.resolve<LocaleService>('LocaleService');

        // Database connection
        this.database = await database(this.logger)
        this.logger.log(`Database Connected`)

        // Get Installed Mods
        this.modDetector = new ModDetector(this.logger)

        // Data Position Migration
        // @ekky @ 2024-06-18: Added this for the move from v0.0.3 to v0.0.4
        await MigratePositionsStructure(this.database, this.logger);

        // Missing Player Fix
        // @ekky @ 2024-06-19: Added this to help fix this 'Issue # 25'
        const profileHelper = container.resolve<ProfileHelper>('ProfileHelper')
        const profiles = profileHelper.getProfiles()
        await CheckForMissingMainPlayer(this.database, this.logger, profiles)

        // Storage Saving Helpers
        await GarbageCollectOldRaids(this.database, this.logger)
        await GarbageCollectUnfinishedRaids(this.database, this.logger)
        if (config.autoDeleteCronJob) {
            cron.schedule('0 */1 * * *', async () => {
                await GarbageCollectOldRaids(this.database, this.logger)
                await GarbageCollectUnfinishedRaids(this.database, this.logger)
            })
        }

        // Automatic Processor
        const post_raid_processing = cron.schedule(
            '*/1 * * * *',
            async () => {
                if (this.raids_to_process.length > 0) {
                    for (let i = 0; i < this.raids_to_process.length; i++) {
                        const raidIdToProcess = this.raids_to_process[i]
                        let positional_data = CompileRaidPositionalData(raidIdToProcess, this.logger)

                        let telemetryEnabled = config.telemetry
                        if (telemetryEnabled) {
                            this.logger.log(`Telemetry is enabled.`)
                            await sendStatistics(this.database, this.logger, raidIdToProcess, positional_data)
                        } else {
                            this.logger.log(`Telemetry is disabled.`)
                        }
                    }
                    this.raids_to_process = [];
                    this.logger.log(`Disabled Post Processing: Post raid processing completed.`)
                } else {
                    post_raid_processing.stop();
                }
            },
            { scheduled: false }
        )
        post_raid_processing.start()

        this.saveServer = container.resolve<SaveServer>('SaveServer')
        this.logger.log(`SPT Server Connected.`)

        this.wss = new WebSocketServer(WebSocketConfig)
        this.wss.on('connection', async (ws) => {
            ws.on('error', errorPacketHandler)
            ws.on('message', (data: RawData) => messagePacketHandler(data, this.database, this.sessionManager, this.modDetector, this.logger, post_raid_processing))
        })

        this.logger.log(`Websocket Server Listening on 'ws://127.0.0.1:7828'.`)

        WebServer(this.saveServer, this.profileHelper, this.database, this.intl, this.logger)
    }
}

module.exports = { mod: new Mod() }
