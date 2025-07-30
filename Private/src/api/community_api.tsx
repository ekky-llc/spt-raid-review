import { DiscordAccount, RaidReviewAccount, TrackingRaidData } from "../types/api_types";

let isDev = window.location.host.includes("517");
let hostname = isDev ? '' : '';

import en_data from '../assets/intl/en.json'

const community_api = {

    getRaids: async function(days: number = 7) {

        try {
            const response = await fetch(`${hostname}/api/v1/raid/all?days=${days}`);
            const data = response.json();
            return data;
        } 
        
        catch (error) {
            console.error(error);
            return null;
        }

    },

    getRaid: async function(raidId: string) {
        let raid = {} as TrackingRaidData;
        try {
            const response = await fetch(`${hostname}/api/v1/raid/${raidId}`);
            const data = await response.json() as TrackingRaidData;
            raid = data;
            return raid
        } 
        
        catch (error) {
            return raid;
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
                const response = await fetch(`${hostname}/api/v1/raid/${raidId}/positions`);
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
            const response = await fetch(`${hostname}/api/v1/raid/${raidId}/positions/heatmap`);
            heatmapData = await response.json() as any;
            return heatmapData;
        } catch (error) {
            return heatmapData;
        }
    },

    getIntl: async function() {
        return en_data;
    },

    getAccount: async function(discordAccount: DiscordAccount) : Promise<null | RaidReviewAccount>  {
        try {
            const response = await fetch(`${hostname}/api/v1/account/${discordAccount.id}`);
            const data = response.json();

            if (response.status === 204) {
                return null;
            }

            return data;
        } 
        
        catch (error) {
            console.error(error);
            return null;
        }
    },

    login: async function(accessToken: string) : Promise<null | { discordAccount: DiscordAccount, raidReviewAccount: RaidReviewAccount }>  {
        try {
            const response = await fetch(`${hostname}/api/v1/auth/login`,{
                method: 'POST',
                body: JSON.stringify({
                    accessToken
                })
            });
            const data = response.json();

            if (response.status === 204) {
                return null;
            }

            return data;
        } 
        
        catch (error) {
            console.error(error);
            return null;
        }
    },

    logout: async function() : Promise<void>  {
        try {
            await fetch(`${hostname}/api/v1/auth/logout`);
        } 
        
        catch (error) {
            console.error(error);
        }
    },

    verify: async function() : Promise<null | { discordAccount: DiscordAccount, raidReviewAccount: RaidReviewAccount }>  {
        try {
            const response = await fetch(`${hostname}/api/v1/auth/verify`);
            if (response.status === 204) return null;

            const data = response.json();

            return data;
        } 
        
        catch (error) {
            console.error(error);
            return null;
        }
    },

    registerAccount: async function(accessToken: string) : Promise<null | RaidReviewAccount> {
        try {
            const response = await fetch(`${hostname}/api/v1/account/register`,{
                method: 'POST',
                body: JSON.stringify({
                    accessToken
                })
            });
            const data = response.json();
            return data;
        } 
        
        catch (error) {
            console.error(error);
            return null;
        }
    }
    
}

export {
    community_api
}