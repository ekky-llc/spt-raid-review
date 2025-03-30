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

    updateSubscriptionStatus: async function(supabase: SupabaseClient, stripeEvent: string, stripePayload: stripe.Subscription | stripe.Invoice): Promise<void> {

        try {

            console.log(`INFO --- Processing information for 'STRIPE_CUSTOMER_ID:${stripePayload.customer}|RAID_REVIEW_ID:${stripePayload?.metadata?.account_id}'.`)
            if (stripeEvent === 'invoice.payment_failed') {
                console.log(`INFO --- Updating Membership to '1' due to 'invoice.failed_payment'.`)
                await supabase.from('account').update({ membership: 1 }).eq('stripe_customer_id', stripePayload.customer).select();
                return;
            }
            
            if (stripePayload.status === 'active' || stripeEvent === 'invoice.payment_succeeded') {
                console.log(`INFO --- Updating Membership to '2' due to 'customer.subscrption.created' OR 'customer.subscrption.updated'.`)
                await supabase.from('account').update({ membership: 2, stripe_customer_id: stripePayload.customer, stripe_subscription_id: stripePayload.id }).eq('id', stripePayload?.metadata?.account_id);
            } 
            
            if (stripePayload.status === 'canceled' || stripePayload.status === 'past_due') {
                console.log(`INFO --- Updating Membership to '1' due to 'customer.subscrption.deleted'.`)
                await supabase.from('account').update({ membership: 1 }).eq('id', stripePayload?.metadata?.account_id).select();
            }
        } 
        
        catch (error) {
            console.log(`ERROR - There was an error updating the membership for 'STRIPE_CUSTOMER_ID:${stripePayload.customer}|RAID_REVIEW_ID:${stripePayload?.metadata?.account_id}'.`)
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