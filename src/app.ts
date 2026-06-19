import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { apiRouter } from './routes';
import { openapiSpec } from './config/openapi';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler';

export function createApp(): Application {
  const app = express();

  // CORS — frontend ileride farklı origin'den çağıracak.
  const origins =
    env.CORS_ORIGIN === '*'
      ? true
      : env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(cors({ origin: origins }));

  // Body parser
  app.use(express.json());

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Swagger UI — interaktif API dokümantasyonu / test arayüzü
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
  // Ham OpenAPI JSON (örn. Postman/başka araçlara import için)
  app.get('/docs.json', (_req: Request, res: Response) => {
    res.json(openapiSpec);
  });

  // API route'ları
  app.use('/api', apiRouter);

  // 404 ve global hata yönetimi — en sonda, sırayla.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
