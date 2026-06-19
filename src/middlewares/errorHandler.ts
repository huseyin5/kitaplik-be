import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

/**
 * 404 — eşleşmeyen route'lar için. Route tanımlarından sonra,
 * errorHandler'dan önce bağlanır.
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(AppError.notFound(`Endpoint bulunamadı: ${req.method} ${req.originalUrl}`));
};

/**
 * Global hata yönetimi middleware'i. Express'te 4 parametreli olarak
 * en sonda tanımlanır. Tüm hata tiplerini anlamlı HTTP yanıtlarına çevirir.
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  // Bilinen operasyonel hatalar
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Doğrudan yakalanan Zod hataları (validate dışında kalan durumlar)
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Geçersiz istek verisi',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  // Beklenmeyen hatalar
  const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
  console.error('🔥 Beklenmeyen hata:', err);

  res.status(500).json({
    error: 'Beklenmeyen bir hata oluştu',
    ...(env.NODE_ENV === 'development' ? { details: message } : {}),
  });
};
