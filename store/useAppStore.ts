import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Types
import {
  Group,
  GroupSummary,
  SessionState,
  SessionUpdatePayload,
  StatusEntry,
  User as APIUser,
} from "@/api/types";

export type User = APIUser;

/** Aktif socket session'ı — grup ekranı açıkken tek kaynak. */
export interface ActiveSession {
  group: Group;
  version: number;
  onlineUserIds: string[];
}

// ==========================================
// Patch helpers (mobile_api_doc.md §4.4)
// Objeler derin birleştirilir, diziler olduğu gibi değiştirilir.
// ==========================================

const isPlainObject = (v: unknown): v is Record<string, any> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const deepMerge = <T>(target: T, patch: any): T => {
  if (!isPlainObject(target) || !isPlainObject(patch)) return patch as T;
  const result: Record<string, any> = { ...target };
  for (const key of Object.keys(patch)) {
    const patchValue = patch[key];
    if (isPlainObject(patchValue) && isPlainObject(result[key])) {
      result[key] = deepMerge(result[key], patchValue);
    } else {
      result[key] = patchValue;
    }
  }
  return result as T;
};

const removePaths = <T>(target: T, paths: string[]): T => {
  let result: any = target;
  for (const path of paths) {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    // Path boyunca kopyalayarak in: son objeden key'i sil
    const clone = (obj: any, depth: number): any => {
      if (depth === keys.length) {
        if (!isPlainObject(obj)) return obj;
        const { [lastKey]: _removed, ...rest } = obj;
        return rest;
      }
      const key = keys[depth];
      if (!isPlainObject(obj) || !(key in obj)) return obj;
      return { ...obj, [key]: clone(obj[key], depth + 1) };
    };
    result = clone(result, 0);
  }
  return result;
};

// Auth Slice
interface AuthSlice {
  user: User | null;
  firebaseUser: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthInitialized: boolean;
  /**
   * Yalnızca cihazda (AsyncStorage) tutulur — backend'de karşılığı yok.
   * Yeniden kurulumda veya başka cihazda onboarding tekrar gösterilir.
   */
  hasCompletedOnboarding: boolean;
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: any | null) => void;
  setToken: (token: string | null) => void;
  setIsAuthInitialized: (initialized: boolean) => void;
  setHasCompletedOnboarding: (val: boolean) => void; // Local action
  setPremium: (isPremium: boolean) => void;
  logout: () => void;
  clearState: () => void;
}

// Group Slice
interface GroupSlice {
  currentGroupId: string | null;
  /** GET /users/me/groups sonucu — liste ekranı için özet. */
  groups: GroupSummary[];
  /** Aktif socket session'ı (tam grup verisi buradan okunur). */
  session: ActiveSession | null;
  setCurrentGroup: (groupId: string | null) => void;
  setGroups: (groups: GroupSummary[]) => void;
  addGroup: (group: GroupSummary) => void;
  setSession: (state: SessionState) => void;
  clearSession: () => void;
  /**
   * session:update patch'ini uygular.
   * Version atlandıysa false döner — caller session:open'ı tekrar göndermelidir.
   */
  applySessionUpdate: (update: SessionUpdatePayload) => boolean;
  setPresence: (userId: string, online: boolean) => void;
  /** status:update ack'i sonrası kendi statümüzü optimistic işle. */
  setOwnStatus: (userId: string, status: StatusEntry) => void;
  /** status:clear ack'i sonrası kendi statümüzü kaldır. */
  clearOwnStatus: (userId: string) => void;
}

