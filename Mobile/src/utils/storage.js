import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory fallback if AsyncStorage isn't available
const memoryStorage = {};

export const storage = {
  getItem: async (key) => {
    try {
      if (AsyncStorage) {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.warn(`[storage] getItem error for ${key}:`, error);
    }
    return memoryStorage[key] || null;
  },

  setItem: async (key, value) => {
    try {
      if (AsyncStorage) {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn(`[storage] setItem error for ${key}:`, error);
    }
    memoryStorage[key] = value;
  },

  removeItem: async (key) => {
    try {
      if (AsyncStorage) {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`[storage] removeItem error for ${key}:`, error);
    }
    delete memoryStorage[key];
  },

  clear: async () => {
    try {
      if (AsyncStorage) {
        await AsyncStorage.clear();
      }
    } catch (error) {
      console.warn('[storage] clear error:', error);
    }
    Object.keys(memoryStorage).forEach((key) => delete memoryStorage[key]);
  },
};

export default storage;
