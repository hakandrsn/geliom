export const apiUtils = {
  // Format date for display
  formatEventDate: (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },
};

/**
 * Sunucudaki varsayılanların aynası (api/src/common/group-options.ts).
 * Asıl liste grubun `statusOptions` / `moodOptions` alanlarıdır; bunlar
 * yalnızca session gelmeden önce ve eski kayıtları çözümlemek için kullanılır.
 */
export const DEFAULT_STATUSES = [
  { id: "default-0", text: "Müsait", emoji: "🟢", isDefault: true },
  { id: "default-1", text: "Meşgul", emoji: "⛔", isDefault: true },
  { id: "default-4", text: "İşte", emoji: "💼", isDefault: true },
  { id: "default-3", text: "Okulda", emoji: "📚", isDefault: true },
  { id: "default-2", text: "Toplantıda", emoji: "🗓️", isDefault: true },
  { id: "default-7", text: "Yolda", emoji: "🚗", isDefault: true },
  { id: "default-6", text: "Spor yapıyor", emoji: "🏃", isDefault: true },
  { id: "default-5", text: "Uykuda", emoji: "😴", isDefault: true },
];

export const DEFAULT_MOODS = [
  { id: "mood-default-0", key: "happy", text: "Mutlu", emoji: "😊", isDefault: true },
  { id: "mood-default-2", key: "relaxed", text: "Rahat", emoji: "😌", isDefault: true },
  { id: "mood-default-4", key: "energetic", text: "Enerjik", emoji: "⚡", isDefault: true },
  { id: "mood-default-6", key: "excited", text: "Heyecanlı", emoji: "🤩", isDefault: true },
  { id: "mood-default-3", key: "tired", text: "Yorgun", emoji: "🥱", isDefault: true },
  { id: "mood-default-7", key: "stressed", text: "Stresli", emoji: "😣", isDefault: true },
  { id: "mood-default-5", key: "sad", text: "Üzgün", emoji: "😔", isDefault: true },
  { id: "mood-default-8", key: "bored", text: "Sıkkın", emoji: "😐", isDefault: true },
];

/**
 * Artık seçilemeyen ama eski kayıtlarda bulunabilen mood'lar — yalnızca
 * görüntüleme çözümlemesinde kullanılır ("Meşgul" bir duygu değil, durumdu).
 */
export const LEGACY_MOODS = [
  { id: "mood-legacy-busy", key: "busy", text: "Meşgul", emoji: "💻", isDefault: true },
];
