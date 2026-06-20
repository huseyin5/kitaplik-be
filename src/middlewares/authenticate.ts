import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../utils/AppError';

/**
 * `Authorization: Bearer <token>` header'ındaki Supabase access token'ını
 * doğrular. Geçerliyse `req.user`'ı doldurur, değilse 401 ile reddeder.
 *
 * Not: `supabase.auth.getUser(token)` token'ı argüman olarak aldığından veri
 * client'ının oturumunu değiştirmez; bu yüzden ana client güvenle kullanılır.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token) {
      throw new AppError(401, 'Oturum açmanız gerekiyor');
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new AppError(401, 'Geçersiz veya süresi dolmuş oturum');
    }

    req.user = {
      id: data.user.id,
      username: data.user.user_metadata?.username as string | undefined,
      email: data.user.email,
    };
    next();
  } catch (err) {
    next(err);
  }
};
