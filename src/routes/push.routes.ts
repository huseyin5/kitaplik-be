import { Router } from 'express';
import { pushController } from '../controllers/push.controller';
import { validate } from '../middlewares/validate';
import {
  subscribeSchema,
  unsubscribeSchema,
  sendSchema,
  runQuerySchema,
} from '../schemas/push.schema';

export const pushRouter = Router();

// GET /api/push/public-key
pushRouter.get('/public-key', pushController.publicKey);

// POST /api/push/subscribe
pushRouter.post('/subscribe', validate({ body: subscribeSchema }), pushController.subscribe);

// POST /api/push/unsubscribe
pushRouter.post('/unsubscribe', validate({ body: unsubscribeSchema }), pushController.unsubscribe);

// POST /api/push/send  (Swagger'dan özel mesaj gönderme)
pushRouter.post('/send', validate({ body: sendSchema }), pushController.send);

// GET /api/push/run?slot=morning|night  (Vercel Cron tetikler)
pushRouter.get('/run', validate({ query: runQuerySchema }), pushController.run);
