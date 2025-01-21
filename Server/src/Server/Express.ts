import express, { Express, NextFunction, Request, Response } from 'express'
import { mkdirSync, rmSync, writeFile, writeFileSync } from 'fs'
import path from 'path'
import cors from 'cors'
import _ from 'lodash'
import { Database } from 'sqlite'
import sqlite3 from 'sqlite3'
import cookieParser from 'cookie-parser'
import basicAuth from 'express-basic-auth'
import compression from 'compression' 

import { SaveServer } from '@spt/servers/SaveServer'
import { ISptProfile } from '@spt/models/eft/profile/ISptProfile'
import { ProfileHelper } from '@spt/helpers/ProfileHelper'
import { LocaleService } from '@spt/services/LocaleService'

import config from '../../config.json'
import { DeleteFile, ReadFile } from '../Controllers/FileSystem/DataSaver'
import CompileRaidPositionalData, { ACTIVE_POSITIONAL_DATA_STRUCTURE } from '../Controllers/PositionalData/CompileRaidPositionalData'
import { generateInterpolatedFramesBezier } from '../Utils/utils'
import { getRaidData } from '../Controllers/Collection/GetRaidData'
import { sendStatistics } from '../Controllers/Telemetry/RaidStatistics'
import { Logger } from '../Utils/logger'
import { compressData, decompressData } from '../Utils/compression'
import { importRaidData } from '../Controllers/Persistance/importRaid'

const app: Express = express()
const port = config.web_client_port || 7829
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

function isUserAdmin(req: Request, res: Response, next: NextFunction, logger: Logger) {
    if (config.authentication && req.auth) {
        res.status(401).json({ status: 'ERROR', message: 'You are not authorised.' })
        logger.log(`Someone tried to login that wasn't authroised.`)
    }

    return next();
}

