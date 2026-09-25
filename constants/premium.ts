/**
 * Plan limitleri — API'deki `common/constants/premium.constants.ts` ile
 * BİREBİR aynı tutulmalıdır. Sunucu her durumda kendi limitini uygular;
 * buradaki değerler yalnızca UI'da önceden uyarı / paywall açmak içindir.
 */
export const PLAN_LIMITS = {
  FREE: {
    MAX_MEMBERSHIPS: 1,
    MAX_GROUP_MEMBERS: 5,
    MAX_CUSTOM_MOODS: 0,
  },
  PREMIUM: {
    MAX_MEMBERSHIPS: 7,
    MAX_GROUP_MEMBERS: 20,
    MAX_CUSTOM_MOODS: 10,
  },
} as const;

export const GROUP_NAME_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 30,
} as const;

export const membershipLimit = (isPremium: boolean) =>
  isPremium ? PLAN_LIMITS.PREMIUM.MAX_MEMBERSHIPS : PLAN_LIMITS.FREE.MAX_MEMBERSHIPS;

export const groupCapacity = (ownerIsPremium: boolean) =>
  ownerIsPremium ? PLAN_LIMITS.PREMIUM.MAX_GROUP_MEMBERS : PLAN_LIMITS.FREE.MAX_GROUP_MEMBERS;

/** API'nin 409 cevaplarındaki makine kodu (PremiumLimitException). */
export type PremiumLimitCode =
  | "MEMBERSHIP_LIMIT"
  | "REQUESTER_MEMBERSHIP_LIMIT"
  | "GROUP_CAPACITY"
  | "CUSTOM_MOOD_PREMIUM"
  | "CUSTOM_MOOD_LIMIT"
  | "OPTIONS_PREMIUM"
  | "OPTIONS_LIMIT"
  | "GROUP_PAUSED";
