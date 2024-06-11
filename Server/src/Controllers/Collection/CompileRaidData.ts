import fs from 'fs';

export interface FileImport {
    datapoint: string;
    data: string;
}

function CompileRaidData(profile_id: string , raid_guid: string) {
    console.log(`[RAID-REVIEW] Starting - Compiling raid data for '${raid_guid}' into '.json' format.`);

    const file_suffixes = ['raid', 'players', 'kills', 'looting'];
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

    let raid_data = {} as any;
    for (let i = 0; i < files.length; i++) {
        
        const file = files[i];
        const [ keys_str, ...data_str ] = file.data.split('\n');
        const keys = keys_str.replace('\n', '').split(',');
        const rows = data_str.filter((row) => row !== '').map(row => row.split(','));

        if (file.datapoint === 'raid') {
            for (let j = 0; j < rows.length; j++) {
                const row = rows[j];

                for (let k = 0; k < keys.length; k++) {
                    const key = keys[k];
                    raid_data[key] = row[k];
                }

            }
        }

        if (file.datapoint === 'players') {
            let players = [];

            for (let j = 0; j < rows.length; j++) {
                const row = rows[j];

                let newPlayer = {} as any;
                for (let k = 0; k < keys.length; k++) {
                    const key = keys[k];
                    newPlayer[key] = row[k];
                }

                if (newPlayer.type === "HUMAN") {
                    raid_data.playerId = newPlayer.id;
                }

                players.push(newPlayer);
            }

            raid_data.players = players;
        }

        if (file.datapoint === 'kills') {
            let kills = [];

            for (let j = 0; j < rows.length; j++) {
                const row = rows[j];

                let newKill = {} as any;
                for (let k = 0; k < keys.length; k++) {
                    const key = keys[k];
                    newKill[key] = row[k];
                }

                kills.push(newKill);
            }

            raid_data.kills = kills;
        }

        if (file.datapoint === 'looting') {
            let looting = [];

            for (let j = 0; j < rows.length; j++) {
                const row = rows[j];

                let newLooting = {} as any;
                for (let k = 0; k < keys.length; k++) {
                    const key = keys[k];
                    newLooting[key] = row[k];
                }

                looting.push(newLooting);
            }

            raid_data.looting = looting;
        }
    }
    console.log(`[RAID-REVIEW] Finished - Compiling raid data for '${raid_guid}' into '.json' format.`);

    fs.writeFileSync(`${__dirname}/../../../data/${profile_id}/raids/${raid_guid}/${raid_guid}_data.json`, JSON.stringify(raid_data, null, 2),'utf-8');

    console.log(`[RAID-REVIEW] Saved file  '${raid_guid}_data.json' to folder '<mod_folder>/data/${profile_id}/raids/${raid_guid}'.`);
};

export default CompileRaidData;