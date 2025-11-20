import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; // Supabase'in React Native'de düzgün çalışması için gerekli

// Supabase projenizin bilgilerini buraya girin.
// En iyi pratik, bu bilgileri bir .env dosyasında saklamaktır.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase istemcisini oluşturuyoruz.
// AsyncStorage'ı oturum bilgilerini saklamak için kullanıyoruz.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
