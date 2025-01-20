import { DiscordAccount, RaidReviewAccount } from "../types/api_types";

let isDev = window.location.host.includes("517");
let hostname = isDev ? 'http://127.0.0.1:8787' : '';

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