import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Ortam değişkenlerini Zod ile doğrular. Uygulama açılışında bir kez çalışır;
 * eksik/hatalı bir env varsa süreç anlamlı bir mesajla sonlanır.
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  CORS_ORIGIN: z.string().default('*'),

  SUPABASE_URL: z.string().url('SUPABASE_URL geçerli bir URL olmalı'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY zorunlu'),

  GOOGLE_BOOKS_API_KEY: z.string().optional(),
  OPEN_LIBRARY_CONTACT: z.string().default('contact@example.com'),

  // Web Push (VAPID) — bildirimler. Yoksa push uçları 503 döner.
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:contact@example.com'),
  // Zamanlanmış gönderim ucunu (cron) koruyan gizli anahtar.
  PUSH_CRON_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Geçersiz ortam değişkenleri:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
