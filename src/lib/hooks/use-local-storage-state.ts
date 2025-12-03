/**
 * Hook for managing localStorage-based state
 * Use this for UI preferences, expanded states, filters, etc.
 * 
 * @example
 * const [expandedItems, setExpandedItems] = useLocalStorageState('expanded-items', new Set());
 * 
 * @example
 * const [filters, setFilters] = useLocalStorageState('user-filters', { search: '', role: null });
 */

import { useCallback, useEffect, useState } from "react";

type SetValue<T> = T | ((prevValue: T) => T);

/**
 * Hook to sync state with localStorage
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options?: {
    /**
     * Custom serializer (default: JSON.stringify)
     */
    serialize?: (value: T) => string;
    /**
     * Custom deserializer (default: JSON.parse)
     */
    deserialize?: (value: string) => T;
    /**
     * Storage to use (default: localStorage)
     */
    storage?: Storage;
  }
): [T, (value: SetValue<T>) => void] {
  const storage = options?.storage ?? (typeof window !== "undefined" ? localStorage : null);
  const serialize = options?.serialize ?? JSON.stringify;
  const deserialize = options?.deserialize ?? JSON.parse;

  // Initialize state from localStorage or default
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!storage) return defaultValue;
    
    try {
      const item = storage.getItem(key);
      if (item === null) return defaultValue;
      return deserialize(item);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Update localStorage when state changes
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        
        if (storage) {
          if (valueToStore === null || valueToStore === undefined) {
            storage.removeItem(key);
          } else {
            storage.setItem(key, serialize(valueToStore));
          }
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serialize, storage, storedValue]
  );

  // Listen for changes from other tabs/windows
  useEffect(() => {
    if (!storage) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.warn(`Error deserializing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, deserialize, storage]);

  return [storedValue, setValue];
}

/**
 * Hook for managing Set state in localStorage
 * Useful for expanded items, selected items, etc.
 */
export function useLocalStorageSet<T extends string>(
  key: string,
  defaultValue: Set<T> = new Set()
): [Set<T>, (updates: Set<T> | ((prev: Set<T>) => Set<T>)) => void] {
  const [array, setArray] = useLocalStorageState<T[]>(
    key,
    Array.from(defaultValue),
    {
      serialize: (value) => JSON.stringify(Array.from(value)),
      deserialize: (value) => JSON.parse(value) as T[],
    }
  );

  const set = useCallback(
    (updates: Set<T> | ((prev: Set<T>) => Set<T>)) => {
      setArray((prev) => {
        const prevSet = new Set(prev);
        const newSet = updates instanceof Function ? updates(prevSet) : updates;
        return Array.from(newSet);
      });
    },
    [setArray]
  );

  return [new Set(array), set];
}

/**
 * Hook for managing Map state in localStorage
 */
export function useLocalStorageMap<K extends string, V>(
  key: string,
  defaultValue: Map<K, V> = new Map()
): [Map<K, V>, (updates: Map<K, V> | ((prev: Map<K, V>) => Map<K, V>)) => void] {
  const [entries, setEntries] = useLocalStorageState<[K, V][]>(
    key,
    Array.from(defaultValue.entries()),
    {
      serialize: (value) => JSON.stringify(value),
      deserialize: (value) => JSON.parse(value) as [K, V][],
    }
  );

  const setMap = useCallback(
    (updates: Map<K, V> | ((prev: Map<K, V>) => Map<K, V>)) => {
      setEntries((prev) => {
        const prevMap = new Map(prev);
        const newMap = updates instanceof Function ? updates(prevMap) : updates;
        return Array.from(newMap.entries());
      });
    },
    [setEntries]
  );

  return [new Map(entries), setMap];
}

