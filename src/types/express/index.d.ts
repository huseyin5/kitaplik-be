/**
 * Express'in Request tipini genişletir. Auth ileride eklendiğinde
 * `authenticate` middleware'i `req.user` alanını dolduracak.
 * Şimdilik opsiyonel olarak tanımlı, henüz set edilmiyor.
 */
export interface AuthenticatedUser {
  id: string;
  username?: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
