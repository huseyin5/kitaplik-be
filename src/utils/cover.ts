/**
 * Kitap kapağı görsel URL'leri için yardımcılar.
 *
 * Open Library'nin kapak CDN'i (covers.openlibrary.org) ISBN veya kendi kapak
 * id'si ile doğrudan bir JPEG döndürür. Bu CDN, Google Books'un içerik uçlarına
 * (books.google.com/books/content) kıyasla tarayıcıda çok daha güvenilir
 * yüklenir; Google ucu sık sık görsel döndürmez veya hotlink'te 403 verir.
 *
 * Strateji: Sağlayıcının kendi görseli varsa (gerçek bir kapaktır) onu
 * kullanırız; yoksa elimizdeki ISBN üzerinden güvenilir Open Library kapak
 * CDN'ine düşeriz.
 */

const OPEN_LIBRARY_COVERS_BASE = 'https://covers.openlibrary.org/b';

export type CoverSize = 'S' | 'M' | 'L';

/** ISBN'den Open Library kapak URL'si üretir. ISBN yoksa null. */
export function coverUrlFromIsbn(
  isbn: string | null | undefined,
  size: CoverSize = 'L',
): string | null {
  if (!isbn) return null;
  const clean = isbn.replace(/[^0-9Xx]/g, '');
  return clean
    ? `${OPEN_LIBRARY_COVERS_BASE}/isbn/${clean}-${size}.jpg`
    : null;
}

/** Open Library kapak id'sinden URL üretir. Id yoksa null. */
export function coverUrlFromOlId(
  coverId: number | null | undefined,
  size: CoverSize = 'L',
): string | null {
  return coverId ? `${OPEN_LIBRARY_COVERS_BASE}/id/${coverId}-${size}.jpg` : null;
}

/**
 * Bir kitap için en güvenilir kapak URL'sini seçer:
 * 1) Sağlayıcının kendi görseli (varsa gerçek kapaktır),
 * 2) yoksa ISBN üzerinden Open Library kapak CDN'i,
 * 3) ikisi de yoksa null.
 */
export function resolveCoverUrl(
  providerCover: string | null | undefined,
  isbn: string | null | undefined,
): string | null {
  return providerCover ?? coverUrlFromIsbn(isbn);
}
