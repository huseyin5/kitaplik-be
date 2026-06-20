import { authClient } from '../config/supabase';
import { AppError } from '../utils/AppError';

/**
 * Username/şifre kimlik doğrulaması, Supabase Auth üzerine kuruludur.
 *
 * Supabase Auth e-posta tabanlı çalıştığından her kullanıcı adını sabit bir
 * iç alan adıyla sentetik bir e-postaya eşleriz (ör. "ali" -> "ali@<domain>").
 * Böylece auth.users tablosunu ve library_books.user_id foreign key'ini
 * olduğu gibi kullanırız; ayrı bir users tablosu gerekmez.
 */
const EMAIL_DOMAIN = 'users.kitaplik.local';

const usernameToEmail = (username: string): string =>
  `${username.toLowerCase()}@${EMAIL_DOMAIN}`;

export interface AuthResult {
  token: string;
  user: { id: string; username: string };
}

export const authService = {
  /** Yeni kullanıcı oluşturur ve oturum token'ı döner. */
  async register(username: string, password: string): Promise<AuthResult> {
    const email = usernameToEmail(username);

    const { error } = await authClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (error) {
      const msg = (error.message ?? '').toLowerCase();
      const duplicate =
        error.status === 422 ||
        msg.includes('already') ||
        msg.includes('exists') ||
        msg.includes('registered');
      if (duplicate) {
        throw new AppError(409, 'Bu kullanıcı adı zaten alınmış');
      }
      throw AppError.internal(`Kayıt başarısız: ${error.message}`);
    }

    // Kayıt sonrası doğrudan giriş yaparak token üret.
    return this.login(username, password);
  },

  /** Kullanıcı adı/şifre doğrular ve oturum token'ı döner. */
  async login(username: string, password: string): Promise<AuthResult> {
    const email = usernameToEmail(username);

    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      throw new AppError(401, 'Kullanıcı adı veya şifre hatalı');
    }

    return {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        username:
          (data.user.user_metadata?.username as string | undefined) ?? username,
      },
    };
  },
};
