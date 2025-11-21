import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
const STATUS_ORDER_KEY = (userId: string) => `status_order_${userId}`;
const MOOD_ORDER_KEY = (userId: string) => `mood_order_${userId}`;

/**
 * Kullanıcının status sıralamasını local storage'dan alır
 * @param userId Kullanıcı ID'si
 * @returns Status ID'lerinin sıralı dizisi
 */
export const getStatusOrder = async (userId: string): Promise<number[]> => {
  try {
    const stored = await AsyncStorage.getItem(STATUS_ORDER_KEY(userId));
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Status order okuma hatası:', error);
    return [];
  }
};

/**
 * Kullanıcının status sıralamasını local storage'a kaydeder
 * @param userId Kullanıcı ID'si
 * @param order Status ID'lerinin sıralı dizisi
 */
export const saveStatusOrder = async (userId: string, order: number[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STATUS_ORDER_KEY(userId), JSON.stringify(order));
  } catch (error) {
    console.error('Status order kaydetme hatası:', error);
  }
};

/**
 * Kullanıcının mood sıralamasını local storage'dan alır
 * @param userId Kullanıcı ID'si
 * @returns Mood ID'lerinin sıralı dizisi
 */
export const getMoodOrder = async (userId: string): Promise<number[]> => {
  try {
    const stored = await AsyncStorage.getItem(MOOD_ORDER_KEY(userId));
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Mood order okuma hatası:', error);
    return [];
  }
};

/**
 * Kullanıcının mood sıralamasını local storage'a kaydeder
 * @param userId Kullanıcı ID'si
 * @param order Mood ID'lerinin sıralı dizisi
 */
export const saveMoodOrder = async (userId: string, order: number[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(MOOD_ORDER_KEY(userId), JSON.stringify(order));
  } catch (error) {
    console.error('Mood order kaydetme hatası:', error);
  }
};

