import { createClient } from '@supabase/supabase-js';

// Browser-safe keys (read-only “anon”)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);