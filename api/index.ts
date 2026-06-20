/**
 * Vercel Serverless Function girişi.
 *
 * Vercel, fonksiyon dosyasının default export'unun DOĞRUDAN bir fonksiyon (ya
 * da http.Server) olmasını ister. Bu yüzden `export default createApp()` yerine
 * gerçek bir `handler` fonksiyonu export edip Express app'ine delege ediyoruz.
 * Express app'i `(req, res)` ile çağrılabilir; orijinal `req.url` korunduğu için
 * `/health`, `/api/*` ve `/docs` route'ları olduğu gibi çalışır.
 *
 * Not: `server.ts` (app.listen) import EDİLMEZ; serverless'te port dinlenmez.
 */
import { createApp } from '../src/app';

// Express app'i soğuk başlangıçta bir kez kur.
const app = createApp();

export default function handler(req: any, res: any) {
  return app(req, res);
}
