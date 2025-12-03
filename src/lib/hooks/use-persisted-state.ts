/**
 * Combined hook for managing both URL and localStorage state
 * This is the recommended approach for most use cases
 * 
 * @example
 * // Tab in URL (shareable), expanded items in localStorage
 * const [tab, setTab] = useUrlState('tab', 'structure');
 * const [expanded, setExpanded] = useLocalStorageSet('structure-expanded');
 */

export { useUrlState, useUrlStateObject } from "./use-url-state";
export {
  useLocalStorageState,
  useLocalStorageSet,
  useLocalStorageMap,
} from "./use-local-storage-state";

/**
 * Helper to create a namespaced storage key
 * Prevents conflicts between different pages/features
 * 
 * @example
 * const key = createStorageKey('system-management', 'expanded-items');
 * // Returns: 'ss-erp:system-management:expanded-items'
 */
export function createStorageKey(...parts: string[]): string {
  return `ss-erp:${parts.join(":")}`;
}

/**
 * Helper to clear all storage keys for a namespace
 * 
 * @example
 * clearStorageNamespace('system-management');
 * // Clears all keys starting with 'ss-erp:system-management:'
 */
export function clearStorageNamespace(namespace: string): void {
  if (typeof window === "undefined") return;

  const prefix = createStorageKey(namespace);
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

