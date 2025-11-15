// Light theme colors - Doğa temalı yeşil tonlar
export const lightColors = {
  // Ana renkler - Canlı yeşil tonları
  primary: '#2E7D32',        // Orman yeşili
  secondary: '#4CAF50',      // Çimen yeşili
  tertiary: '#81C784',       // Açık yeşil
  
  // GeliomButton renkleri - Sadece kullanılan renkler
  forest: '#1B5E20',         // 9. Active state - Koyu orman yeşili
  sage: 'rgba(1, 121, 111, 0.5)',           // 13. Passive state - Adaçayı yeşili
  pine: '#01796F',           // 17. Loading state - Çam yeşili
  // Gradient tonları - Doğal geçişler
  linearGradient: ['#2E7D32', '#4CAF50'],
  
  // Metin renkleri
  text: '#1B5E20',           // Koyu yeşil metin
  secondaryText: '#4E7C4F',  // Orta ton yeşil
  lightText: '#81C784',      // Açık yeşil metin
  
  // Arkaplan renkleri
  background: '#F1F8E9',     // Çok açık yeşil arkaplan
  secondaryBackground: '#E8F5E8', // İkincil arkaplan
  cardBackground: '#FFFFFF', // Kart arkaplanı
  
  // Sistem renkleri
  success: '#4CAF50',        // Başarı yeşili
  warning: '#FF9800',        // Turuncu uyarı
  error: '#F44336',          // Kırmızı hata
  info: '#2196F3',           // Mavi bilgi
  
  // Nötr renkler
  black: '#1B5E20',          // Koyu yeşil siyah
  white: '#FFFFFF',          // Beyaz
  gray: '#9E9E9E',           // Gri
  lightGray: '#E0E0E0',      // Açık gri
  
  // Etkileşim renkleri
  disabled: '#C8E6C9',       // Pasif yeşil
  stroke: '#A5D6A7',         // Çerçeve yeşili
  shadow: 'rgba(46, 125, 50, 0.1)', // Yeşil gölge
  
  // Blur ve overlay renkleri
  overlay: 'rgba(46, 125, 50, 0.6)',     // Yeşil overlay
  blurBackground: 'rgba(241, 248, 233, 0.8)', // Blur arkaplan
};

// Dark theme colors - Gece doğası teması
export const darkColors = {
  // Ana renkler - Daha yumuşak yeşil tonlar
  primary: '#4CAF50',        // Parlak yeşil
  secondary: '#66BB6A',      // Orta yeşil
  tertiary: '#81C784',       // Açık yeşil
  
  // GeliomButton renkleri - Dark mode versiyonları
  forest: '#2E7D32',         // 9. Active state - Orman yeşili (daha açık)
  sage: 'rgba(1, 121, 111, 0.5)',           // 13. Passive state - Adaçayı yeşili (daha açık)
  pine: '#26A69A',           // 17. Loading state - Çam yeşili (daha açık)
  
  // Gradient tonları
  linearGradient: ['#4CAF50', '#66BB6A'],
  
  // Metin renkleri
  text: '#E8F5E8',           // Açık yeşil metin
  secondaryText: '#A5D6A7',  // Orta ton yeşil
  lightText: '#C8E6C9',      // Çok açık yeşil
  
  // Arkaplan renkleri
  background: '#0D1B0F',     // Çok koyu yeşil arkaplan
  secondaryBackground: '#1B2E1F', // İkincil koyu arkaplan
  cardBackground: '#263238', // Kart arkaplanı
  
  // Sistem renkleri
  success: '#4CAF50',        // Başarı yeşili
  warning: '#FF9800',        // Turuncu uyarı
  error: '#F44336',          // Kırmızı hata
  info: '#2196F3',           // Mavi bilgi
  
  // Nötr renkler
  black: '#000000',          // Siyah
  white: '#E8F5E8',          // Yeşilimsi beyaz
  gray: '#616161',           // Gri
  lightGray: '#424242',      // Koyu gri
  
  // Etkileşim renkleri
  disabled: '#2E4B32',       // Pasif koyu yeşil
  stroke: '#4E7C4F',         // Çerçeve yeşili
  shadow: 'rgba(76, 175, 80, 0.2)', // Yeşil gölge
  
  // Blur ve overlay renkleri
  overlay: 'rgba(76, 175, 80, 0.4)',     // Yeşil overlay
  blurBackground: 'rgba(13, 27, 15, 0.9)', // Blur arkaplan
};

export type Colors = typeof lightColors;
