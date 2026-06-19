import { supabase } from '../config/supabase';
import { AppError } from '../utils/AppError';
import {
  AddLibraryBookInput,
  ListLibraryQuery,
  ReadingStatus,
} from '../schemas/library.schema';

const TABLE = 'library_books';

/** DB satırının (snake_case) tipi. */
export interface LibraryBookRow {
  id: string;
  user_id: string | null;
  title: string;
  authors: string[];
  isbn: string | null;
  cover_url: string | null;
  publisher: string | null;
  published_date: string | null;
  description: string | null;
  page_count: number | null;
  source: string;
  status: ReadingStatus;
  created_at: string;
}

/** API'de döndürülen camelCase kitap temsili. */
export interface LibraryBookDto {
  id: string;
  userId: string | null;
  title: string;
  authors: string[];
  isbn: string | null;
  coverUrl: string | null;
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  pageCount: number | null;
  source: string;
  status: ReadingStatus;
  createdAt: string;
}

function toDto(row: LibraryBookRow): LibraryBookDto {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    authors: row.authors ?? [],
    isbn: row.isbn,
    coverUrl: row.cover_url,
    publisher: row.publisher,
    publishedDate: row.published_date,
    description: row.description,
    pageCount: row.page_count,
    source: row.source,
    status: row.status,
    createdAt: row.created_at,
  };
}

export const libraryService = {
  /**
   * Kütüphaneye kitap ekler. `userId` ileride auth eklenince
   * `req.user.id`'den gelecek; şimdilik null geçilebilir.
   */
  async add(
    input: AddLibraryBookInput,
    userId: string | null,
  ): Promise<LibraryBookDto> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        user_id: userId,
        title: input.title,
        authors: input.authors,
        isbn: input.isbn ?? null,
        cover_url: input.coverUrl ?? null,
        publisher: input.publisher ?? null,
        published_date: input.publishedDate ?? null,
        description: input.description ?? null,
        page_count: input.pageCount ?? null,
        source: input.source,
        status: input.status,
      })
      .select()
      .single<LibraryBookRow>();

    if (error || !data) {
      throw AppError.internal(`Kitap eklenemedi: ${error?.message ?? 'bilinmeyen hata'}`);
    }
    return toDto(data);
  },

  /** Kullanıcının kitaplarını listeler; status verilirse filtreler. */
  async list(
    filter: ListLibraryQuery,
    userId: string | null,
  ): Promise<LibraryBookDto[]> {
    let query = supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    // Auth eklenince user_id'ye göre daraltılacak.
    query = userId ? query.eq('user_id', userId) : query.is('user_id', null);

    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    const { data, error } = await query.returns<LibraryBookRow[]>();

    if (error) {
      throw AppError.internal(`Kütüphane listelenemedi: ${error.message}`);
    }
    return (data ?? []).map(toDto);
  },

  /** Bir kitabın okuma durumunu günceller. Yoksa 404. */
  async updateStatus(
    id: string,
    status: ReadingStatus,
    userId: string | null,
  ): Promise<LibraryBookDto> {
    let query = supabase.from(TABLE).update({ status }).eq('id', id);
    query = userId ? query.eq('user_id', userId) : query.is('user_id', null);

    const { data, error } = await query.select().maybeSingle<LibraryBookRow>();

    if (error) {
      throw AppError.internal(`Kitap güncellenemedi: ${error.message}`);
    }
    if (!data) {
      throw AppError.notFound(`Kütüphanede kitap bulunamadı: ${id}`);
    }
    return toDto(data);
  },

  /** Kitabı kütüphaneden siler. Yoksa 404. */
  async remove(id: string, userId: string | null): Promise<void> {
    let query = supabase.from(TABLE).delete().eq('id', id);
    query = userId ? query.eq('user_id', userId) : query.is('user_id', null);

    const { data, error } = await query.select('id').maybeSingle<{ id: string }>();

    if (error) {
      throw AppError.internal(`Kitap silinemedi: ${error.message}`);
    }
    if (!data) {
      throw AppError.notFound(`Kütüphanede kitap bulunamadı: ${id}`);
    }
  },
};
