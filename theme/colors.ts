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
}

/**
 * Light Theme — Geliom (Okyanus Mavisi & Fıstık Yeşili)
 * Marka: #0474B4 (mavi) + #D2E6B3 (soft yeşil)
 */
export const lightColors: ThemeColors = {
  // Marka
  primary: '#0474B4',        // Okyanus mavisi
  secondary: '#D2E6B3',      // Fıstık yeşili (soft accent)
  tertiary: '#3E9BD6',       // Açık mavi

  // Component Durumları
  activeState: '#03608F',         // Koyu mavi (Aktif/Güçlü)
  passiveState: 'rgba(4, 116, 180, 0.10)', // Mavi @ 10% (Pasif/Hafif)
  loadingState: '#0587CF',           // Canlı mavi (Yükleniyor)

  linearGradient: ['#0474B4', '#2FA3E0'], // Koyu maviden açık maviye

  // Tipografi — koyu petrol tonları
  text: '#10242F',
  secondaryText: '#47616F',
  lightText: '#8CA3AF',

  // Arkaplanlar — box zeminleri rgba, soft katman hissi
  background: '#F5F9FC',
  secondaryBackground: 'rgba(4, 116, 180, 0.05)',
  cardBackground: 'rgba(255, 255, 255, 0.92)',
  sheetBackground: '#FFFFFF',

  // Durumlar
  success: '#8FBF5A',        // Marka yeşilinin doygun hali
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#0587CF',

  // Nötrler
  black: '#0A161D',
  white: '#FFFFFF',
  gray: '#64798A',
  lightGray: '#DFE9EF',

  // Etkileşim
  disabled: '#C3D2DB',
  stroke: 'rgba(13, 59, 84, 0.10)',
  passiveButton: 'rgba(57, 62, 70, 0.3)',

  // Katmanlar
  overlay: 'rgba(10, 25, 35, 0.55)',
  blurBackground: 'rgba(255, 255, 255, 0.85)',
};

/**
 * Dark Theme — Soft Gece (koyu petrol zemin, yumuşak rgba katmanlar)
 * Simsiyah değil; mavi-gri, göz yormayan bir karanlık.
 */
export const darkColors: ThemeColors = {
  // Marka — karanlıkta görünürlük için açık tonlar
  primary: '#4FA9DC',
  secondary: '#D2E6B3',
  tertiary: '#7FC0E5',

  // Component Durumları
  activeState: '#0474B4',
  passiveState: 'rgba(79, 169, 220, 0.16)',
  loadingState: '#2F89BE',

  linearGradient: ['#2F89BE', '#4FA9DC'],

  // Tipografi
  text: '#EEF4F8',
  secondaryText: '#B9C7D1',
  lightText: '#7C8E9A',

  // Arkaplanlar — box zeminleri rgba beyaz katman: soft derinlik
  background: '#16202A',
  secondaryBackground: 'rgba(255, 255, 255, 0.05)',
  cardBackground: 'rgba(255, 255, 255, 0.07)',
  sheetBackground: '#20303F',

  // Durumlar
  success: '#A9CF7C',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  // Nötrler
  black: '#000000',
  white: '#F5F9FC',
  gray: '#93A6B2',
  lightGray: 'rgba(255, 255, 255, 0.12)',

  // Etkileşim
  disabled: 'rgba(255, 255, 255, 0.16)',
  stroke: 'rgba(255, 255, 255, 0.09)',
  passiveButton: '#DBE2EF',

  // Katmanlar
  overlay: 'rgba(0, 0, 0, 0.6)',
  blurBackground: 'rgba(22, 32, 42, 0.85)',
};

// Styled-components veya hook'larda kullanım için export
export type Colors = ThemeColors;
