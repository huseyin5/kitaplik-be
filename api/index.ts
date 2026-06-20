/**
 * Vercel Serverless Function girişi.
 *
 * Express uygulaması zaten bir `(req, res)` handler'ı olduğundan app'i default
 * export ediyoruz; `vercel.json`'daki rewrite tüm istekleri buraya yönlendirir.
 * Express orijinal `req.url`'i gördüğü için `/health`, `/api/*` ve `/docs`
 * route'ları olduğu gibi çalışır.
 *
 * Not: Bu dosya `server.ts`'i (app.listen) IMPORT ETMEZ; serverless ortamda
 * port dinlenmez, yalnızca handler export edilir.
 */
import { createApp } from '../src/app';

const app = createApp();

export default app;
