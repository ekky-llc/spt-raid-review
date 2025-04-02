import { SupabaseClient } from '@supabase/supabase-js';
import { account } from './account';

export const raid = {

    getRaids: async (supabase: SupabaseClient, days: number = 7): Promise<Raid[] | void>  => {
        try {
            const now = new Date();
            const pastDate = new Date();
            pastDate.setUTCDate(now.getUTCDate() - days);

            let query = supabase.from('raid').select('*').order('hits', { ascending: false });

            console.log(days)

            if (days !== 99999) {
                query = query.gte('created_at', pastDate.toISOString());
            }

            const { data, error } = await query as { data: Raid[], error: any };

            console.log(data)

            if (error) {
              console.error('Error fetching raids:', error.message);
              throw error;
            }

            return data;
        } 
        
        catch (error) {
            console.error('Unexpected error:', error);
            throw error;
        }
    },

    getRaid: async (supabase: SupabaseClient, raidId: string): Promise<Raid | void> => {
        try {
      
            const { data, error } = await supabase.from('raid').select('*').eq('raidId', raidId) as { data: Raid[], error: any};

            if (error) {
              console.error('Error fetching raids:', error.message);
              throw error;
            }

            return data[0];
        } 
        
        catch (error) {
            console.error('Unexpected error:', error);
            throw error;
        }
    },

    saveRaid: async (supabase: SupabaseClient, payload: any, username: string, accountId: string, storageKey: string): Promise<Raid | void> => {
        try {
          
            const { data, error } = await supabase.from('raid').insert([{
                // Discord Username, ID and R2 Storage Key
                username,
                accountId,
                storageKey,

                // Payload Data
                raidId: payload.raidId,
                title: payload.title,
                description: payload.description,
                isPublic: payload.isPublic,
                location: payload.location,
                timeInRaid: payload.timeInRaid,
                exitName: payload.exitName,
                exitStatus: payload.exitStatus
            }]).select() as { data: Raid[], error: any};

            if (error) {
              console.error('Error fetching raids:', error.message);
              throw error;
            }

            return data[0];
       } 
      
       catch (error) {
           console.error('Unexpected error:', error);
           throw error;
       }
    },

    getUsersRaids: async (supabase: SupabaseClient, accountId: string, count: boolean = false): Promise<number | Raid[] | void>  => {
        try {
            let response;

            if (count) {
                response = await supabase.from('raid').select('id', { count: 'exact' }).eq('accountId', accountId);
                if (response.error) throw response.error;
                return response.count || 0;
            } 
            else {
                response = await supabase.from('raid').select('*').eq('accountId', accountId);
                if (response.error) throw response.error;
                return response.data as Raid[];
            }

        } 
        
        catch (error) {
            console.error('Error fetching raids:', error);
            throw error;
        }
    },
    
    deleteOldestRaids: async (supabase: SupabaseClient, accountdId: string, numberOfRaidsToDelete: number): Promise<Raid[] | void> => {
        
        try {
            const { data, error } = await supabase.from('raid').select('*').eq('accountId', accountdId).order('created_at', { ascending: true }).range(0, numberOfRaidsToDelete) as { data: Raid[], error: any };

            if (error) {
                console.error('Error fetching raids:', error.message);
                throw error;
            }

            if (data && data.length > 0) {
                await supabase.from('raid').delete().in('id', data.map((raid) => raid.id));
                return data;
            }

            return [];
        } 
        
        catch (error) {
            console.error('Unexpected error:', error);
            throw error;
        }

    }

};

export interface Raid {
    id: string,
    accountId: string, 
    raidId: string
    title: string,
    description: string,
    location: string,
    timeInRaid: string,
    exitName: string,
    exitStatus: string,
    craetedAt: Date,
    storageKey: string,
    isPublic: boolean,
    hits: number
}