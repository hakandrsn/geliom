/**
 * Theme Interface
 * Light ve Dark mod arasında tutarlılığı garanti eder.
 */
export interface ThemeColors {
  // Ana Marka Renkleri
  primary: string;
  secondary: string;
  tertiary: string;

  // Component Durumları (GeliomButton vb. için)
  activeState: string; // Active State
  passiveState: string;   // Passive State
  loadingState: string;   // Loading State

  // Gradyanlar
  linearGradient: string[];

  // Premium — altın/amber vurgu. premiumGradient üstünde metin beyaz.
  premium: string;
  /** Premium vurgulu yüzeylerin soluk zemini (opak) */
  premiumTint: string;
  premiumGradient: string[];

  // Tipografi
  text: string;
  secondaryText: string;
  lightText: string;

  // Arkaplanlar
  background: string;
  secondaryBackground: string;
  cardBackground: string;
  /** Bottom sheet / modal yüzeyi — HER ZAMAN opak olmalı (rgba katmanlar sheet'te görünmez kalır) */
  sheetBackground: string;

  // Durum Renkleri
  success: string;
  warning: string;
  error: string;
  info: string;

  // Nötr Renkler
  black: string;
  white: string;
  gray: string;
  lightGray: string;

  // Etkileşim Elemanları
  disabled: string;
  stroke: string;
  passiveButton: string;

  // Katmanlar
  overlay: string;
  blurBackground: string;

  /**
   * Baş harf avatarları için palete uyumlu zeminler. Kullanıcı birini seçer
   * ("tint:3") ya da isim hash'i ile otomatik atanır. Üzerindeki metin her
   * iki temada da beyazdır — tonlar buna göre doygun tutulur.
   */
  avatarTints: string[];
}

/**
 * Light Theme — Geliom (Terracotta & Şeftali)
 * Marka: #D9622B (terracotta) + #F8D5BC (şeftali). Zemin krem, metin sıcak kahve.
 */
export const lightColors: ThemeColors = {
  // Marka
  primary: '#D9622B',        // Terracotta
  secondary: '#F8D5BC',      // Şeftali (soft accent)
  tertiary: '#F0946A',       // Açık mercan

  // Component Durumları
  activeState: '#B94E1F',                 // Koyu terracotta (Aktif/Güçlü)
  passiveState: 'rgba(217, 98, 43, 0.10)', // Terracotta @ 10% (Pasif/Hafif)
  loadingState: '#E8783F',                // Canlı turuncu (Yükleniyor)

  linearGradient: ['#D9622B', '#F09A5A'], // Terracotta'dan kayısıya
  premium: '#B8730F',
  premiumTint: '#FBEBCD',
  premiumGradient: ['#A8610A', '#D98A2B'], // Koyu amberden altına — beyaz metin okunur

  // Tipografi — sıcak kahve tonları
  text: '#2A1F1A',
  secondaryText: '#6B5A50',
  lightText: '#A6968C',

  // Arkaplanlar — krem zemin, rgba kart katmanları
  background: '#FBF6F1',
  secondaryBackground: 'rgba(217, 98, 43, 0.05)',
  cardBackground: 'rgba(255, 255, 255, 0.92)',
  sheetBackground: '#FFFFFF',

  // Durumlar
  success: '#5FA86A',
  warning: '#E0A428',
  error: '#D64545',
  info: '#3E8FD0',

  // Nötrler
  black: '#1B1411',
  white: '#FFFFFF',
  gray: '#8A7A70',
  lightGray: '#EBE1D9',

  // Etkileşim
  disabled: '#DACFC6',
  stroke: 'rgba(74, 44, 28, 0.10)',
  passiveButton: 'rgba(74, 44, 28, 0.3)',

  // Katmanlar
  overlay: 'rgba(30, 20, 15, 0.55)',
  blurBackground: 'rgba(255, 252, 248, 0.85)',

  // Avatar tonları — terracotta, kayısı, hardal, zeytin, adaçayı, deniz, erik, gül
  avatarTints: [
    '#D9622B',
    '#E5893F',
    '#B8912A',
    '#7E9A4A',
    '#5F9A7C',
    '#3E8F92',
    '#9A5B8C',
    '#C95A6B',
  ],
};

/**
 * Dark Theme — Sıcak Gece (kahve-gri zemin, yumuşak rgba katmanlar)
 * Simsiyah değil; hafif sıcak, göz yormayan bir karanlık.
 */
export const darkColors: ThemeColors = {
  // Marka — karanlıkta görünürlük için açık tonlar
  primary: '#F08A55',
  secondary: '#F8D5BC',
  tertiary: '#F5A97E',

  // Component Durumları
  activeState: '#D9622B',
  passiveState: 'rgba(240, 138, 85, 0.16)',
  loadingState: '#E8783F',

  linearGradient: ['#D9622B', '#F08A55'],
  premium: '#F2B84B',
  premiumTint: '#3A2C17',
  premiumGradient: ['#8F520A', '#C7802A'],

  // Tipografi
  text: '#F6EEE8',
  secondaryText: '#CDBFB5',
  lightText: '#8E7F75',

  // Arkaplanlar — sıcak koyu zemin, rgba beyaz katmanlar
  background: '#1E1916',
  secondaryBackground: 'rgba(255, 255, 255, 0.05)',
  cardBackground: 'rgba(255, 255, 255, 0.07)',
  sheetBackground: '#2A231F',

  // Durumlar
  success: '#8CC98A',
  warning: '#F2B84B',
  error: '#F07A7A',
  info: '#7FB4E8',

  // Nötrler
  black: '#000000',
  white: '#FBF6F1',
  gray: '#A89A90',
  lightGray: 'rgba(255, 255, 255, 0.12)',

  // Etkileşim
  disabled: 'rgba(255, 255, 255, 0.16)',
  stroke: 'rgba(255, 255, 255, 0.09)',
  passiveButton: '#E8DDD4',

  // Katmanlar
  overlay: 'rgba(0, 0, 0, 0.6)',
  blurBackground: 'rgba(30, 25, 22, 0.85)',

  // Avatar tonları — karanlık zeminde bir tık daha açık, beyaz metin korunur
  avatarTints: [
    '#E9784A',
    '#EC9A55',
    '#CDA63A',
    '#93AE5C',
    '#72AE8E',
    '#4FA3A6',
    '#AE72A0',
    '#D97284',
  ],
};

// Styled-components veya hook'larda kullanım için export
export type Colors = ThemeColors;
