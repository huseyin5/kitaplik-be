import { googleBooksService } from './googleBooks.service';
import { openLibraryService } from './openLibrary.service';
import { TTLCache, DEFAULT_CACHE_TTL_MS } from '../utils/cache';
import { AppError } from '../utils/AppError';
import { NormalizedBook, BookSource } from '../types/book';
import { SearchBooksQuery } from '../schemas/books.schema';

const searchCache = new TTLCache<NormalizedBook[]>(DEFAULT_CACHE_TTL_MS);
const detailCache = new TTLCache<NormalizedBook>(DEFAULT_CACHE_TTL_MS);

function searchCacheKey(params: SearchBooksQuery): string {
  return `search:${params.by ?? 'any'}:${params.limit}:${params.q.toLowerCase()}`;
}

/**
 * Arama orkestrasyonu: önce Google Books denenir; sonuç boşsa veya
 * Google bir dış servis hatası (502/429) verirse Open Library'ye düşülür.
 */
export const booksService = {
  async search(params: SearchBooksQuery): Promise<NormalizedBook[]> {
    const cacheKey = searchCacheKey(params);
    const cached = searchCache.get(cacheKey);
    if (cached) return cached;

    let results: NormalizedBook[] = [];
    let googleFailed = false;

    try {
      results = await googleBooksService.search(params);
    } catch (err) {
      // Şartname gereği "ilki başarısız/eksikse ikinciye düş":
      // Google'a ait herhangi bir dış servis hatasında (429/5xx/ağ) yedeğe
      // düşeriz. Beklenmeyen (programatik) hataları ise tekrar fırlatırız.
      const isExternalFailure =
        err instanceof AppError && err.statusCode >= 429;
      if (!isExternalFailure) {
        throw err;
      }
      googleFailed = true;
    }

    // Google sonuç bulamadıysa veya hata verdiyse Open Library'ye düş.
    if (results.length === 0) {
      try {
        results = await openLibraryService.search(params);
      } catch (err) {
        // Her iki kaynak da patladıysa anlamlı bir hata yükselt.
        if (googleFailed) {
          throw AppError.badGateway(
            'Kitap servislerine ulaşılamadı (Google Books ve Open Library)',
          );
        }
        throw err;
      }
    }

    searchCache.set(cacheKey, results);
    return results;
  },

  async getDetail(source: BookSource, id: string): Promise<NormalizedBook> {
    const cacheKey = `detail:${source}:${id}`;
    const cached = detailCache.get(cacheKey);
    if (cached) return cached;

    const book =
      source === 'google'
        ? await googleBooksService.getById(id)
        : await openLibraryService.getById(id);

    if (!book) {
      throw AppError.notFound(`Kitap bulunamadı: ${source}/${id}`);
    }

    detailCache.set(cacheKey, book);
    return book;
  },
};
