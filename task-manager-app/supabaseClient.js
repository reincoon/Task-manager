import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Anon Key must be provided in app.json -> extra');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
