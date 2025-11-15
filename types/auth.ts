
/**
 * Auth Provider Types
 * Apple ve Google OAuth provider'larından gelen farklı formatları normalize eder
 */

export type AuthProvider = 'apple' | 'google';

/**
 * Normalized User Data
 * Apple ve Google'dan gelen farklı formatları tek bir formata çevirir
 * custom_user_id YOK - Supabase auth.users UUID direkt kullanılır
 */
export interface NormalizedUserData {
  id: string; // UUID - Supabase auth.users'dan
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  provider: AuthProvider;
}

/**
 * Supabase User objesinden normalized data çıkarma için helper type
 */
export interface SupabaseUserMetadata {
  full_name?: string;
  name?: string;
  avatar_url?: string;
  picture?: string;
  email?: string;
}

/**
 * Auth Error Types
 */
export type AuthErrorCode =
  | 'NETWORK_ERROR'
  | 'CANCELLED'
  | 'INVALID_TOKEN'
  | 'PROVIDER_ERROR'
  | 'UNKNOWN_ERROR';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  originalError?: unknown;
}

