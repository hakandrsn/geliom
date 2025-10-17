import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from '../theme/colors';

// 1. Context'i oluştur
export const ThemeContext = createContext({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
});

// 2. Provider component'ini oluştur
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Cihazın temasını al
  const colorScheme = useColorScheme(); 
  
  // State'i tanımla. Başlangıçta cihazın temasına göre ayarla.
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  // Tema değiştiğinde çalışacak olan effect
  useEffect(() => {
    // Kullanıcının daha önce kaydettiği bir tercih var mı diye kontrol et
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        }
      } catch (error) {
        console.error("Failed to load theme from storage", error);
      }
    };

    loadTheme();
  }, []);

  // Temayı değiştiren fonksiyon
  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    try {
      await AsyncStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    } catch (error) {
      console.error("Failed to save theme to storage", error);
    }
  };

  // Mevcut temaya göre doğru renk paletini seç
  const themeColors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors: themeColors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Kolay kullanım için custom hook oluştur
export const useTheme = () => useContext(ThemeContext);
