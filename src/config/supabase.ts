import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Service role key ile kurulan Supabase client'ı.
 *
 * DİKKAT: Service role key RLS'i bypass eder ve tam yetkiye sahiptir.
 * Bu client yalnızca backend'de kullanılmalı, asla frontend'e veya
 * response gövdesine sızdırılmamalıdır.
 */
export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
