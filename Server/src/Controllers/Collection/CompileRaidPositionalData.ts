import fs from 'fs';
import _ from 'lodash';

export interface FileImport {
    datapoint: string;
    data: string;
}

export interface positonal_data {
    profileId: string
    time: number
    x: number
    y: number
    z: number
    dir: number
    raid_id: string
}
  
function CompileRaidPositionalData(raid_guid: string) : positonal_data[][] {
    console.log(`[RAID-REVIEW] Starting - Compiling positional data for '${raid_guid}' into '.json' format.`);

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

    let positional_data = [] as positonal_data[];
    let positional_data_2d = [] as positonal_data[][];
    for (let i = 0; i < files.length; i++) {
        
        const file = files[i];
        const [ keys_str, ...data_str ] = file.data.split('\n');
        const keys = keys_str.replace('\n', '').split(',');
        const rows = data_str.filter((row) => row !== '').map(row => row.split(','));

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

            positional_data = _.orderBy(allPositions, 'time', 'asc');
            let groupedByPlayerId = _.chain(positional_data).groupBy('profileId').value();
            Object.keys(groupedByPlayerId).forEach(key => {
                positional_data_2d.push(groupedByPlayerId[key])
            });
        }


    }
    console.log(`[RAID-REVIEW] Finished - Compiling positional data for '${raid_guid}' into '.json' format.`);
    fs.writeFileSync(`${__dirname}/../../../data/positions/${raid_guid}_positions.json`, JSON.stringify(positional_data), 'utf-8');
    console.log(`[RAID-REVIEW] Saved file  '${raid_guid}_data.json' to folder '<mod_folder>/data/positions'.`);

    return positional_data_2d;
};

export default CompileRaidPositionalData;