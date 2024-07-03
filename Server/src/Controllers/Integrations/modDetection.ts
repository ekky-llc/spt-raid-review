import fs from 'fs';
import { DependencyContainer } from "tsyringe"
import { PreAkiModLoader } from "@spt-aki/loaders/PreAkiModLoader"
import { MOD_SIGNATURES } from '../../constant';
import { Logger } from '../../Utils/logger';

export interface RaidReviewDetectedMods {
    client : string[],
    server : string[]
}

export interface IsInstalledRes {
    client: boolean,
    server: boolean
}
export class ModDetector {
    public client : string[]
    public server : string[]
    protected logger: Logger

    constructor(logger: Logger) {
        this.logger = logger;
        this.client = [];
        this.server = [];
    }

    getInstalledMods(container: DependencyContainer) : RaidReviewDetectedMods {
        const ModLoader : PreAkiModLoader = container.resolve<PreAkiModLoader>("PreAkiModLoader");
    
        const clientPluginsPath = `${__dirname}/../../../../../../BepInEx/plugins/`;
        const isLocalInstall = fs.existsSync(clientPluginsPath)
        if (isLocalInstall) {
            this.client = fs.readdirSync(clientPluginsPath);
        } 
        
        else {
            this.logger.log(`You're a smart cookie, appears to be a remote host installation? Client plugins could not be detected.`)
        }

        this.server = ModLoader.getImportedModsNames() || [];
    
        return {
            client : this.client,
            server : this.server
        }
    }

    // Mod Specific Helpers
    isModInstalled(modSignature : MOD_SIGNATURES) : IsInstalledRes {
        let client = !!this.client.find((mod) => mod.includes(modSignature.CLIENT));
        let server = !!this.client.find((mod) => mod.includes(modSignature.SERVER));

        return {
            client,
            server  
        }
    }

}