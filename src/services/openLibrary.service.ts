import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { sanitizeDescription } from '../utils/text';
import { NormalizedBook } from '../types/book';
import { SearchBooksQuery } from '../schemas/books.schema';

const OPEN_LIBRARY_SEARCH = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_BASE = 'https://openlibrary.org';
const COVERS_BASE = 'https://covers.openlibrary.org/b';

/** Open Library politikası gereği tanımlayıcı bir User-Agent. */
const USER_AGENT = `KitaplikBE/1.0 (${env.OPEN_LIBRARY_CONTACT})`;

interface OLSearchDoc {
  key: string; // örn. "/works/OL45804W"
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  cover_edition_key?: string;
  publisher?: string[];
  number_of_pages_median?: number;
}

interface OLSearchResponse {
  numFound: number;
  docs: OLSearchDoc[];
}

interface OLWork {
  key: string;
  title?: string;
  description?: string | { value?: string };
  covers?: number[];
}

/** "/works/OL45804W" -> "OL45804W" */
function workIdFromKey(key: string): string {
  return key.replace('/works/', '').replace(/^\/+/, '');
}

function coverFromIsbn(isbn: string | null, size: 'L' | 'M' = 'L'): string | null {
  return isbn ? `${COVERS_BASE}/isbn/${isbn}-${size}.jpg` : null;
}

function coverFromId(coverId: number | undefined, size: 'L' | 'M' = 'L'): string | null {
  return coverId ? `${COVERS_BASE}/id/${coverId}-${size}.jpg` : null;
}

function normalizeDoc(doc: OLSearchDoc): NormalizedBook {
  const isbn = doc.isbn?.[0] ?? null;
  return {
    id: workIdFromKey(doc.key),
    source: 'openlibrary',
    title: doc.title ?? 'Bilinmeyen başlık',
    authors: doc.author_name ?? [],
    isbn,
    coverUrl: coverFromId(doc.cover_i) ?? coverFromIsbn(isbn),
    publisher: doc.publisher?.[0] ?? null,
    publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
    description: null, // search.json açıklama döndürmez; detayda doldurulur
    pageCount: doc.number_of_pages_median ?? null,
  };
}

function descriptionToString(
  desc: OLWork['description'],
): string | null {
  if (!desc) return null;
  return typeof desc === 'string' ? desc : desc.value ?? null;
}

function buildSearchParams(params: SearchBooksQuery): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.by === 'title') sp.set('title', params.q);
  else if (params.by === 'author') sp.set('author', params.q);
  else sp.set('q', params.q);
  sp.set('limit', String(params.limit));
  sp.set('language', 'tur');
  sp.set(
    'fields',
    'key,title,author_name,first_publish_year,isbn,cover_i,cover_edition_key,publisher,number_of_pages_median',
  );
  return sp;
}

async function olFetch<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    });
  } catch (cause) {
    throw AppError.badGateway('Open Library API\'ye ulaşılamadı', String(cause));
  }

  if (res.status === 429) {
    throw new AppError(429, 'Open Library API rate limit aşıldı, lütfen sonra deneyin');
  }
  if (!res.ok) {
    throw AppError.badGateway(`Open Library API hatası (HTTP ${res.status})`);
  }
  return (await res.json()) as T;
}

export const openLibraryService = {
  async search(params: SearchBooksQuery): Promise<NormalizedBook[]> {
    const url = `${OPEN_LIBRARY_SEARCH}?${buildSearchParams(params).toString()}`;
    const data = await olFetch<OLSearchResponse>(url);
    return (data.docs ?? []).map(normalizeDoc);
  },

  /** Work id (örn. "OL45804W") ile detay getirir. Bulunamazsa null. */
  async getById(id: string): Promise<NormalizedBook | null> {
    const url = `${OPEN_LIBRARY_BASE}/works/${encodeURIComponent(id)}.json`;

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      });
    } catch (cause) {
      throw AppError.badGateway('Open Library API\'ye ulaşılamadı', String(cause));
    }

    if (res.status === 404) return null;
    if (!res.ok) {
      throw AppError.badGateway(`Open Library API hatası (HTTP ${res.status})`);
    }

    const work = (await res.json()) as OLWork;
    return {
      id: workIdFromKey(work.key),
      source: 'openlibrary',
      title: work.title ?? 'Bilinmeyen başlık',
      authors: [],
      isbn: null,
      coverUrl: coverFromId(work.covers?.[0]),
      publisher: null,
      publishedDate: null,
      description: sanitizeDescription(descriptionToString(work.description)),
      pageCount: null,
    };
  },
};
