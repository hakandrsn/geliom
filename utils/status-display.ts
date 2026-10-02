/**
 * Status ve mood metnini tek satırda birleştirir.
 * İkisi de varsa "Status / Mood", tek varsa o gösterilir, hiçbiri yoksa undefined.
 * Aynı metinse (mood seçilince text mood adından kopyalanmış olabilir) tek yazılır.
 */
export function formatStatusMood(
  statusText?: string,
  moodText?: string,
): string | undefined {
  const status = statusText?.trim();
  const mood = moodText?.trim();

  if (status && mood) {
    const same =
      status.toLocaleLowerCase("tr-TR") === mood.toLocaleLowerCase("tr-TR");
    return same ? status : `${status} / ${mood}`;
  }

  return status || mood || undefined;
}

/**
 * ISO tarihi kısa, Türkçe göreli zamana çevirir: "az önce", "5 dk önce",
 * "2 sa önce", "dün", "3 gün önce". Bir haftadan eskiyse kısa tarih.
 */
export function formatRelativeTime(iso?: string | null, now = Date.now()): string | undefined {
  if (!iso) return undefined;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return undefined;

  const diffSec = Math.max(0, Math.floor((now - ts) / 1000));
  if (diffSec < 60) return "az önce";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} sa önce`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "dün";
  if (diffDay < 7) return `${diffDay} gün önce`;
  return new Date(ts).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

/**
 * Ham anahtarı okunur metne çevirir: "kahve_molasi" → "Kahve molasi".
 * Mood tanımı bulunamadığında (silinmiş custom mood vb.) key'in olduğu gibi
 * ekrana düşmesini engeller.
 */
export function humanizeKey(key?: string | null): string | undefined {
  if (!key) return undefined;
  // Özel ruh hali key'leri "<slug>_<id son 4>" biçimindedir ("heyecan_7b31");
  // id parçası ve metinden üretilemeyen "mood" slug'ı asla ekrana düşmez
  const base = key.replace(/_[0-9a-f]{4}$/, "");
  if (!base || base === "mood") return undefined;
  const spaced = base.replace(/[_-]+/g, " ").trim();
  if (!spaced) return undefined;
  return spaced.charAt(0).toLocaleUpperCase("tr-TR") + spaced.slice(1);
}
