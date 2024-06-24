import fs from 'fs';
import { DependencyContainer } from "tsyringe"
import { PreAkiModLoader } from "@spt-aki/loaders/PreAkiModLoader"

export interface RaidReviewDetectedMods {
    client : string[],
    server : string[]
}

export function GetInstalledMods(container: DependencyContainer) : RaidReviewDetectedMods {

    const ModLoader : PreAkiModLoader = container.resolve<PreAkiModLoader>("PreAkiModLoader");

    const serverMods = ModLoader.getImportedModsNames() || [];
    const clientMods = fs.readdirSync(`${__dirname}/../../../../BepInEx/plugins/`);

    return {
        client : clientMods,
        server : serverMods
    }
}