function StartWebServer(saveServer: SaveServer, profileServer: ProfileHelper, db: Database<sqlite3.Database, sqlite3.Statement>, intl: LocaleService, logger: Logger) {
    app.use(cors())
    app.use(express.json())
    app.use(cookieParser())
    app.use(compression())

    const basicAuthUsers = {};
    Object.values(profileServer.getProfiles()).map((p : ISptProfile) => basicAuthUsers[p.info.username] = p.info.password);

    // Basic Auth has been implemented for people who host Fika remotely.
    // It's not the greatest level of protection, but I cannot be arsed to implement oAuth for sucha niche use case.
    if (config.authentication) {

        app.use(
            basicAuth({
                users: basicAuthUsers,
                challenge: true,
            })
        )

        // Cookie Setter, currently used for the following:
        // - is_auth_configured : used to determine if 'is_admin' should even be considered to toggle visbility.
        // - is_admin : used to show/hide buttons that should only be visible to admins if 'Basic Auth' is enabled.
        app.use((req: Request, res: Response, next: NextFunction) => {
            // is_auth_configured
            if (config.authentication) {
                var is_auth_configured = req.cookies.is_auth_configured
                if (is_auth_configured === undefined) {
                    res.cookie('is_auth_configured', 'true', { maxAge: 900000 })
                }
            } else {
                var is_auth_configured = req.cookies.is_auth_configured
                if (is_auth_configured === undefined) {
                    res.cookie('is_auth_configured', 'false', { maxAge: 900000 })
                }
            }

            return next()
        })
    }

    const publicFolder = path.join(__dirname, '/public/')
    app.use(express.static(publicFolder))

    app.get('/', (req: Request, res: Response) => {
        return res.sendFile(path.join(__dirname, '/public/index.html'))
    })

    app.get('/api/intl', async (req: Request, res: Response) => {
        try {
            const intl_all = intl.getLocaleDb();
            res.json(intl_all)
        } catch (error) {
            res.json(null)
        } 
    })

    app.get('/api/config', async (req: Request, res: Response) => {
        try {
            const { public_hub_base_url } = config;
            res.json({
                public_hub_base_url
            })
        } catch (error) {
            res.json(null)
        } 
    })

    app.get('/api/profile/all', (req: Request, res: Response) => {
        let profiles = saveServer.getProfiles() as Record<string, ISptProfile>

        for (const profile_k in profiles) {
            let profile = profiles[profile_k]
            if (typeof profile?.characters?.pmc?.Info?.Side !== 'string') {
                logger.log(`It appears that profile id '${profile_k}' is using an old data structure not compatible with RAID-REVIEW.`)
                delete profiles[profile_k]
            }
        }

        return res.json(profiles)
    })

    app.get('/api/raids', async (req: Request, res: Response) => {
        let { profiles } = req.query as { profiles?: string };

        let profileFilter = null;
        if (profiles) {
            let profileIdsEnc = JSON.parse(profiles);
            profileFilter = profileIdsEnc.length > 0 ? profileIdsEnc.map(pid => `profileId == '${pid}'`).join(' AND ') : null;
        }
            
        const sqlRaidQuery = `SELECT * FROM raid WHERE ${ profileFilter ? `${profileFilter} AND` : '' } timeInRaid > 10 ORDER BY id DESC`
        const data = await db.all(sqlRaidQuery).catch((e: Error) => logger.error(`[API:RAIDS-ALL] `, e))

        res.json(data)
    })

    app.post('/api/raids/import', async (req: Request, res: Response) => {
        let fileData = Buffer.from([]);
        const boundary = req.headers['content-type']?.split('boundary=')[1];
        if (!boundary) {
            return res.status(400).json({ message: 'Invalid form data' });
        }
    
        req.on('data', (chunk) => {
            fileData = Buffer.concat([fileData, chunk]);
        });

        req.on('end', async () => {
            const fileStart = fileData.indexOf('\r\n\r\n') + 4;
            const fileEnd = fileData.lastIndexOf(`--${boundary}--`) - 2;

            const fileBuffer = fileData.slice(fileStart, fileEnd);
            const fileHeaders = fileData.slice(0, fileStart).toString();
    
            const contentDisposition = fileHeaders.match(/filename="(.+?)"/);
            if (!contentDisposition) return res.status(400).json({ message: 'No file name found' });
    
            const decompressed = await decompressData(fileBuffer)
            const raidId = await importRaidData(db, logger, JSON.parse(decompressed));

            const fileName = `${raidId}__import.json`;
            const filePath = path.join(__dirname, 'uploads', fileName);

            writeFile(filePath, decompressed, (err) => {
                if (err) return res.status(500).json({ message: 'File upload failed', error: err.message });
    
                res.status(200).json({
                    message: 'File uploaded and processed successfully',
                    file: { name: `${raidId}__import.json`, path: filePath },
                });
            });
        });
    
        req.on('error', (err) => {
            res.status(500).json({ message: 'File upload error', error: err.message });
        });
    })

    app.get('/api/raids/:raidId', async (req: Request, res: Response) => {
        try {
            let { raidId } = req.params

            const raid = await getRaidData(db, logger, raidId)

            if (raid.positionsTracked === 'RAW') {
                let positional_data = CompileRaidPositionalData(raidId, logger)
                let telemetryEnabled = config.telemetry
                if (telemetryEnabled) {
                    logger.log(`Telemetry is enabled.`)
                    await sendStatistics(db, logger, raidId, positional_data)
                } else {
                    logger.log(`Telemetry is disabled.`)
                }
                raid.positionsTracked = 'COMPILED'
            }

            return res.json(raid)
        } catch (error) {
            logger.log(error)
            return res.json(null)
        }
    })

    app.get('/api/raids/:raidId/positions', async (req: Request, res: Response) => {
        let { raidId } = req.params

        const positionalDataRaw = ReadFile(logger, 'positions', '', '', `${raidId}_${ACTIVE_POSITIONAL_DATA_STRUCTURE}_positions.json`)
        if (positionalDataRaw) {
            let positionalData = JSON.parse(positionalDataRaw)
            positionalData = generateInterpolatedFramesBezier(positionalData, 5, 24)
            return res.json(positionalData)
        }

        return []
    })

    app.get('/api/raids/:raidId/export', async (req: Request, res: Response) => {

        try {
            let { raidId } = req.params

            const raid = await getRaidData(db, logger, raidId);

            if (!raid) {
                throw Error(`Raid could not be found`);
            }

            if (raid.positionsTracked === 'RAW') {
                CompileRaidPositionalData(raidId, logger)
                raid.positionsTracked = 'COMPILED'
            }

            const positionalDataRaw = ReadFile(logger, 'positions', '', '', `${raidId}_${ACTIVE_POSITIONAL_DATA_STRUCTURE}_positions.json`)
            let positionalData = JSON.parse(positionalDataRaw);

            const compressedBuffer = await compressData(
                JSON.stringify(
                    {
                        raid,
                        positions: positionalData
                    }
                )
            );

            res.setHeader('Content-Type', 'application/gzip');
            res.setHeader('Content-Disposition', `attachment; filename=${raidId}.raidreview`);
            return res.send(compressedBuffer);
        } 
        
        catch (error) {
            logger.log(error)
            return res.json(null)
        }

    });

    app.post('/api/raids/:raidId/share', async (req: Request, res: Response) => {
        try {
            let { raidId } = req.params;
            const payload = req.body;
    
            const raid = await getRaidData(db, logger, raidId);
            if (!raid) throw new Error(`Raid could not be found`);
    
            if (raid.positionsTracked === 'RAW') {
                CompileRaidPositionalData(raidId, logger);
                raid.positionsTracked = 'COMPILED';
            }
    
            const positionalDataRaw = ReadFile(logger, 'positions', '', '', `${raidId}_${ACTIVE_POSITIONAL_DATA_STRUCTURE}_positions.json`);
            const positionalData = JSON.parse(positionalDataRaw);
    
            const compressedBuffer = await compressData(
                JSON.stringify({
                    raid,
                    positions: positionalData,
                })
            );
    

            const formData = new FormData();
            formData.append('file', new Blob([compressedBuffer], { type: 'application/gzip' }), `${raidId}.raidreview`);
            formData.append('payload', JSON.stringify(payload));
            const uploadResponse = await fetch(`${config.public_hub_base_url}/api/v1/raid/receive`, {
                method: 'POST',
                body: formData,
            });
    
            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }
    
            const responseJson = await uploadResponse.json();
            return res.json(responseJson);
        } catch (error) {
            logger.error(error);
            return res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/raids/:raidId/positions/heatmap', async (req: Request, res: Response) => {
        let { raidId } = req.params;
    
        try {
            const positionalDataRaw = ReadFile(logger, 'positions', '', '', `${raidId}_${ACTIVE_POSITIONAL_DATA_STRUCTURE}_positions.json`)
            let positionalData = JSON.parse(positionalDataRaw)
            positionalData = generateInterpolatedFramesBezier(positionalData, 5, 24)
    
            const flattenedData = _.chain(positionalData).valuesIn().flatMapDeep().value();
    
            const points = flattenedData.map(entry => [entry.z, entry.x, 1]);
            const pointMap = new Map();
    
            points.forEach(([z, x, intensity]) => {
                const key = `${z},${x}`;
                if (pointMap.has(key)) {
                    if (pointMap.get(key)[2] < 1) {
                        pointMap.get(key)[2] += 1;
                    }
                } else {
                    pointMap.set(key, [z, x, 1]);
                }
            });
    
            const aggregatedPoints = Array.from(pointMap.values());

            return res.json(aggregatedPoints);
        } catch (error) {
            console.error('Error processing heatmap data:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }); 

    app.get('/api/profile/:profileId/raids/all', async (req: Request, res: Response) => {
        let { profileId } = req.params

        const sqlRaidQuery = `SELECT * FROM raid WHERE profileId = '${profileId}' AND timeInRaid > 10 ORDER BY id DESC`

        const data = await db.all(sqlRaidQuery).catch((e: Error) => logger.error(`[API:RAIDS-ALL] `, e))

        res.json(data)
    })

    app.get('/api/raids/:raidId/tempFiles', async (req: Request, res: Response) => {
        let { raidId } = req.params

        const tempFiles = ReadFile(logger, 'positions', '', '', `${raidId}_positions`)
        if (tempFiles) {
            return res.json(true)
        }

        return res.json(false)
    })

    app.post('/api/raids/deleteAllData', (req: Request, res: Response, next: NextFunction) => isUserAdmin(req, res, next, logger), async (req: Request, res: Response) => {
        const deletedRaids = []
        try {
            let { raidIds } = req.body

            for (let i = 0; i < raidIds.length; i++) {
                const raidId = raidIds[i]
                const keys = ['raid', 'kills', 'looting', 'player', 'player_status', 'ballistic']
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i]
                    const sqlKeyQuery = `DELETE FROM ${key} WHERE raidId = ?`
                    const sqlKeyValues = [raidId]
                    await db.all(sqlKeyQuery, sqlKeyValues).catch((e: Error) => logger.error(`[API:DELETE-ALL] `, e))
                }

                DeleteFile('positions', '', '', `${raidId}_positions`)
                DeleteFile('positions', '', '', `${raidId}_${ACTIVE_POSITIONAL_DATA_STRUCTURE}_positions.json`)

                deletedRaids.push(raidId)
            }

            res.json(deletedRaids)
        } catch (error) {
            logger.log(error)
            res.json(deletedRaids)
        }
    })

    app.post('/api/raids/deleteTempFiles', (req: Request, res: Response, next: NextFunction) => isUserAdmin(req, res, next, logger), async (req: Request, res: Response) => {
        const deletedTempFiles = []
        try {
            let { raidIds } = req.body

            for (let i = 0; i < raidIds.length; i++) {
                const raidId = raidIds[i]
                logger.log(`Deleting temp files for Raid Id: '${raidId}'.`)
                DeleteFile('positions', '', '', `${raidId}_positions`)
                deletedTempFiles.push(raidId)
            }

            res.json(deletedTempFiles)
        } catch (error) {
            logger.log(error)
            res.json(deletedTempFiles)
        }
    })

    app.get('*', (req: Request, res: Response) => {
        return res.sendFile(path.join(__dirname, '/public/index.html'))
    })

    app.listen(port, () => {
        return logger.log(`Web Server is running at 'http://127.0.0.1:${port}'.`)
    })
}

export default StartWebServer
