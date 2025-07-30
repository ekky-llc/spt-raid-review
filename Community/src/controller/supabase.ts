
import { createClient } from '@supabase/supabase-js'

function supabaseConnect(endpoint: string, key: string) {
    
    const supabaseUrl = endpoint as string;
    const supabaseKey = key as string;

    return createClient(supabaseUrl, supabaseKey);
};

export {
    supabaseConnect
}