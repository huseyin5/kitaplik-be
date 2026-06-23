/**
 * Dış API'lerden (Google Books, Open Library) gelen sonuçların
 * normalize edildiği ortak kitap tipi.
 */
export type BookSource = 'google' | 'openlibrary';

export interface NormalizedBook {
  /** Kaynağa özel tekil kimlik (örn. Google volume id veya OL key) */
  id: string;
  source: BookSource;
  title: string;
  authors: string[];
  isbn: string | null;
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  pageCount: number | null;
}
