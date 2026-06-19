import { env } from '../config/env';
import { AppError } from '../utils/AppError';
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
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
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

/** En büyük mevcut kapak görselini seçer, http -> https'e çevirir. */
function extractCover(info: GoogleVolumeInfo): string | null {
  const links = info.imageLinks;
  if (!links) return null;
  const best =
    links.extraLarge ??
    links.large ??
    links.medium ??
    links.small ??
    links.thumbnail ??
    links.smallThumbnail ??
    null;
  return best ? best.replace(/^http:/, 'https:') : null;
}

function normalizeVolume(volume: GoogleVolume): NormalizedBook {
  const info = volume.volumeInfo ?? {};
  return {
    id: volume.id,
    source: 'google',
    title: info.title ?? 'Bilinmeyen başlık',
    authors: info.authors ?? [],
    isbn: extractIsbn(info),
    coverUrl: extractCover(info),
    publisher: info.publisher ?? null,
    publishedDate: info.publishedDate ?? null,
    description: info.description ?? null,
    pageCount: info.pageCount ?? null,
  };
}

/** Arama tipini Google operatörüne çevirir (intitle: / inauthor:). */
function buildQuery(q: string, by?: SearchBooksQuery['by']): string {
  if (by === 'title') return `intitle:${q}`;
  if (by === 'author') return `inauthor:${q}`;
  return q;
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
    url.searchParams.set('q', buildQuery(params.q, params.by));
    url.searchParams.set('langRestrict', 'tr');
    url.searchParams.set('country', 'TR');
    url.searchParams.set('maxResults', String(params.limit));

    const data = await fetchGoogle<GoogleBooksResponse>(url.toString());
    return (data.items ?? []).map(normalizeVolume);
  },

  /** Tekil kitap detayını getirir. Bulunamazsa null döner. */
  async getById(id: string): Promise<NormalizedBook | null> {
    const url = withKey(new URL(`${GOOGLE_BOOKS_BASE}/${encodeURIComponent(id)}`));
    url.searchParams.set('country', 'TR');

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
