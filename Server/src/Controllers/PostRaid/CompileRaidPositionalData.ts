import fs from 'fs';
import _ from 'lodash';

export interface FileImport {
    datapoint: string;
    data: string;
}

function CompileRaidPositionalData(profile_id: string , raid_guid: string) {
    console.log(`[STATS] Starting - Compiling positional data for '${raid_guid}' into '.json' format.`);

    const file_suffixes = ['positions'];
    const files = [] as FileImport[];

    for (let i = 0; i < file_suffixes.length; i++) {
        const file_suffix = file_suffixes[i];

        const fileExists = fs.existsSync(`${__dirname}/../../../data/${profile_id}/raids/${raid_guid}/${raid_guid}_${file_suffix}.csv`)
        if (fileExists) {
            const file_data = fs.readFileSync(`${__dirname}/../../../data/${profile_id}/raids/${raid_guid}/${raid_guid}_${file_suffix}.csv`, 'utf-8');
            files.push({
                datapoint: file_suffix,
                data: file_data
            });
        };
    }

    let positional_data = {} as any;
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
                }

                allPositions.push(position);
            }

            positional_data = _.groupBy(allPositions, 'playerId');
        }


    }
    console.log(`[STATS] Finished - Compiling positional data for '${raid_guid}' into '.json' format.`);

    fs.writeFileSync(`${__dirname}/../../../data/${profile_id}/raids/${raid_guid}/${raid_guid}_positions.json`, JSON.stringify(positional_data, null, 2),'utf-8');

    console.log(`[STATS] Saved file  '${raid_guid}_data.json' to folder '<mod_folder>/data/${profile_id}/raids/${raid_guid}'.`);
};

export default CompileRaidPositionalData;