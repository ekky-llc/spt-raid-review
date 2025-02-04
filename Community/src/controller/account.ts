import { SupabaseClient } from '@supabase/supabase-js';
import stripe from 'stripe';

export const account = {
    getAccount: async function(supabase: SupabaseClient, discordId: string): Promise<Account | undefined | void> {
        try {

            const { data, error } = await supabase.from('account').select('*').eq('discordId', discordId) as { data: Account[], error: any };;
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

    getAccountByUploadToken: async function (supabase: SupabaseClient, uploadToken: string): Promise<Account | undefined | void> {
        try {

            const { data, error } = await supabase.from('account').select('*').eq('uploadToken', uploadToken).eq('isBanned', false) as { data: Account[], error: any };

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

    registerAccount: async function(supabase: SupabaseClient, discordAccessToken: string): Promise<Account | void> {
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

            const payload = [{ discordUsername: userData.username, discordId: userData.id }]
            const { data, error } = await supabase.from('account').insert(payload).select() as { data: Account[], error: any };
    
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

    updateSubscriptionStatus: async function(supabase: SupabaseClient, stripeSubscription: stripe.Subscription): Promise<void> {

        const { data: [ customer ] } = await supabase.from('account').select('*').eq('id', stripeSubscription.metadata.accountId) as { data: Account[], error: any };
        if (stripeSubscription.status === 'active') {
            await supabase.from('account').update({ membership: 2, stripe_customer_id: stripeSubscription.customer, stripe_subscrption_id: stripeSubscription.id }).eq('id', customer.id);
        } 
        
        else {
            await supabase.from('account').update({ membership: 1 }).eq('id', customer.id);
        }
    }
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

export interface Account {
    id: string,
    discordUsername: string,
    discordId: string,
    uploadToken: string,
    isActive: boolean, 
    isBanned: boolean, 
    membership: number,
    stripe_customer_id: string,
    stripe_subscription_id: string,
    created_at: Date
}