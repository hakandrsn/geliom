import { useMutation } from "@tanstack/react-query";
import { apiClient } from "./client";

export type SupportCategory = "bug" | "suggestion" | "account" | "premium" | "other";

export const SUPPORT_CATEGORIES: {
  key: SupportCategory;
  label: string;
  icon: "bug-outline" | "bulb-outline" | "person-outline" | "diamond-outline" | "chatbubble-outline";
}[] = [
  { key: "bug", label: "Hata", icon: "bug-outline" },
  { key: "suggestion", label: "Öneri", icon: "bulb-outline" },
  { key: "account", label: "Hesap", icon: "person-outline" },
  { key: "premium", label: "Premium", icon: "diamond-outline" },
  { key: "other", label: "Diğer", icon: "chatbubble-outline" },
];

/** POST /support/messages — Firestore'a yazılır; rate limit saatte 5. */
export const useSendSupportMessage = () =>
  useMutation({
    mutationFn: async (data: {
      category: SupportCategory;
      message: string;
      appInfo?: string;
    }): Promise<{ id: string; createdAt: string }> => {
      const response = await apiClient.post("/support/messages", data);
      return response.data;
    },
  });
