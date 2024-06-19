import fs from 'fs';
import _ from 'lodash';

export interface FileImport {
    datapoint: string;
    data: string;
}

export interface positional_data {
    profileId: string
    time: number
    x: number
    y: number
    z: number
    dir: number
    raid_id: string
}
  
export interface positional_data__grouped {
    [key:string] : positional_data[]
}

// Data Structure Versions
// 1 = '' = positions[][]
// 2 = 'V2' = { <player-id> : positions[]  }
const ACTIVE_POSITIONAL_DATA_STRUCTURE = 'V2';

function CompileRaidPositionalData(raid_guid: string) : positional_data__grouped {
    console.log(`[RAID-REVIEW] Starting - Compiling positional data (${ACTIVE_POSITIONAL_DATA_STRUCTURE}) for '${raid_guid}' into '.json' format.`);

    const file_suffixes = ['positions'];
    const files = [] as FileImport[];

    for (let i = 0; i < file_suffixes.length; i++) {
        const file_suffix = file_suffixes[i];

        const fileExists = fs.existsSync(`${__dirname}/../../../data/positions/${raid_guid}_positions`);
        if (fileExists) {
            const file_data = fs.readFileSync(`${__dirname}/../../../data/positions/${raid_guid}_positions`, 'utf-8');
            files.push({
                datapoint: file_suffix,
                data: file_data
            });
        };
    }

    if (files.length === 0) {
        console.log(`[RAID-REVIEW] Finished - Compiling positional data for '${raid_guid}' into '.json' format.`);
        return;
    }

    let positional_data__grouped = {} as { [key:string] : positional_data[] }; // Output to Filesystem, needed for positional replay.
    for (let i = 0; i < files.length; i++) {
        
        const file = files[i];
        const [ keys_str, ...data_str ] = file.data.split('\n');
        const keys = keys_str.replace('\n', '').split(',');
        const rows = data_str.filter((row) => row !== '').map(row => row.split(','));

        console.log(`[RAID-REVIEW]     Found a total of '${rows.length}' recorded positions, processing into data structure '${ACTIVE_POSITIONAL_DATA_STRUCTURE}'.`)
        if (file.datapoint === 'positions') {

            let allPositions = [];
            for (let j = 0; j < rows.length; j++) {
                const row = rows[j];

                let position = {} as any;
                for (let k = 0; k < keys.length; k++) {
                    const key = keys[k];
                    position[key] = row[k];

                    if (['time', 'x', 'y', 'z', 'dir'].includes(key)) {
                        position[key] = Number(row[k])
                    }
                }

                allPositions.push(position);
            }

            positional_data__grouped = _.chain(allPositions).orderBy('time', 'asc').groupBy('profileId').value();
        }
    }
    console.log(`[RAID-REVIEW] Finished - Compiling positional data (${ACTIVE_POSITIONAL_DATA_STRUCTURE}) for '${raid_guid}' into '.json' format.`);
    fs.writeFileSync(`${__dirname}/../../../data/positions/${raid_guid}_${ACTIVE_POSITIONAL_DATA_STRUCTURE}_positions.json`, JSON.stringify(positional_data__grouped), 'utf-8');
    console.log(`[RAID-REVIEW] Saved file  '${raid_guid}_positions.json' to folder '<mod_folder>/data/positions'.`);

    return positional_data__grouped;
};

export default CompileRaidPositionalData;