import { DiscordAccount } from "../types/api_types";

let isDev = window.location.host.includes("517");
let hostname = isDev ? 'http://127.0.0.1:8787' : '';

const community_api = {

    getAccount: async function (discordAccount: DiscordAccount) {
        try {
            const response = await fetch(`${hostname}/api/account/${discordAccount.id}`);
            const data = response.json();
            return data;
        } 
        
        catch (error) {
            console.error(error);
            return null;
        }
    },

    registerAccount: async function (discordAccount: DiscordAccount) {
        
    }
}

export {
    community_api
}