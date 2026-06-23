import webpush from 'web-push';
import { env } from '../config/env';
import { supabase } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { SubscribeInput } from '../schemas/push.schema';

const TABLE = 'push_subscriptions';

// VAPID anahtarları varsa web-push'u yapılandır.
const configured = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
if (configured) {
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY as string,
    env.VAPID_PRIVATE_KEY as string,
  );
}

interface SubRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Her zaman aynı mesajlar — sade Türkçe selamlar. */
const SLOT_MESSAGES = {
  morning: {
    title: 'Günaydın! ☀️',
    body: 'Yeni bir güne çiçek gibi başla. Bugün sevdiğin bir kitaba göz at olur mu? 🐱📖',
  },
  night: {
    title: 'İyi geceler! 🌙',
    body: 'Gözlerini dinlendirme vakti. Yarın kaldığın sayfadan devam ederiz. 🐱💤',
  },
} as const;

export const pushService = {
  isConfigured(): boolean {
    return configured;
  },

  publicKey(): string | null {
    return env.VAPID_PUBLIC_KEY ?? null;
  },

  cronSecret(): string | undefined {
    return env.PUSH_CRON_SECRET;
  },

  async saveSubscription(input: SubscribeInput, userAgent?: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        {
          endpoint: input.endpoint,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          user_agent: userAgent ?? null,
        },
        { onConflict: 'endpoint' },
      );
    if (error) throw AppError.internal(`Abonelik kaydedilemedi: ${error.message}`);
  },

  async deleteSubscription(endpoint: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('endpoint', endpoint);
    if (error) throw AppError.internal(`Abonelik silinemedi: ${error.message}`);
  },

  /** Hazır slot mesajını (günaydın/iyi geceler) tüm abonelere gönderir. */
  async sendSlot(slot: 'morning' | 'night'): Promise<{ sent: number; removed: number }> {
    const msg = SLOT_MESSAGES[slot];
    return this.dispatch({
      title: msg.title,
      body: msg.body,
      icon: '/cat-192.png',
      url: '/',
      slot,
      tag: 'kitaplik-' + slot,
    });
  },

  /** Swagger'dan/elle yazılan özel mesajı tüm abonelere gönderir. */
  async sendCustom(input: {
    title?: string;
    body: string;
    slot?: 'morning' | 'night' | 'default';
  }): Promise<{ sent: number; removed: number }> {
    return this.dispatch({
      title: input.title || "Zeliş'in Kütüphanesi",
      body: input.body,
      icon: '/cat-192.png',
      url: '/',
      slot: input.slot || 'default',
      tag: 'kitaplik-custom',
    });
  },

  /** Verilen payload'ı tüm abonelere gönderir; ölü abonelikleri (404/410) temizler. */
  async dispatch(notif: {
    title: string;
    body: string;
    icon: string;
    url: string;
    slot: string;
    tag: string;
  }): Promise<{ sent: number; removed: number }> {
    if (!configured) throw AppError.internal('Web push yapılandırılmamış (VAPID anahtarları eksik)');

    const { data, error } = await supabase
      .from(TABLE)
      .select('endpoint,p256dh,auth')
      .returns<SubRow[]>();
    if (error) throw AppError.internal(`Abonelikler okunamadı: ${error.message}`);

    const subs = data ?? [];
    const payload = JSON.stringify(notif);

    let sent = 0;
    const dead: string[] = [];
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          sent += 1;
        } catch (err: unknown) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) dead.push(s.endpoint);
        }
      }),
    );

    if (dead.length) {
      await supabase.from(TABLE).delete().in('endpoint', dead);
    }
    return { sent, removed: dead.length };
  },
};
