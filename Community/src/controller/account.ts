import { SupabaseClient } from '@supabase/supabase-js';

export const account = {
    getAccount: async function(supabase: SupabaseClient, discordId: string): Promise<DiscordAccount | undefined | void> {
        try {

            const { data, error } = await supabase.from('account').select('*').eq('discordId', discordId);

            if (data && Array.isArray(data)) {
                return data[0];
            }
            
            if (error) {
                console.error('Error fetching account:', error.message);
                throw error;
            }
        } 
        
        catch (err) {
            console.error('Unexpected error:', err);
            throw err;
        }
    },

    registerAccount: async function(supabase: SupabaseClient, discordAccessToken: string): Promise<DiscordAccount | void> {
        try {

            const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
                headers: {
                  Authorization: `Bearer ${discordAccessToken}`,
                },
            });

            const userData = await userResponse.json() as DiscordAccount;
            if (!userData) {
                console.error('Error fetching discord account');
                throw `'Error fetching discord account: Invalid access token, or account does not exist.'`;
            }

            const payload = [{ discordId: userData.id }]
            const { data, error } = await supabase.from('account').insert(payload).select();
    
            if (data && data.length) {
                return data[0];
            }
            
            if (error) {
                console.error('Error registering account:', error.message);
                throw error;
            }
        } 
        
        catch (err) {
            console.error('Unexpected error:', err);
            throw err;
        }
    },
};

export interface DiscordAccount {
    id: string
    username: string
    avatar: string
    discriminator: string
    public_flags: number
    flags: number
    banner: any
    accent_color: number
    global_name: string
    avatar_decoration_data: any
    banner_color: string
    clan: any
    primary_guild: any
    mfa_enabled: boolean
    locale: string
    premium_type: number
    email: string
    verified: boolean
    phone: string
    nsfw_allowed: boolean
    analytics_token: string
    linked_users: Array<any>
    purchased_flags: number
    bio: string
    authenticator_types: Array<number>
}
  