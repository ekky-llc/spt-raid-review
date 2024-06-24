import fs from 'fs';
import { DependencyContainer } from "tsyringe"
import { PreAkiModLoader } from "@spt-aki/loaders/PreAkiModLoader"
import { CONSTANTS, MOD_SIGNATURES } from 'src/constant';

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

    constructor() {
        this.client = [];
        this.server = [];
    }

    getInstalledMods(container: DependencyContainer) : RaidReviewDetectedMods {
        const ModLoader : PreAkiModLoader = container.resolve<PreAkiModLoader>("PreAkiModLoader");
    
        this.client = fs.readdirSync(`${__dirname}/../../../../../../BepInEx/plugins/`);
        this.server = ModLoader.getImportedModsNames() || [];
    
        return {
            client : this.client,
            server : this.server
        }
    }

    // Mod Specific Helpers
    isModInstalled(modSignature : MOD_SIGNATURES) : IsInstalledRes {
        let client = this.client.includes(modSignature.CLIENT);
        let server = this.client.includes(modSignature.SERVER);

        return {
            client,
            server  
        }
    }

}