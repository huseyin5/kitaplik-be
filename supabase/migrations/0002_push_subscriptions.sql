-- push_subscriptions tablosu
-- Web push (tarayıcı/PWA) aboneliklerini tutar. Auth yok; abonelikler
-- endpoint'e göre tekildir.

create extension if not exists "pgcrypto";

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
-- Backend service role key kullandığı için RLS'i bypass eder.
