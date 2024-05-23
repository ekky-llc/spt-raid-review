import { IAkiProfile } from '../../../../../types/models/eft/profile/IAkiProfile';
import { TrackingCoreData, TrackingRaidData } from '../types/api_types';

let hostname = 'http://127.0.0.1:7829'

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
    getCore : async function(profileId: string) : Promise<TrackingCoreData> {
        let core = {
            raids : []
        } as TrackingCoreData;
        try {
            const response = await fetch(hostname + `/api/profile/${profileId}/raids/all`);
            const data = await response.json() as TrackingCoreData;
            core = data;
            return core
        } 
        
        catch (error) {
            return core;
        }
    },
    recompileCoreFile : async function(profileId: string) : Promise<void> {
        try {
            await fetch(hostname + `/api/profile/${profileId}/compile_core`);
            return;
        } 
        
        catch (error) {
            return;
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
}

export default api