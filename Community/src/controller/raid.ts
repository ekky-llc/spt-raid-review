import { SupabaseClient } from '@supabase/supabase-js';

export const raid = {
    getRaids: async (supabase: SupabaseClient, days: number = 7) => {
      try {

        const now = new Date();
        const pastDate = new Date();
        pastDate.setDate(now.getDate() - days);
  
        const { data, error } = await supabase.from('raid').select('*').gte('created_at', pastDate.toISOString()).order('hits', { ascending: false });
  
        if (error) {
          console.error('Error fetching raids:', error.message);
          throw error;
        }
  
        return data;
      } 
      
      catch (err) {
        console.error('Unexpected error:', err);
        throw err;
      }
    },
  };