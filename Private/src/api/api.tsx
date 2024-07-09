import { IAkiProfile } from '../../../Server/types/models/eft/profile/IAkiProfile';
import { TrackingRaidData, RaidReviewServerSettings, TrackingCoreDataRaids } from '../types/api_types';

let isDev = window.location.host.includes("5173");
let hostname = isDev ? 'http://127.0.0.1:7829' : '';

const api = {
    getIntl: async function() : Promise<{ [key: string] : string }> {
        let intl = {} as { [key: string] : string };
        try {
            const response = await fetch(hostname + '/api/intl');
            const data = await response.json() as { [key: string] : string };
            return data;
        } 
        
        catch (error) {
            return intl;
        }
    },

    getSettings: async function() : Promise<RaidReviewServerSettings> {
        let settings = {} as RaidReviewServerSettings;
        try {
            const response = await fetch(hostname + '/api/server/settings');
            const data = await response.json() as RaidReviewServerSettings;
            return data;
        } 
        
        catch (error) {
            return settings;
        }
    },

    updateSettings: async function(payload: { key: string, value: string }[]) : Promise<RaidReviewServerSettings | null> {
        try {
            const response = await fetch(hostname + `/api/server/settings`, {
                method: 'PUT',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const update_result = await response.json() as RaidReviewServerSettings;

            return update_result;
        } 
        
        catch (error) {
            return null;
        }
    },

    deleteAllData: async function() : Promise<boolean> {
        try {
            const response = await fetch(hostname + '/api/server/deleteAllData');
            const data = await response.json() as boolean;
            return data;
        } 
        
        catch (error) {
            return false;
        }
    },


    getProfiles: async function() : Promise<IAkiProfile[]> {
        let profiles = [] as IAkiProfile[];
        try {
            const response = await fetch(hostname + '/api/profile/all');
            const data = await response.json() as IAkiProfile[];

            Object.keys(data).forEach((profile : string) => {
                // @ts-ignore
                profiles.push(data[profile]);
            });

            return profiles;
        } 
        
        catch (error) {
            return profiles;
        }
    },

    getProfile : async function(profileId: string) : Promise<IAkiProfile> {
        let profile = {} as IAkiProfile;
        try {
            const response = await fetch(hostname + `/api/profile/${profileId}`);
            const data = await response.json() as IAkiProfile;
            profile = data;
            return profile
        } 
        
        catch (error) {
            return profile;
        }
    },

    getCore : async function(profileId: string) : Promise<TrackingCoreDataRaids[]> {
        let core = [] as TrackingCoreDataRaids[];
        try {
            const response = await fetch(hostname + `/api/profile/${profileId}/raids/all`);
            const data = await response.json() as TrackingCoreDataRaids[];
            core = data;
            return core
        } 
        
        catch (error) {
            return core;
        }
    },

    getRaid : async function(profileId: string, raidId: string) : Promise<TrackingRaidData> {
        let raid = {} as TrackingRaidData;
        try {
            const response = await fetch(hostname + `/api/profile/${profileId}/raids/${raidId}`);
            const data = await response.json() as TrackingRaidData;
            raid = data;
            return raid
        } 
        
        catch (error) {
            return raid;
        }
    },

    getRaidTempFiles : async function(profileId: string, raidId: string) : Promise<boolean> {
        try {
            const response = await fetch(hostname + `/api/profile/${profileId}/raids/${raidId}/tempFiles`);
            const data = await response.json() as boolean;
            return data;
        } 
        
        catch (error) {
            return false;
        }
    },

    deleteRaidsTempFiles : async function(profileId: string, payload : string[]) : Promise<string[]> {
        try {
            const response = await fetch(hostname + `/api/profile/${profileId}/raids/deleteTempFiles`, {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "raidIds": payload
                })
            });
            const delete_result = await response.json() as string[];

            return delete_result;
        } 
        
        catch (error) {
            return [];
        }
    },

    deleteRaids : async function(profileId: string, payload : string[]) : Promise<string[]> {
        try {

            const response = await fetch(hostname + `/api/profile/${profileId}/raids/deleteAllData`, {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "raidIds": payload
                })
            });
            const delete_result = await response.json() as string[];

            return delete_result
        } 
        
        catch (error) {
            return [];
        }
    },

    getRaidPositionalData : async function(profileId: string, raidId: string, groupByPlayer : boolean = false) : Promise<any> {
        let positions = [] as any;
        try {
            const cached = window.sessionStorage.getItem(`${raidId}_positions`);
            if (cached) {
                positions = JSON.parse(cached);
            } 
            
            else {
                const response = await fetch(hostname + `/api/profile/${profileId}/raids/${raidId}/positions${groupByPlayer ? `?groupByPlayer=true` : ``}`);
                positions = await response.json() as any;
            }

            if (positions) {
                window.sessionStorage.setItem(`${raidId}_positions`, JSON.stringify(positions));
            }

            return positions;
        } catch (error) {
            return positions;
        }
    },

    getRaidHeatmapData : async function(profileId: string, raidId: string) : Promise<any> {
        let heatmapData = [] as any;
        try {
            const response = await fetch(hostname + `/api/profile/${profileId}/raids/${raidId}/positions/heatmap`);
            heatmapData = await response.json() as any;
            return heatmapData;
        } catch (error) {
            return heatmapData;
        }
    }
}

export default api