import { ISptProfile } from '../../../Server/types/models/eft/profile/ISptProfile';
import { TrackingRaidData, TrackingCoreDataRaids, ShareRaidPayload } from '../types/api_types';

let isDev = window.location.host.includes("517");
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

    getConfig: async function() : Promise<{ [key: string] : string }> {
        let config = {} as { [key: string] : string };
        try {
            const response = await fetch(hostname + '/api/config');
            const data = await response.json() as { [key: string] : string };
            return data;
        } 
        
        catch (error) {
            return config;
        }
    },

    getRaids: async function(profileIds: string[] = []) : Promise<TrackingCoreDataRaids[]> {
        let raids = [] as TrackingCoreDataRaids[];
        try {
            const query = profileIds.length > 0 ? `?profiles=${encodeURIComponent(JSON.stringify(profileIds))}` : '';
            const response = await fetch(hostname + `/api/raids` + query);
            const data = await response.json() as TrackingCoreDataRaids[];
            raids = data;
            return data
        } 
        
        catch (error) {
            return raids;
        }
    },

    getProfiles: async function() : Promise<ISptProfile[]> {
        let profiles = [] as ISptProfile[];
        try {
            const response = await fetch(hostname + '/api/profile/all');
            const data = await response.json() as ISptProfile[];

            return data;
        } 
        
        catch (error) {
            return profiles;
        }
    },

    getRaid : async function(raidId: string) : Promise<TrackingRaidData> {
        let raid = {} as TrackingRaidData;
        try {
            const response = await fetch(hostname + `/api/raids/${raidId}`);
            const data = await response.json() as TrackingRaidData;
            raid = data;
            return raid
        } 
        
        catch (error) {
            return raid;
        }
    },

    verifyToken: async function(uploadToken: string): Promise<boolean | { raids: number, limit: number }> {

        try {
            const response = await fetch(`${hostname}/api/hub/verify-token`, {
                method: "POST",
                body: JSON.stringify({ uploadToken }),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 204) return false;

            const data = await response.json();
            return data
        } 
        
        catch (error) {
            return false;
        }
        
    },

    isRaidShared: async function(raidId: string) {

        try {
            const response = await fetch(`${hostname}/api/raids/${raidId}/check`);
            if (response.status === 204) return false;

            return true;
        } 
        
        catch (error) {
            return false;
        }

    },

    shareRaid: async function(raidId: string, shareRaidPayload: ShareRaidPayload) {
        try {
            const response = await fetch(`${hostname}/api/raids/${raidId}/share`, {
                method: "POST",
                body: JSON.stringify(shareRaidPayload),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                return true;
            }
            
            else {
                throw Error(`There was an issue uploading the raid.`)
            }
        } catch (error) {
            console.error(error)
            return false;
        }
    },

    exportRaid: async function (raidId: string): Promise<TrackingRaidData> {
        let raid = {} as TrackingRaidData;
        try {
            const response = await fetch(hostname + `/api/raids/${raidId}/export`);
            if (!response.ok) {
                throw new Error('Failed to fetch the file');
            }

            const fileBlob = await response.blob();
            const downloadLink = document.createElement('a');
            const url = window.URL.createObjectURL(fileBlob);
            downloadLink.href = url;
            downloadLink.download = `${raidId}.raidreview`;
            downloadLink.click();
    
            window.URL.revokeObjectURL(url);
    
            return raid;
        } catch (error) {
            console.error('Error exporting raid:', error);
            return raid;
        }
    },    

    importRaid: async function (payload: FormData) {
        try {
            const response = await fetch(hostname + `/api/raids/import`, {
                method: "POST",
                body: payload,
            });

            if (response.ok) {
                return true;
            }
            
            else {
                throw Error(`There was an issue uploading the raid.`)
            }
        } catch (error) {
            console.error(error)
            return false;
        }
    },

    getRaidTempFiles : async function(raidId: string) : Promise<boolean> {
        try {
            const response = await fetch(hostname + `/api/raids/${raidId}/tempFiles`);
            const data = await response.json() as boolean;
            return data;
        } 
        
        catch (error) {
            return false;
        }
    },

    deleteRaidsTempFiles : async function(payload : string[]) : Promise<string[]> {
        try {
            const response = await fetch(hostname + `/api/raids/deleteTempFiles`, {
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

    deleteRaids : async function(payload : string[]) : Promise<string[]> {
        try {

            const response = await fetch(hostname + `/api/raids/deleteAllData`, {
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

    getRaidPositionalData : async function(raidId: string) : Promise<any> {
        let positions = [] as any;
        try {
            const cached = window.sessionStorage.getItem(`${raidId}_positions`);
            if (cached) {
                positions = JSON.parse(cached);
            } 
            
            else {
                const response = await fetch(hostname + `/api/raids/${raidId}/positions`);
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

    getRaidHeatmapData : async function(raidId: string) : Promise<any> {
        let heatmapData = [] as any;
        try {
            const response = await fetch(hostname + `/api/raids/${raidId}/positions/heatmap`);
            heatmapData = await response.json() as any;
            return heatmapData;
        } catch (error) {
            return heatmapData;
        }
    }
}

export default api