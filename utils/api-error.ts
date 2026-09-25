import type { PremiumLimitCode } from "@/constants/premium";

/** Axios hatasından sunucunun Türkçe mesajını çıkarır (dizi ise ilki). */
export function getApiErrorMessage(error: any, fallback: string): string {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message[0] ?? fallback;
  if (typeof message === "string" && message) return message;
  return fallback;
}

/** 409 premium/limit cevabının kodu; yoksa undefined. */
export function getPremiumLimitCode(error: any): PremiumLimitCode | undefined {
  if (error?.response?.status !== 409) return undefined;
  return error?.response?.data?.code;
}
