import { apiClient } from "@/lib/api/api-client";
import type { PaginatedResponse } from "@/lib/api/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  useApiDelete,
  useApiMutation,
  useApiPatch,
  useApiPut,
  useApiQuery,
  usePaginatedQuery,
} from "./use-api";

/**
 * Generic CRUD hooks factory
 * Creates reusable hooks for standard CRUD operations
 */
export function createCrudHooks<TItem = unknown, TCreate = unknown, TUpdate = unknown>(config: {
  baseEndpoint: string;
  listEndpoint?: string;
  itemQueryKey?: string;
  listQueryKey?: string;
}) {
  const {
    baseEndpoint,
    listEndpoint = config.baseEndpoint,
    itemQueryKey = baseEndpoint,
    listQueryKey = `${baseEndpoint}/list`,
  } = config;

  /**
   * Get list of items (paginated)
   */
  function useList(params?: { page?: number; limit?: number; search?: string }) {
    return usePaginatedQuery<TItem>(listEndpoint, params);
  }

  /**
   * Get single item by ID
   */
  function useItem(id: string, options?: { enabled?: boolean }) {
    return useApiQuery<TItem>(`${baseEndpoint}/${id}`, {
      enabled: options?.enabled !== false && !!id,
    });
  }

  /**
   * Create new item
   */
  function useCreate() {
    return useApiMutation<TItem, TCreate>(baseEndpoint, {
      invalidateQueries: [listQueryKey],
    });
  }

  /**
   * Update item
   */
  function useUpdate() {
    return useApiPut<TItem, { id: string; data: TUpdate }>(baseEndpoint, {
      invalidateQueries: [listQueryKey, itemQueryKey],
    });
  }

  /**
   * Patch item (partial update)
   */
  function usePatch() {
    return useApiPatch<TItem, { id: string; data: Partial<TUpdate> }>(baseEndpoint, {
      invalidateQueries: [listQueryKey, itemQueryKey],
    });
  }

  /**
   * Delete item
   */
  function useDelete() {
    return useApiDelete<{ message: string }>(baseEndpoint, {
      invalidateQueries: [listQueryKey],
    });
  }

  return {
    useList,
    useItem,
    useCreate,
    useUpdate,
    usePatch,
    useDelete,
  };
}

/**
 * Helper to create mutation that updates a specific item endpoint
 */
export function useUpdateItem<TData = unknown, TVariables = unknown>(
  getEndpoint: (id: string) => string,
  options?: { invalidateQueries?: string[] }
) {
  const queryClient = useQueryClient();

  return useApiMutation<TData, { id: string; data: TVariables }>(
    "", // Will be set in mutationFn
    {
      mutationFn: async ({ id, data }) => {
        const endpoint = getEndpoint(id);
        const response = await apiClient.put<TData>(endpoint, data);
        if (!response.data) {
          throw new Error(response.message || "Failed to update");
        }
        return response.data;
      },
      onSuccess: (data, variables) => {
        if (options?.invalidateQueries) {
          for (const queryKey of options.invalidateQueries) {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
          }
        }
        // Also invalidate the specific item
        queryClient.invalidateQueries({ queryKey: [getEndpoint(variables.id)] });
      },
    }
  );
}

/**
 * Helper to create mutation that deletes a specific item endpoint
 */
export function useDeleteItem<TData = unknown>(
  getEndpoint: (id: string) => string,
  options?: { invalidateQueries?: string[] }
) {
  const queryClient = useQueryClient();

  return useApiMutation<TData, string>(
    "", // Will be set in mutationFn
    {
      mutationFn: async (id) => {
        const endpoint = getEndpoint(id);
        const response = await apiClient.delete<TData>(endpoint);
        if (!response.data) {
          throw new Error(response.message || "Failed to delete");
        }
        return response.data;
      },
      onSuccess: (data, id) => {
        if (options?.invalidateQueries) {
          for (const queryKey of options.invalidateQueries) {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
          }
        }
        // Remove the specific item from cache
        queryClient.removeQueries({ queryKey: [getEndpoint(id)] });
      },
    }
  );
}
