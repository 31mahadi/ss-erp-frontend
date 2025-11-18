import { apiClient } from "@/lib/api/api-client";
import type { ApiResponse, PaginatedResponse } from "@/lib/api/types";
import { logger } from "@/lib/logger/logger";
import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/**
 * Generic hook for GET requests
 */
export function useApiQuery<TData = unknown>(
  endpoint: string,
  options?: Omit<UseQueryOptions<ApiResponse<TData>, Error, TData>, "queryKey" | "queryFn"> & {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: [endpoint, options?.enabled !== false ? "enabled" : "disabled"],
    queryFn: async () => {
      const response = await apiClient.get<TData>(endpoint);
      if (!response.data) {
        throw new Error(response.message || "Failed to fetch data");
      }
      return response.data;
    },
    ...options,
  });
}

/**
 * Generic hook for POST requests
 */
export function useApiMutation<TData = unknown, TVariables = unknown>(
  endpoint: string,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn"> & {
    invalidateQueries?: string[];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await apiClient.post<TData>(endpoint, variables);
      if (!response.data) {
        throw new Error(response.message || "Failed to create/update data");
      }
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      if (options?.invalidateQueries) {
        for (const queryKey of options.invalidateQueries) {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        }
      }
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      logger.error("API mutation failed", error, { endpoint, variables });
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
}

/**
 * Generic hook for PUT requests
 */
export function useApiPut<TData = unknown, TVariables = unknown>(
  endpoint: string,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn"> & {
    invalidateQueries?: string[];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await apiClient.put<TData>(endpoint, variables);
      if (!response.data) {
        throw new Error(response.message || "Failed to update data");
      }
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      if (options?.invalidateQueries) {
        for (const queryKey of options.invalidateQueries) {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        }
      }
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      logger.error("API PUT failed", error, { endpoint, variables });
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
}

/**
 * Generic hook for PATCH requests
 */
export function useApiPatch<TData = unknown, TVariables = unknown>(
  endpoint: string,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn"> & {
    invalidateQueries?: string[];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await apiClient.patch<TData>(endpoint, variables);
      if (!response.data) {
        throw new Error(response.message || "Failed to update data");
      }
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      if (options?.invalidateQueries) {
        for (const queryKey of options.invalidateQueries) {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        }
      }
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      logger.error("API PATCH failed", error, { endpoint, variables });
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
}

/**
 * Generic hook for DELETE requests
 */
export function useApiDelete<TData = unknown>(
  endpoint: string,
  options?: Omit<UseMutationOptions<TData, Error, void>, "mutationFn"> & {
    invalidateQueries?: string[];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete<TData>(endpoint);
      if (!response.data) {
        throw new Error(response.message || "Failed to delete data");
      }
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      if (options?.invalidateQueries) {
        for (const queryKey of options.invalidateQueries) {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        }
      }
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      logger.error("API DELETE failed", error, { endpoint });
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
}

/**
 * Hook for paginated list queries
 */
export function usePaginatedQuery<TData = unknown>(
  endpoint: string,
  params?: { page?: number; limit?: number; search?: string },
  options?: Omit<
    UseQueryOptions<PaginatedResponse<TData>, Error, PaginatedResponse<TData>>,
    "queryKey" | "queryFn"
  >
) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set("page", params.page.toString());
  if (params?.limit) queryParams.set("limit", params.limit.toString());
  if (params?.search) queryParams.set("search", params.search);

  const queryString = queryParams.toString();
  const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;

  return useQuery({
    queryKey: [endpoint, params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<TData>>(fullEndpoint);
      if (!response.data) {
        throw new Error(response.message || "Failed to fetch data");
      }
      return response.data;
    },
    ...options,
  });
}
