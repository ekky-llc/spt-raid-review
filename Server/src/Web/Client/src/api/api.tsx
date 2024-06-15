import { IAkiProfile } from '../../../../../types/models/eft/profile/IAkiProfile';
import { TrackingCoreData, TrackingRaidData } from '../types/api_types';

let isDev = window.location.host.includes("5173");
let hostname = isDev ? 'http://127.0.0.1:7829' : '';

const api = {
    getActiveProfile: async function() : Promise<string> {
        let profile = '' as string;
        try {
            const response = await fetch(hostname + `/api/profile/active`);
            const { data } : { data: { profileId: string } } = await response.json();
            return data.profileId;
        } 
        
        catch (error) {
            return profile;
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
    getCore : async function(profileId: string) : Promise<TrackingCoreData[]> {
        let core = [] as TrackingCoreData[];
        try {
            const response = await fetch(hostname + `/api/profile/${profileId}/raids/all`);
            const data = await response.json() as TrackingCoreData[];
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
            const response = await fetch(hostname + `/api/profile/${profileId}/raids/${raidId}/positions${groupByPlayer ? `?groupByPlayer=true` : ``}`);
            positions = await response.json() as any;
            return positions;
        } catch (error) {
            return positions;
        }
    }
}

export default api