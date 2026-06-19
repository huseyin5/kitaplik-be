-- library_books tablosu
-- Kullanıcının kütüphanesine eklediği kitapları tutar.
-- user_id şimdilik nullable; auth eklenince auth.users(id)'e bağlanacak.

create extension if not exists "pgcrypto";

-- Okuma durumu için enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'reading_status') then
    create type reading_status as enum ('okunacak', 'okunuyor', 'okundu');
  end if;
end$$;

create table if not exists public.library_books (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade,
  title          text not null,
  authors        text[] not null default '{}',
  isbn           text,
  cover_url      text,
  publisher      text,
  published_date text,
  description    text,
  page_count     integer,
  source         text not null check (source in ('google', 'openlibrary')),
  status         reading_status not null default 'okunacak',
  created_at     timestamptz not null default now()
);

-- Sık kullanılan filtreler için indeksler
create index if not exists library_books_user_id_idx on public.library_books (user_id);
create index if not exists library_books_status_idx on public.library_books (status);
create index if not exists library_books_created_at_idx on public.library_books (created_at desc);

-- RLS (Row Level Security)
-- Backend service role key kullandığı için RLS'i bypass eder; yine de
-- ileride frontend'in anon key ile doğrudan erişimi olursa diye açıyoruz.
alter table public.library_books enable row level security;

-- Auth eklendiğinde aktif edilecek örnek politika (şimdilik yorumda):
-- create policy "Kullanıcı kendi kitaplarını görür"
--   on public.library_books for select
--   using (auth.uid() = user_id);
-- create policy "Kullanıcı kendi kitabını ekler"
--   on public.library_books for insert
--   with check (auth.uid() = user_id);
-- create policy "Kullanıcı kendi kitabını günceller"
--   on public.library_books for update
--   using (auth.uid() = user_id);
-- create policy "Kullanıcı kendi kitabını siler"
--   on public.library_books for delete
--   using (auth.uid() = user_id);
