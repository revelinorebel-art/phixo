
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('__SUPABASE_URL__')) {
      throw new Error("Supabase URL en Anon Key moeten zijn ingesteld in de .env.local file.");
    }

    export const supabase = createClient(supabaseUrl, supabaseAnonKey);
  