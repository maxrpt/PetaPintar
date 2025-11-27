
import { createClient } from 'supabase/supabase-js';

// Access global variables defined in index.html
const supabaseUrl = (window as any).VITE_SUPABASE_URL as string;
const supabaseAnonKey = (window as any).VITE_SUPABASE_ANON_KEY as string;

// Validate that environment variables are set
if (!supabaseUrl) {
  throw new Error("Supabase URL is not defined. Please set window.VITE_SUPABASE_URL in index.html.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key is not defined. Please set window.VITE_SUPABASE_ANON_KEY in index.html.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);