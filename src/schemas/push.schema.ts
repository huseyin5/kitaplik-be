import { z } from 'zod';

/** POST /api/push/subscribe — tarayıcı PushSubscription.toJSON() çıktısı */
export const subscribeSchema = z.object({
  endpoint: z.string().url('Geçerli bir endpoint gerekli'),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

/** POST /api/push/unsubscribe */
export const unsubscribeSchema = z.object({
  endpoint: z.string().url('Geçerli bir endpoint gerekli'),
});

export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>;

/** POST /api/push/send — özel mesajla anlık gönderim (Swagger'dan kullanılır) */
export const sendSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  body: z.string().trim().min(1, 'Mesaj (body) zorunlu').max(300),
  slot: z.enum(['morning', 'night', 'default']).optional(),
  key: z.string().optional(), // PUSH_CRON_SECRET tanımlıysa zorunlu
});

export type SendInput = z.infer<typeof sendSchema>;

/** GET /api/push/run?slot=morning|night — zamanlanmış gönderim (cron) */
export const runQuerySchema = z.object({
  slot: z.enum(['morning', 'night']),
  key: z.string().optional(), // ?key=<secret> ile koruma (Bearer alternatifi)
});

export type RunQuery = z.infer<typeof runQuerySchema>;
