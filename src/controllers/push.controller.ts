import { Request, Response, NextFunction } from 'express';
import { pushService } from '../services/push.service';
import { AppError } from '../utils/AppError';
import { SubscribeInput, UnsubscribeInput, RunQuery, SendInput } from '../schemas/push.schema';

export const pushController = {
  /** GET /api/push/public-key */
  publicKey(_req: Request, res: Response): void {
    res.json({ publicKey: pushService.publicKey() });
  },

  /** POST /api/push/subscribe */
  async subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!pushService.isConfigured()) {
        throw new AppError(503, 'Bildirimler sunucuda yapılandırılmamış');
      }
      const input = req.body as SubscribeInput;
      await pushService.saveSubscription(input, req.get('user-agent') ?? undefined);
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/push/unsubscribe */
  async unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { endpoint } = req.body as UnsubscribeInput;
      await pushService.deleteSubscription(endpoint);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/push/send — özel mesajla anlık gönderim (Swagger'dan). */
  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!pushService.isConfigured()) {
        throw new AppError(503, 'Bildirimler sunucuda yapılandırılmamış');
      }
      const input = req.body as SendInput;
      const secret = pushService.cronSecret();
      if (secret) {
        const auth = req.get('authorization') || '';
        const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
        const key = bearer || input.key || '';
        if (key !== secret) throw new AppError(401, 'Yetkisiz: geçerli bir key gerekli');
      }
      const result = await pushService.sendCustom({
        title: input.title,
        body: input.body,
        slot: input.slot,
      });
      res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/push/run?slot=morning|night — zamanlanmış gönderim (Vercel Cron).
   * PUSH_CRON_SECRET tanımlıysa Authorization: Bearer <secret> veya ?key=<secret>
   * ile korunur.
   */
  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const secret = pushService.cronSecret();
      if (secret) {
        const auth = req.get('authorization') || '';
        const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
        const key = bearer || (req.query.key as string | undefined) || '';
        if (key !== secret) throw new AppError(401, 'Yetkisiz');
      }
      const { slot } = req.query as unknown as RunQuery;
      const result = await pushService.sendSlot(slot);
      res.json({ ok: true, slot, ...result });
    } catch (err) {
      next(err);
    }
  },
};
