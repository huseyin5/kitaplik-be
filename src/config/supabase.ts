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

/**
 * Auth (kayıt/giriş) işlemleri için AYRI bir client.
 *
 * `signInWithPassword` çağrısı client üzerinde bir oturum kurar ve sonraki
 * PostgREST isteklerinde service role yerine kullanıcının JWT'sini kullanmaya
 * başlar. Bunu veri client'ından (`supabase`) izole tutmak için ayrı bir
 * instance kullanıyoruz; böylece veri sorguları daima service role ile çalışır.
 */
export const authClient: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
