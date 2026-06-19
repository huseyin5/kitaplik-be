import { Request, Response, NextFunction } from 'express';
// import { supabase } from '../config/supabase';
// import { AppError } from '../utils/AppError';

/**
 * PLACEHOLDER — Auth henüz uygulanmadı.
 *
 * İleride Supabase Auth JWT doğrulaması buraya eklenecek. Beklenen akış:
 *   1. `Authorization: Bearer <token>` header'ından token alınır.
 *   2. `supabase.auth.getUser(token)` ile token doğrulanır.
 *   3. Geçerliyse `req.user = { id, email }` set edilip `next()` çağrılır.
 *   4. Geçersizse `AppError(401, ...)` ile reddedilir.
 *
 * Şu an hiçbir route'a bağlı değil; sadece yapı hazır olsun diye duruyor.
 *
 * Örnek (ileride):
 *   const token = req.headers.authorization?.replace('Bearer ', '');
 *   if (!token) return next(new AppError(401, 'Token gerekli'));
 *   const { data, error } = await supabase.auth.getUser(token);
 *   if (error || !data.user) return next(new AppError(401, 'Geçersiz token'));
 *   req.user = { id: data.user.id, email: data.user.email };
 *   next();
 */
export const authenticate = async (
  _req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  // Henüz uygulanmadı — şimdilik geçiş izni veriyor.
  next();
};
