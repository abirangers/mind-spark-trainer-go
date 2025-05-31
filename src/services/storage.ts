// src/services/storage.ts

export const storageService = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item "${key}" from localStorage:`, error);
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item "${key}" in localStorage:`, error);
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item "${key}" from localStorage:`, error);
    }
  },

  getObject<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error getting object "${key}" from localStorage:`, error);
      return null;
    }
  },

  setObject<T>(key: string, value: T): void {
    try {
      const stringValue = JSON.stringify(value);
      localStorage.setItem(key, stringValue);
    } catch (error)
      {
      console.error(`Error setting object "${key}" in localStorage:`, error);
    }
  },
};

export default storageService;
