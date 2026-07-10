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

export const DEFAULT_STATUSES = [
  { id: "default-0", text: "Müsait", is_custom: false },
  { id: "default-1", text: "Meşgul", is_custom: false },
  { id: "default-2", text: "Toplantıda", is_custom: false },
  { id: "default-3", text: "Okulda", is_custom: false },
  { id: "default-4", text: "İşte", is_custom: false },
  { id: "default-5", text: "Uykuda", is_custom: false },
  { id: "default-6", text: "Spor yapıyor", is_custom: false },
];

/**
 * Client tarafı varsayılan mood listesi.
 * API yalnızca grup başına custom mood tutar (Group.customMoods);
 * varsayılanlar uygulamada sabittir.
 */
export const DEFAULT_MOODS = [
  { id: "mood-default-0", text: "Mutlu", emoji: "😊", mood: "happy" },
  { id: "mood-default-1", text: "Meşgul", emoji: "💻", mood: "busy" },
  { id: "mood-default-2", text: "Rahat", emoji: "😌", mood: "relaxed" },
  { id: "mood-default-3", text: "Yorgun", emoji: "🥱", mood: "tired" },
  { id: "mood-default-4", text: "Enerjik", emoji: "⚡", mood: "energetic" },
  { id: "mood-default-5", text: "Üzgün", emoji: "😔", mood: "sad" },
];
