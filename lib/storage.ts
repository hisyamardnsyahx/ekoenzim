/**
 * Auth session storage that works in Expo Go / web / when native AsyncStorage is unavailable.
 */
import { Platform } from 'react-native';

type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStorage: StorageLike = {
  getItem: async (key) => memory.get(key) ?? null,
  setItem: async (key, value) => {
    memory.set(key, value);
  },
  removeItem: async (key) => {
    memory.delete(key);
  },
};

const webStorage: StorageLike = {
  getItem: async (key) => {
    if (typeof localStorage === 'undefined') return memoryStorage.getItem(key);
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStorage.getItem(key);
    }
  },
  setItem: async (key, value) => {
    if (typeof localStorage === 'undefined') return memoryStorage.setItem(key, value);
    try {
      localStorage.setItem(key, value);
    } catch {
      await memoryStorage.setItem(key, value);
    }
  },
  removeItem: async (key) => {
    if (typeof localStorage === 'undefined') return memoryStorage.removeItem(key);
    try {
      localStorage.removeItem(key);
    } catch {
      await memoryStorage.removeItem(key);
    }
  },
};

function wrapAsyncStorage(native: StorageLike): StorageLike {
  return {
    getItem: async (key) => {
      try {
        return await native.getItem(key);
      } catch {
        return memoryStorage.getItem(key);
      }
    },
    setItem: async (key, value) => {
      try {
        await native.setItem(key, value);
      } catch {
        await memoryStorage.setItem(key, value);
      }
    },
    removeItem: async (key) => {
      try {
        await native.removeItem(key);
      } catch {
        await memoryStorage.removeItem(key);
      }
    },
  };
}

function createNativeStorage(): StorageLike {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-async-storage/async-storage');
    const AS = mod?.default ?? mod;
    if (AS && typeof AS.getItem === 'function') {
      return wrapAsyncStorage(AS as StorageLike);
    }
  } catch {
    // native module missing
  }
  return memoryStorage;
}

export const authStorage: StorageLike =
  Platform.OS === 'web' ? webStorage : createNativeStorage();
