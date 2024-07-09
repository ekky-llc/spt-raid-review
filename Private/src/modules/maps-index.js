import { useEffect, useMemo } from 'react';
import equal from 'fast-deep-equal';

// import doFetchMaps from './do-fetch-maps.js';
// import { langCode } from '../../modules/lang-helpers.js';
// import { placeholderMaps } from '../../modules/placeholder-data.js';

import rawMapData from '../assets/maps.json';

const initialState = {
    data: [],
    status: 'idle',
    error: null,
};


export const selectMaps = (state) => state.maps.data;

let fetchedData = false;
let refreshInterval = false;

export const useMapImages = () => {
    let allMaps = useMemo(() => {
        const mapImages = {};
        const apiImageDataMerge = (mapGroup, imageData, apiData) => {
            mapImages[imageData.key] = {
                id: apiData?.id,
                ...imageData,
                name: apiData?.name,
                normalizedName: mapGroup.normalizedName,
                primaryPath: mapGroup.primaryPath,
                displayText: apiData?.name,
                description: apiData?.description,
                duration: apiData?.raidDuration ? apiData?.raidDuration + ' min' : undefined,
                players: apiData?.players || mapGroup.players,
                image: `/maps/${imageData.key}.jpg`,
                imageThumb: `/maps/${imageData.key}_thumb.jpg`,
                bosses: apiData?.bosses.map(bossSpawn => {
                    return {
                        name: bossSpawn.name,
                        normalizedName: bossSpawn.normalizedName,
                        spawnChance: bossSpawn.spawnChance,
                        spawnLocations: bossSpawn.spawnLocations,
                    }
                }),
                spawns: apiData?.spawns || [],
                extracts: apiData?.extracts || [],
                locks: apiData?.locks || [],
                hazards: apiData?.hazards || [],
                lootContainers: apiData?.lootContainers || [],
                switches: apiData?.switches || [],
                stationaryWeapons: apiData?.stationaryWeapons || [],
            };
        };
        for (const mapsGroup of rawMapData) {
            for (const map of mapsGroup.maps) {
                apiImageDataMerge(mapsGroup, map);
            }
        }
        return mapImages;
    }, []);
    return allMaps;
};

export const useMapImagesSortedArray = () => {
    let mapArray = Object.values(useMapImages())
    
    mapArray.sort((a, b) => {
        if (a.normalizedName === 'openworld')
            return 1;
        if (b.normalizedName === 'openworld')
            return -1;
        return a.name.localeCompare(b.name);
    });

    return mapArray
}

export const mapIcons = {
    'ground-zero': '',
    'streets-of-tarkov': '',
    'customs': '',
    'factory': '',
    'interchange': '',
    'the-lab': '',
    'lighthouse': '',
    'reserve': '',
    'shoreline': '',
    'woods': '',
    'openworld': '',
};