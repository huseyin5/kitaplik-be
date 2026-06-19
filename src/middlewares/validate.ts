import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

/**
 * Request'in body/query/params bölümlerini Zod şemalarıyla doğrulayan
 * reusable middleware. Doğrulanan (ve dönüştürülen) değerler ilgili
 * request alanına geri yazılır, böylece controller'lar tip güvenli veriyle çalışır.
 *
 * Kullanım:
 *   router.get('/search', validate({ query: searchQuerySchema }), handler)
 *   router.post('/', validate({ body: createBookSchema }), handler)
 */
export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validate =
  (schemas: ValidationSchemas) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        // req.query bazı Express sürümlerinde salt-okunur olabildiğinden
        // doğrulanan değeri yeniden tanımlıyoruz.
        Object.defineProperty(req, 'query', {
          value: schemas.query.parse(req.query),
          writable: true,
          configurable: true,
        });
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          AppError.badRequest(
            'Geçersiz istek verisi',
            err.flatten().fieldErrors,
          ),
        );
        return;
      }
      next(err);
    }
  };
