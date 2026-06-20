import { z } from 'zod';

/** Kullanıcı adı: 3-30 karakter, yalnızca harf/rakam/alt çizgi. */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Kullanıcı adı en az 3 karakter olmalı')
  .max(30, 'Kullanıcı adı en fazla 30 karakter olabilir')
  .regex(/^[a-zA-Z0-9_]+$/, 'Sadece harf, rakam ve alt çizgi kullanılabilir');

/** POST /api/auth/register */
export const registerSchema = z
  .object({
    username: usernameSchema,
    password: z
      .string()
      .min(6, 'Şifre en az 6 karakter olmalı')
      .max(72, 'Şifre en fazla 72 karakter olabilir'),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;

/** POST /api/auth/login */
export const loginSchema = z
  .object({
    username: usernameSchema,
    password: z.string().min(1, 'Şifre zorunlu'),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
