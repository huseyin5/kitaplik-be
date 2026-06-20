/**
 * Dış kaynaklardan (özellikle Google Books) gelen kitap açıklamaları HTML
 * etiketleri (<p>, <br>, <b> …) ve zaman zaman markdown kalıntıları (** gibi)
 * içerir. Bunları arayüzde düz metin olarak göstermek için temizler:
 * blok etiketlerini paragraf sonuna çevirir, kalan etiketleri ve HTML
 * entity'lerini çözer, anlamsız (yalnız simge) satırları atar.
 */
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&#039;': "'",
  '&nbsp;': ' ',
};

export function sanitizeDescription(input: string | null | undefined): string | null {
  if (!input) return null;

  const text = input
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-zA-Z#0-9]+;/g, (m) => ENTITIES[m] ?? m)
    .replace(/\*\*/g, '');

  const paragraphs = text
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    // En az bir harf veya rakam içermeyen satırları (ör. "**", "-") at.
    .filter((line) => /[\p{L}\p{N}]/u.test(line));

  const result = paragraphs.join('\n\n').trim();
  return result || null;
}
