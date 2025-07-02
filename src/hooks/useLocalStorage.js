import { useState } from 'react';
import { getStorageItem, setStorageItem } from '../lib/utils';

/**
 * Custom hook for localStorage with automatic JSON serialization
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value if no stored value exists
 * @returns {[value, setValue]} - Current value and setter function
 */
export function useLocalStorage(key, initialValue) {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    return getStorageItem(key, initialValue);
  });

  // Setter function that updates both state and localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function for functional updates
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      setStorageItem(key, valueToStore);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook for managing multiple localStorage keys with a prefix
 * @param {string} prefix - Common prefix for all keys
 * @returns {object} - Object with get, set, remove, and clear functions
 */
export function useLocalStorageManager(prefix = 'wealthstud_') {
  const get = (key, fallback = null) => {
    return getStorageItem(prefix + key, fallback);
  };

  const set = (key, value) => {
    return setStorageItem(prefix + key, value);
  };

  const remove = (key) => {
    try {
      localStorage.removeItem(prefix + key);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage key "${prefix + key}":`, error);
      return false;
    }
  };

  const clear = () => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error(`Error clearing localStorage with prefix "${prefix}":`, error);
      return false;
    }
  };

  return { get, set, remove, clear };
}