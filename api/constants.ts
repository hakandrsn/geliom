export const apiUtils = {
  // Generate unique invite code
  generateInviteCode: () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

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

  // Check if subscription is active
  isSubscriptionActive: (subscription: {
    status: string;
    expires_at?: string | null;
  }) => {
    if (subscription.status !== "active") return false;

    if (subscription.expires_at) {
      const expiresAt = new Date(subscription.expires_at);
      const now = new Date();
      return expiresAt > now;
    }

    return true; // expires_at null ise sınırsız abonelik
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
