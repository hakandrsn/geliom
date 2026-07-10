import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage Keys — sıralamalar kullanıcı + grup başına tutulur
// (custom status/mood'lar gruba özel olduğundan sıralama da gruba özeldir)
const STATUS_ORDER_KEY = (userId: string, groupId: string) =>
  `status_order_${userId}_${groupId}`;
const MOOD_ORDER_KEY = (userId: string, groupId: string) =>
  `mood_order_${userId}_${groupId}`;
export const SELECTED_GROUP_STORAGE_KEY = "@geliom:selected_group_id";

/**
 * Seçili grup ID'sini AsyncStorage'dan alır
 * @returns Seçili grup ID'si veya null
 */
export const getSelectedGroupId = async (): Promise<string | null> => {
  try {
    const groupId = await AsyncStorage.getItem(SELECTED_GROUP_STORAGE_KEY);
    return groupId;
  } catch (error) {
    console.error("Selected group ID okuma hatası:", error);
    return null;
  }
};

/**
 * Seçili grup ID'sini AsyncStorage'a kaydeder
 * @param groupId Grup ID'si (null ise kaldırır)
 */
export const setSelectedGroupId = async (
  groupId: string | null,
): Promise<void> => {
  try {
    if (groupId) {
      await AsyncStorage.setItem(SELECTED_GROUP_STORAGE_KEY, groupId);
    } else {
      await AsyncStorage.removeItem(SELECTED_GROUP_STORAGE_KEY);
    }
  } catch (error) {
    console.error("Selected group ID kaydetme hatası:", error);
  }
};

/**
 * Kullanıcının bir gruptaki status sıralamasını local storage'dan alır
 */
export const getStatusOrder = async (
  userId: string,
  groupId: string,
): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(
      STATUS_ORDER_KEY(userId, groupId),
    );
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map(String); // Ensure everything is string
    }
    return [];
  } catch (error) {
    console.error("Status order okuma hatası:", error);
    return [];
  }
};

/**
 * Kullanıcının bir gruptaki status sıralamasını local storage'a kaydeder
 */
export const saveStatusOrder = async (
  userId: string,
  groupId: string,
  order: string[],
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STATUS_ORDER_KEY(userId, groupId),
      JSON.stringify(order),
    );
  } catch (error) {
    console.error("Status order kaydetme hatası:", error);
  }
};

/**
 * Kullanıcının bir gruptaki mood sıralamasını local storage'dan alır
 */
export const getMoodOrder = async (
  userId: string,
  groupId: string,
): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(MOOD_ORDER_KEY(userId, groupId));
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map(String);
    }
    return [];
  } catch (error) {
    console.error("Mood order okuma hatası:", error);
    return [];
  }
};

/**
 * Kullanıcının bir gruptaki mood sıralamasını local storage'a kaydeder
 */
export const saveMoodOrder = async (
  userId: string,
  groupId: string,
  order: string[],
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      MOOD_ORDER_KEY(userId, groupId),
      JSON.stringify(order),
    );
  } catch (error) {
    console.error("Mood order kaydetme hatası:", error);
  }
};
