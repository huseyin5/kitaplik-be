# Kitaplık Backend

Kişisel "sanal kitap kütüphanesi" backend'i. Kullanıcı kitap adı/yazar ile arama yapar, kitap detaylarını görür ve kendi koleksiyonuna ekler. Arama için **Google Books** (birincil) ve **Open Library** (yedek) API'leri kullanılır; koleksiyon **Supabase (Postgres)** üzerinde tutulur.

## Tech Stack

- **Runtime:** Node.js 18+ (native `fetch` için)
- **Framework:** Express + TypeScript
- **DB:** Supabase (Postgres) — `@supabase/supabase-js`, service role key (backend-only)
- **Validasyon:** Zod + reusable `validate()` middleware
- **Env:** dotenv (Zod ile doğrulanır)

## Klasör Yapısı

```
src/
  config/        env doğrulama, supabase client
  routes/        express router tanımları
  controllers/   route handler'lar
  services/      dış API çağrıları + DB işlemleri
  schemas/       Zod şemaları (request validasyonu)
  middlewares/   validate, errorHandler, authenticate (placeholder)
  types/         paylaşılan tipler + Express Request genişletmesi
  utils/         AppError, TTL cache
  app.ts         express kurulumu
  server.ts      entry point
supabase/
  migrations/    SQL şema
```

## Kurulum

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Ortam değişkenlerini ayarla

`.env.example` dosyasını `.env` olarak kopyalayıp doldur:

```bash
cp .env.example .env
```

| Değişken | Açıklama |
| --- | --- |
| `PORT` | Sunucu portu (varsayılan 3000) |
| `NODE_ENV` | `development` / `production` |
| `CORS_ORIGIN` | İzin verilen origin(ler), virgülle ayrılmış veya `*` |
| `SUPABASE_URL` | Supabase proje URL'i |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **asla frontend'e sızdırma** |
| `GOOGLE_BOOKS_API_KEY` | Google Books API anahtarı (opsiyonel ama önerilir) |
| `OPEN_LIBRARY_CONTACT` | Open Library User-Agent için iletişim e-postası |

### 3. Veritabanı şemasını uygula

`supabase/migrations/0001_library_books.sql` içeriğini Supabase SQL Editor'de çalıştır (veya Supabase CLI ile migrate et).

### 4. Geliştirme sunucusunu başlat

```bash
npm run dev
```

Sunucu `http://localhost:3000` adresinde çalışır. Sağlık kontrolü: `GET /health`.

## Scriptler

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Hot-reload ile geliştirme (tsx watch) |
| `npm run build` | TypeScript'i `dist/`'e derler |
| `npm start` | Derlenmiş sunucuyu çalıştırır |
| `npm run typecheck` | Tip kontrolü (derleme yok) |

## API

Tüm endpoint'ler `/api` altında.

### Kitap Arama

#### `GET /api/books/search`

| Query | Tip | Açıklama |
| --- | --- | --- |
| `q` | string (zorunlu) | Arama terimi |
| `by` | `title` \| `author` | Başlık/yazar bazlı arama (opsiyonel) |
| `limit` | number (1–40, vars. 20) | Sonuç sayısı |

Google Books'ta arar, sonuç yoksa Open Library'ye düşer. Normalize edilmiş liste döner:

```json
{
  "count": 1,
  "results": [
    {
      "id": "abc123",
      "source": "google",
      "title": "Tutunamayanlar",
      "authors": ["Oğuz Atay"],
      "isbn": "9789754700114",
      "coverUrl": "https://...",
      "publisher": "İletişim Yayınları",
      "publishedDate": "1972",
      "description": "...",
      "pageCount": 724
    }
  ]
}
```

#### `GET /api/books/:source/:id`

`source`: `google` | `openlibrary`. Tekil kitap detayını (büyük kapak dahil) döner. Bulunamazsa `404`.

### Kütüphane (CRUD)

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| `POST` | `/api/library` | Kitap ekler (gövde: normalize kitap + `status`) |
| `GET` | `/api/library?status=` | Listeler (status filtresi opsiyonel) |
| `PATCH` | `/api/library/:id` | Okuma durumunu günceller (`{ "status": "okunuyor" }`) |
| `DELETE` | `/api/library/:id` | Kütüphaneden siler |

`status` değerleri: `okunacak`, `okunuyor`, `okundu`.

`POST /api/library` örnek gövde:

```json
{
  "title": "Tutunamayanlar",
  "authors": ["Oğuz Atay"],
  "isbn": "9789754700114",
  "coverUrl": "https://...",
  "publisher": "İletişim Yayınları",
  "publishedDate": "1972",
  "description": "...",
  "pageCount": 724,
  "source": "google",
  "status": "okunacak"
}
```

## Hata Yönetimi

Tüm hatalar `{ "error": "...", "details"?: ... }` formatında döner:

- `400` — geçersiz istek / validasyon hatası (Zod)
- `404` — kitap/kaynak bulunamadı
- `429` — dış API rate limit
- `502` — dış API'ye ulaşılamadı / dış servis hatası
- `500` — beklenmeyen hata

## Auth'a Hazırlık (henüz aktif değil)

- `src/middlewares/authenticate.ts` — Supabase Auth JWT doğrulaması için placeholder. Şu an hiçbir route'a bağlı değil.
- `src/types/express/index.d.ts` — `req.user` alanı için Express Request genişletmesi.
- `library_books.user_id` — şimdilik nullable; auth eklenince `req.user.id` ile doldurulacak ve RLS politikaları aktive edilecek (migration'da yorum olarak hazır).
