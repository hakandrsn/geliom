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
  forest: string; // Active State
  sage: string;   // Passive State
  pine: string;   // Loading State
  
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
  shadow: string;

  // Katmanlar
  overlay: string;
  blurBackground: string;
}

/**
 * Light Theme - Social Harmony (Temiz, İndigo & Gül)
 */
export const lightColors: ThemeColors = {
  // Marka - Modern, Güvenilir, Enerjik
  primary: '#4F46E5',        // Indigo 600
  secondary: '#E11D48',      // Rose 600
  tertiary: '#8B5CF6',       // Violet 500
  
  // Component Durumları (Doğa isimleri fonksiyona eşlendi)
  forest: '#4338CA',         // Indigo 700 (Aktif/Güçlü)
  sage: 'rgba(99, 102, 241, 0.15)', // Indigo 500 @ 15% (Pasif/Hafif)
  pine: '#6366F1',           // Indigo 500 (Yükleniyor/Canlı)
  
  linearGradient: ['#4F46E5', '#7C3AED'], // Indigo'dan Violet'e
  
  // Tipografi - Slate Serisi (Yüksek Okunabilirlik)
  text: '#0F172A',           // Slate 900
  secondaryText: '#475569',  // Slate 600
  lightText: '#94A3B8',      // Slate 400
  
  // Arkaplanlar
  background: '#F8FAFC',     // Slate 50
  secondaryBackground: '#F1F5F9', // Slate 100
  cardBackground: '#FFFFFF', // Saf Beyaz
  
  // Durumlar
  success: '#10B981',        // Emerald 500
  warning: '#F59E0B',        // Amber 500
  error: '#EF4444',          // Red 500
  info: '#3B82F6',           // Blue 500
  
  // Nötrler
  black: '#020617',          // Slate 950
  white: '#FFFFFF',
  gray: '#64748B',           // Slate 500
  lightGray: '#E2E8F0',      // Slate 200
  
  // Etkileşim
  disabled: '#CBD5E1',       // Slate 300
  stroke: '#E2E8F0',         // Slate 200
  shadow: 'rgba(79, 70, 229, 0.15)', // İndigo tonlu gölge
  
  // Katmanlar
  overlay: 'rgba(15, 23, 42, 0.6)',     // Koyu Slate Overlay
  blurBackground: 'rgba(255, 255, 255, 0.85)',
};

/**
 * Dark Theme - Deep Night Social (Göz yormayan Slate & Neon)
 */
export const darkColors: ThemeColors = {
  // Marka - Karanlık modda görünürlük için daha açık/neon tonlar
  primary: '#818CF8',        // Indigo 400
  secondary: '#FB7185',      // Rose 400
  tertiary: '#A78BFA',       // Violet 400
  
  // Component Durumları
  forest: '#6366F1',         // Indigo 500 (Aktif)
  sage: 'rgba(129, 140, 248, 0.2)', // Indigo 400 @ 20% (Pasif)
  pine: '#4F46E5',           // Indigo 600 (Yükleniyor)
  
  linearGradient: ['#6366F1', '#8B5CF6'],
  
  // Tipografi
  text: '#F8FAFC',           // Slate 50
  secondaryText: '#CBD5E1',  // Slate 300
  lightText: '#64748B',      // Slate 500
  
  // Arkaplanlar
  background: '#020617',     // Slate 950 (Derin Lacivert/Siyah)
  secondaryBackground: '#0F172A', // Slate 900
  cardBackground: '#1E293B', // Slate 800
  
  // Durumlar
  success: '#34D399',        // Emerald 400
  warning: '#FBBF24',        // Amber 400
  error: '#F87171',          // Red 400
  info: '#60A5FA',           // Blue 400
  
  // Nötrler
  black: '#000000',
  white: '#F8FAFC',
  gray: '#94A3B8',           // Slate 400
  lightGray: '#334155',      // Slate 700
  
  // Etkileşim
  disabled: '#334155',       // Slate 700
  stroke: '#334155',         // Slate 700
  shadow: 'rgba(0, 0, 0, 0.5)', // Derin siyah gölge
  
  // Katmanlar
  overlay: 'rgba(0, 0, 0, 0.7)',
  blurBackground: 'rgba(30, 41, 59, 0.8)', // Slate 800 bazlı
};

// Styled-components veya hook'larda kullanım için export
export type Colors = ThemeColors;