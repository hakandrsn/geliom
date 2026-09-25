/**
 * Ana ekrandaki seçici başlıkları. Her açılışta rastgele biri seçilir ki
 * ekran form gibi değil, soran bir arkadaş gibi hissettirsin.
 */
export const STATUS_PROMPTS = [
  "Şu anda ne yapıyorsun?",
  "Neredesin, ne âlemdesin?",
  "Bugün program ne?",
  "Şu an neyle meşgulsün?",
  "Günün nasıl geçiyor?",
  "Ne var ne yok?",
  "Bugün seni nerede bulabiliriz?",
  "Ne yapıyorsun bakalım?",
  "Anlat, şu an ne oluyor?",
  "Şu an hayat nasıl akıyor?",
] as const;

export const MOOD_PROMPTS = [
  "Şu an nasıl hissediyorsun?",
  "İçinden ne geçiyor?",
  "Modun nasıl bugün?",
  "Kendini nasıl hissediyorsun?",
  "Bugün hangi haldesin?",
  "Enerjin nasıl?",
  "Keyfin yerinde mi?",
  "Ruh halin ne diyor?",
  "Bugün nasılsın, gerçekten?",
  "Bir kelimeyle: nasılsın?",
] as const;

export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
