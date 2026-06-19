import { z } from 'zod';

/** Okuma durumu — DB'deki status alanıyla aynı değerler. */
export const readingStatusSchema = z.enum(['okunacak', 'okunuyor', 'okundu']);
export type ReadingStatus = z.infer<typeof readingStatusSchema>;

export const bookSourceSchema = z.enum(['google', 'openlibrary']);

/** POST /api/library body — kütüphaneye kitap ekleme */
export const addLibraryBookSchema = z.object({
  title: z.string().trim().min(1, 'Başlık zorunlu'),
  authors: z.array(z.string().trim().min(1)).default([]),
  isbn: z.string().trim().min(1).nullable().optional(),
  coverUrl: z.string().url('Geçerli bir kapak URL girin').nullable().optional(),
  publisher: z.string().trim().min(1).nullable().optional(),
  publishedDate: z.string().trim().min(1).nullable().optional(),
  description: z.string().trim().nullable().optional(),
  pageCount: z.number().int().positive().nullable().optional(),
  source: bookSourceSchema,
  status: readingStatusSchema.default('okunacak'),
});

export type AddLibraryBookInput = z.infer<typeof addLibraryBookSchema>;

/** GET /api/library query — status'e göre filtre */
export const listLibraryQuerySchema = z.object({
  status: readingStatusSchema.optional(),
});

export type ListLibraryQuery = z.infer<typeof listLibraryQuerySchema>;

/** PATCH /api/library/:id body — durum güncelleme */
export const updateLibraryBookSchema = z
  .object({
    status: readingStatusSchema,
  })
  .strict();

export type UpdateLibraryBookInput = z.infer<typeof updateLibraryBookSchema>;

/** /api/library/:id params */
export const libraryIdParamsSchema = z.object({
  id: z.string().uuid('Geçerli bir kitap id (uuid) gerekli'),
});

export type LibraryIdParams = z.infer<typeof libraryIdParamsSchema>;
