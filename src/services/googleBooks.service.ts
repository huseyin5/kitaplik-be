import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { sanitizeDescription } from '../utils/text';
import { NormalizedBook } from '../types/book';
import { SearchBooksQuery } from '../schemas/books.schema';

const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1/volumes';

/** Google Books API'nin döndürdüğü ilgili alanların (kısmi) tipi. */
interface GoogleVolumeInfo {
  title?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  industryIdentifiers?: Array<{ type: string; identifier: string }>;
}

interface GoogleVolume {
  id: string;
  volumeInfo?: GoogleVolumeInfo;
}

interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleVolume[];
}

/** ISBN_13'ü ISBN_10'a tercih ederek seçer. */
function extractIsbn(info: GoogleVolumeInfo): string | null {
  const ids = info.industryIdentifiers ?? [];
  const isbn13 = ids.find((i) => i.type === 'ISBN_13');
  const isbn10 = ids.find((i) => i.type === 'ISBN_10');
  return isbn13?.identifier ?? isbn10?.identifier ?? null;
}

function normalizeVolume(volume: GoogleVolume): NormalizedBook {
  const info = volume.volumeInfo ?? {};
  return {
    id: volume.id,
    source: 'google',
    title: info.title ?? 'Bilinmeyen başlık',
    authors: info.authors ?? [],
    isbn: extractIsbn(info),
    publisher: info.publisher ?? null,
    publishedDate: info.publishedDate ?? null,
    description: sanitizeDescription(info.description),
    pageCount: info.pageCount ?? null,
  };
}

async function fetchGoogle<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (cause) {
    throw AppError.badGateway('Google Books API\'ye ulaşılamadı', String(cause));
  }

  if (res.status === 429) {
    throw new AppError(429, 'Google Books API rate limit aşıldı, lütfen sonra deneyin');
  }
  if (!res.ok) {
    throw AppError.badGateway(
      `Google Books API hatası (HTTP ${res.status})`,
    );
  }
  return (await res.json()) as T;
}

function withKey(url: URL): URL {
  if (env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set('key', env.GOOGLE_BOOKS_API_KEY);
  }
  return url;
}

export const googleBooksService = {
  /** Kitap araması yapar; normalize edilmiş liste döner (boş olabilir). */
  async search(params: SearchBooksQuery): Promise<NormalizedBook[]> {
    const url = withKey(new URL(GOOGLE_BOOKS_BASE));
    url.searchParams.set('q', params.q);
    // Dil kısıtlaması yok: tüm dillerdeki kitaplar bulunabilsin (daha fazla sonuç).
    url.searchParams.set('maxResults', String(params.limit));

    const data = await fetchGoogle<GoogleBooksResponse>(url.toString());
    return (data.items ?? []).map(normalizeVolume);
  },

  /** Tekil kitap detayını getirir. Bulunamazsa null döner. */
  async getById(id: string): Promise<NormalizedBook | null> {
    const url = withKey(new URL(`${GOOGLE_BOOKS_BASE}/${encodeURIComponent(id)}`));

    let res: Response;
    try {
      res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    } catch (cause) {
      throw AppError.badGateway('Google Books API\'ye ulaşılamadı', String(cause));
    }

    if (res.status === 404) return null;
    if (res.status === 429) {
      throw new AppError(429, 'Google Books API rate limit aşıldı, lütfen sonra deneyin');
    }
    if (!res.ok) {
      throw AppError.badGateway(`Google Books API hatası (HTTP ${res.status})`);
    }

    const volume = (await res.json()) as GoogleVolume;
    return normalizeVolume(volume);
  },
};
