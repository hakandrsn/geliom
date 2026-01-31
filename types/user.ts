// Geliom User Types - Supabase schema'ya uygun
// NOT: custom_user_id kaldırıldı - Supabase auth.users UUID direkt kullanılıyor

import type { User } from "./database";

// GeliomUser artık database.ts'deki User tipini kullanıyor
// Eski kullanımlar için backward compatibility
export type GeliomUser = User & {
  email?: string; // Auth'dan gelen email (users tablosunda yok)
  current_mood_id?: string; // mood_id ile aynı (string format)
  show_mood?: boolean;
  onesignal_player_id?: string;
};

export interface UserMood {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface UserStatus {
  id: string;
  user_id: string;
  status_id: string;
  created_at: string;
  status: {
    id: string;
    name: string;
    emoji: string;
    color: string;
    notifies: boolean;
    is_custom: boolean;
  };
}

// Mock Data
export const MOCK_MOODS: UserMood[] = [
  { id: "1", name: "Mutlu", emoji: "😊", color: "#4CAF50" },
  { id: "2", name: "Heyecanlı", emoji: "🤩", color: "#FF9800" },
  { id: "3", name: "Sakin", emoji: "😌", color: "#2196F3" },
  { id: "4", name: "Yorgun", emoji: "😴", color: "#9E9E9E" },
  { id: "5", name: "Enerjik", emoji: "⚡", color: "#FFEB3B" },
];

export const MOCK_STATUSES = [
  {
    id: "1",
    name: "Müsaitim",
    emoji: "✅",
    color: "#4CAF50",
    notifies: true,
    is_custom: false,
  },
  {
    id: "2",
    name: "Meşgulüm",
    emoji: "🔴",
    color: "#F44336",
    notifies: true,
    is_custom: false,
  },
  {
    id: "3",
    name: "Dışarıdayım",
    emoji: "🚶",
    color: "#2196F3",
    notifies: false,
    is_custom: false,
  },
  {
    id: "4",
    name: "Evdeyim",
    emoji: "🏠",
    color: "#795548",
    notifies: false,
    is_custom: false,
  },
  {
    id: "5",
    name: "Çalışıyorum",
    emoji: "💻",
    color: "#607D8B",
    notifies: true,
    is_custom: false,
  },
];

export const MOCK_USER: GeliomUser = {
  id: "mock-user-123",
  custom_user_id: "MOCK1234",
  email: "hakan@geliom.app",
  display_name: "Hakan Dursun",
  show_mood: true,
  current_mood_id: "1", // Mutlu
  onesignal_player_id: undefined,
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

export const MOCK_SESSION = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: {
    id: MOCK_USER.id,
    email: MOCK_USER.email,
    user_metadata: {
      full_name: MOCK_USER.display_name,
      avatar_url: null,
    },
    app_metadata: {},
    aud: "authenticated",
    created_at: MOCK_USER.created_at,
    updated_at: MOCK_USER.updated_at,
  },
};
