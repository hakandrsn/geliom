import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Types
import { Group as APIGroup, User as APIUser, UserStatus } from "@/api";

// Types
export type User = APIUser;

export interface Member {
  id: string; // userId
  displayName?: string | null;
  photoUrl?: string | null;
  nickname?: string;
}

export type Status = UserStatus;
export type Mood = UserStatus;

export interface Group extends APIGroup {
  members: Member[];
  statuses: Status[];
  moods: Mood[];
  owner?: User;
  type?: string;
  member_count?: number;
}

// Auth Slice
interface AuthSlice {
  user: User | null;
  firebaseUser: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthInitialized: boolean;
  hasCompletedOnboarding: boolean; // Local state
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: any | null) => void;
  setToken: (token: string | null) => void;
  setIsAuthInitialized: (initialized: boolean) => void;
  setHasCompletedOnboarding: (val: boolean) => void; // Local action
  logout: () => void;
  clearState: () => void;
}

// Group Slice
interface GroupSlice {
  currentGroupId: string | null;
  groups: Group[];
  setCurrentGroup: (groupId: string | null) => void;
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  updateGroupMembers: (groupId: string, members: Member[]) => void;
  updateGroupStatus: (groupId: string, status: Status) => void;
  updateGroupMood: (groupId: string, mood: Mood) => void;
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
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      setToken: (token) => set({ token }),
      setIsAuthInitialized: (isAuthInitialized) => set({ isAuthInitialized }),
      setHasCompletedOnboarding: (hasCompletedOnboarding) =>
        set({ hasCompletedOnboarding }),
      logout: () =>
        set({
          user: null,
          firebaseUser: null,
          token: null,
          isAuthenticated: false,
          currentGroupId: null,
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
          isLoading: false,
          error: null,
          hasCompletedOnboarding: false,
        }),

      // Group State
      currentGroupId: null,
      groups: [],
      setCurrentGroup: (groupId) => set({ currentGroupId: groupId }),
      setGroups: (groups) =>
        set((state) => ({
          groups,
          currentGroupId: state.currentGroupId || groups[0]?.id || null,
        })),
      addGroup: (group) =>
        set((state) => ({ groups: [...state.groups, group] })),
      updateGroupMembers: (groupId, members) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId ? { ...g, members } : g,
          ),
        })),
      updateGroupStatus: (groupId, status) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  statuses: [
                    ...g.statuses.filter((s) => s.userId !== status.userId),
                    status,
                  ],
                }
              : g,
          ),
        })),
      updateGroupMood: (groupId, mood) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  moods: [
                    ...g.moods.filter((m) => m.userId !== mood.userId),
                    mood,
                  ],
                }
              : g,
          ),
        })),

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
        // Authentication state is likely managed by Firebase natively,
        // but we might want to keep some metadata if needed.
      }),
    },
  ),
);
