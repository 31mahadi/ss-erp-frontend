/**
 * Hook for managing URL-based state (query parameters)
 * Use this for navigation state, selected items, tabs, etc.
 * 
 * @example
 * const [tab, setTab] = useUrlState('tab', 'default');
 * // URL: /page?tab=users
 * 
 * @example
 * const [userId, setUserId] = useUrlState('userId', null);
 * // URL: /page?userId=123
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export function useUrlState<T extends string>(
  key: string,
  defaultValue: T | null = null
): [T | null, (value: T | null) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  const value = useMemo(() => {
    const param = searchParams.get(key);
    return (param as T) || defaultValue;
  }, [searchParams, key, defaultValue]);

  const setValue = useCallback(
    (newValue: T | null) => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (newValue === null || newValue === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, newValue);
      }

      // Update URL without page reload
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      
      router.replace(newUrl, { scroll: false });
    },
    [key, defaultValue, router, searchParams]
  );

  return [value, setValue];
}

/**
 * Hook for managing multiple URL state values at once
 * 
 * @example
 * const [state, setState] = useUrlStateObject({
 *   tab: 'users',
 *   userId: null,
 *   roleId: null,
 * });
 */
export function useUrlStateObject<T extends Record<string, string | null>>(
  defaults: T
): [T, (updates: Partial<T>) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo(() => {
    const result = { ...defaults };
    for (const key in defaults) {
      const param = searchParams.get(key);
      if (param) {
        result[key] = param as T[Extract<keyof T, string>];
      }
    }
    return result;
  }, [searchParams, defaults]);

  const setState = useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(searchParams.toString());
      
      for (const key in updates) {
        const value = updates[key];
        const defaultValue = defaults[key];
        
        if (value === null || value === undefined || value === defaultValue) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      
      router.replace(newUrl, { scroll: false });
    },
    [defaults, router, searchParams]
  );

  return [state, setState];
}

