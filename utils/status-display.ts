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