// UI Slice
interface UISlice {
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Subscription Slice
interface SubscriptionSlice {
  isSubscribed: boolean;
  setSubscribed: (isSubscribed: boolean) => void;
}

// Combined Store Type
type AppStore = AuthSlice & GroupSlice & UISlice & SubscriptionSlice;

// Create Store with Persistence
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Auth State
      user: null,
      firebaseUser: null,
      token: null,
      isAuthenticated: false,
      isAuthInitialized: false,
      hasCompletedOnboarding: false, // Default to false
      // Premium'un tek doğruluk kaynağı backend'deki user.isPremium'dur
      // (Adapty webhook ile güncellenir, premium:update ile canlı gelir).
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isSubscribed: user ? !!user.isPremium : false,
        }),
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      setToken: (token) => set({ token }),
      setIsAuthInitialized: (isAuthInitialized) => set({ isAuthInitialized }),
      setHasCompletedOnboarding: (hasCompletedOnboarding) =>
        set({ hasCompletedOnboarding }),
      setPremium: (isPremium) =>
        set((state) => ({
          isSubscribed: isPremium,
          user: state.user ? { ...state.user, isPremium } : state.user,
        })),
      logout: () =>
        set({
          user: null,
          firebaseUser: null,
          token: null,
          isAuthenticated: false,
          currentGroupId: null,
          session: null,
          isSubscribed: false,
        }),
      clearState: () =>
        set({
          user: null,
          firebaseUser: null,
          token: null,
          isAuthenticated: false,
          currentGroupId: null,
          isSubscribed: false,
          groups: [],
          session: null,
          isLoading: false,
          error: null,
          hasCompletedOnboarding: false,
        }),

      // Group State
      currentGroupId: null,
      groups: [],
      session: null,
      setCurrentGroup: (groupId) => set({ currentGroupId: groupId }),
      setGroups: (groups) =>
        set((state) => {
          // Persist edilen/mevcut seçim hâlâ listedeyse koru, değilse ilk gruba düş
          const stillMember = groups.some((g) => g.id === state.currentGroupId);
          return {
            groups,
            currentGroupId: stillMember
              ? state.currentGroupId
              : (groups[0]?.id ?? null),
          };
        }),
      addGroup: (group) =>
        set((state) => ({
          groups: [...state.groups.filter((g) => g.id !== group.id), group],
          currentGroupId: group.id,
        })),
      setSession: ({ group, version, onlineUserIds }) =>
        set({ session: { group, version, onlineUserIds } }),
      clearSession: () => set({ session: null }),
      applySessionUpdate: ({ version, patch, removed }) => {
        const session = get().session;
        if (!session) return false;
        // Güncelleme kaçırıldıysa tam state yeniden alınmalı
        if (version !== session.version + 1) return false;

        let group = session.group;
        if (patch) group = deepMerge(group, patch);
        if (removed?.length) group = removePaths(group, removed);
        group = { ...group, version };

        set({ session: { ...session, group, version } });
        return true;
      },
      setPresence: (userId, online) =>
        set((state) => {
          if (!state.session) return state;
          const current = state.session.onlineUserIds;
          const next = online
            ? current.includes(userId)
              ? current
              : [...current, userId]
            : current.filter((id) => id !== userId);
          return { session: { ...state.session, onlineUserIds: next } };
        }),
      setOwnStatus: (userId, status) =>
        set((state) => {
          if (!state.session) return state;
          return {
            session: {
              ...state.session,
              group: {
                ...state.session.group,
                statuses: {
                  ...state.session.group.statuses,
                  [userId]: status,
                },
              },
            },
          };
        }),

      clearOwnStatus: (userId) =>
        set((state) => {
          if (!state.session) return state;
          const { [userId]: _removed, ...rest } = state.session.group.statuses;
          return {
            session: {
              ...state.session,
              group: { ...state.session.group, statuses: rest },
            },
          };
        }),

      // UI State
      isLoading: false,
      error: null,
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Subscription State
      isSubscribed: false,
      setSubscribed: (isSubscribed) => set({ isSubscribed }),
    }),
    {
      name: "geliom-app-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist specific keys to avoid bloat and stale data
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        // Yeniden açılışta aynı grup seçili kalsın (liste gelince doğrulanır)
        currentGroupId: state.currentGroupId,
        // Authentication state is likely managed by Firebase natively,
        // but we might want to keep some metadata if needed.
      }),
    },
  ),
);
