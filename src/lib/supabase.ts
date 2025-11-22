import { createBrowserClient } from '@supabase/ssr';

// Browser-safe keys (read-only "anon")
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);