import { createClient } from "@supabase/supabase-js";

// Supabase configuration from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Verify environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Supabase URL or key is missing. Make sure you have set up your environment variables correctly."
  );
}

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
