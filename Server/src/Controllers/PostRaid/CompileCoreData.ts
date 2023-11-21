import fs from 'fs';

export interface FileImport {
    datapoint: string;
    data: string;
}

function CompileCoreData(profile_id: string) {
    console.log(`[STATS] Starting - Compiling core data into '.json' format.`);

    const target_files = ['core'];
    const files = [] as FileImport[];

    for (let i = 0; i < target_files.length; i++) {
        const target_file = target_files[i];
        const file_data = fs.readFileSync(`${__dirname}/../../../data/${profile_id}/core/${target_file}.csv`, 'utf-8');
        
        console.log(`[STATS] Found file '${target_file}.csv' adding data to be processed.`)
        files.push({
            datapoint: target_file,
            data: file_data
        });
    }

    let core_data = {} as any;
    for (let i = 0; i < files.length; i++) {
        
        const file = files[i];
        const [ keys_str, ...data_str ] = file.data.split('\n');
        const keys = keys_str.replace('\n', '').split(',');
        const rows = data_str.filter((row) => row !== '').map(row => row.split(','));

        if (file.datapoint === 'raid') {
            let raids = [];

            for (let j = 0; j < rows.length; j++) {
                const row = rows[j];

                let newRaid = {};
                for (let k = 0; k < keys.length; k++) {
                    const key = keys[k];
                    newRaid[key] = row[k];
                }

                raids.push(newRaid);
            }

            raids = raids.filter((raid) => Number(raid.timeInRaid) > 0);

            core_data.raids = raids;
        }
    }
    
    console.log(`[STATS] Finished - Compiling core data into '.json' format.`);

    fs.writeFileSync(`${__dirname}/../../../data/${profile_id}/core/core.json`, JSON.stringify(core_data, null, 2),'utf-8');

    console.log(`[STATS] Saved file  'core.json' to folder '<mod_folder>/data/${profile_id}/core/core.json'.`);
};

export default CompileCoreData;