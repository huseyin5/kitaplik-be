import { z } from 'zod';

/** GET /api/books/search query doğrulaması */
export const searchBooksQuerySchema = z.object({
  q: z
    .string({ required_error: 'Arama terimi (q) zorunlu' })
    .trim()
    .min(1, 'Arama terimi boş olamaz')
    .max(200, 'Arama terimi çok uzun'),
  by: z.enum(['title', 'author']).optional(),
  limit: z.coerce.number().int().min(1).max(40).default(20),
});

export type SearchBooksQuery = z.infer<typeof searchBooksQuerySchema>;

/** GET /api/books/:source/:id params doğrulaması */
export const bookDetailParamsSchema = z.object({
  source: z.enum(['google', 'openlibrary'], {
    errorMap: () => ({ message: 'source yalnızca "google" veya "openlibrary" olabilir' }),
  }),
  id: z.string().trim().min(1, 'Kitap id zorunlu'),
});

export type BookDetailParams = z.infer<typeof bookDetailParamsSchema>;
