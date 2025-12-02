"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { PermissionTreeModule } from "@/modules/system-management/domain/types";

interface OptimisticUpdateOptions {
  queryKey: (string | undefined)[];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Helper function to update permission tree optimistically
 * Updates the hasAccess and hasDirectAccess properties based on the change
 */
function updateTreeOptimistically(
  tree: PermissionTreeModule[] | undefined,
  level: 'module' | 'submodule' | 'feature' | 'operation',
  ids: { moduleId?: string; submoduleId?: string; featureId?: string; operationId?: string },
  checked: boolean
): PermissionTreeModule[] | undefined {
  if (!tree) return tree;

  return tree.map((module) => {
    if (level === 'module' && module.id === ids.moduleId) {
      return {
        ...module,
        hasAccess: checked,
        hasDirectAccess: checked,
        isExplicit: checked,
        submodules: module.submodules.map((sub) => ({
          ...sub,
          hasAccess: checked,
          hasDirectAccess: checked,
          isExplicit: checked,
          features: sub.features.map((feat) => ({
            ...feat,
            hasAccess: checked,
            hasDirectAccess: checked,
            isExplicit: checked,
            operations: feat.operations.map((op) => ({
              ...op,
              hasAccess: checked,
              hasDirectAccess: checked,
              isExplicit: checked,
            })),
          })),
        })),
      };
    }

    if (level === 'submodule') {
      return {
        ...module,
        submodules: module.submodules.map((sub) => {
          if (sub.id === ids.submoduleId) {
            return {
              ...sub,
              hasAccess: checked,
              hasDirectAccess: checked,
              isExplicit: checked,
              features: sub.features.map((feat) => ({
                ...feat,
                hasAccess: checked,
                hasDirectAccess: checked,
                isExplicit: checked,
                operations: feat.operations.map((op) => ({
                  ...op,
                  hasAccess: checked,
                  hasDirectAccess: checked,
                  isExplicit: checked,
                })),
              })),
            };
          }
          return sub;
        }),
      };
    }

    if (level === 'feature') {
      return {
        ...module,
        submodules: module.submodules.map((sub) => ({
          ...sub,
          features: sub.features.map((feat) => {
            if (feat.id === ids.featureId) {
              return {
                ...feat,
                hasAccess: checked,
                hasDirectAccess: checked,
                isExplicit: checked,
                operations: feat.operations.map((op) => ({
                  ...op,
                  hasAccess: checked,
                  hasDirectAccess: checked,
                  isExplicit: checked,
                })),
              };
            }
            return feat;
          }),
        })),
      };
    }

    if (level === 'operation') {
      return {
        ...module,
        submodules: module.submodules.map((sub) => ({
          ...sub,
          features: sub.features.map((feat) => ({
            ...feat,
            operations: feat.operations.map((op) => {
              if (op.id === ids.operationId) {
                return {
                  ...op,
                  hasAccess: checked,
                  hasDirectAccess: checked,
                  isExplicit: checked,
                };
              }
              return op;
            }),
          })),
        })),
      };
    }

    return module;
  });
}

/**
 * Hook for managing optimistic updates for role permissions
 */
export function useOptimisticRolePermission(roleId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["roles", roleId, "permissions", "tree"];

  const optimisticUpdate = useCallback(
    async <T>(
      mutationFn: () => Promise<T>,
      level: 'module' | 'submodule' | 'feature' | 'operation',
      ids: { moduleId?: string; submoduleId?: string; featureId?: string; operationId?: string },
      checked: boolean
    ): Promise<T> => {
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<PermissionTreeModule[]>(queryKey);

      // Optimistically update
      queryClient.setQueryData<PermissionTreeModule[]>(
        queryKey,
        (old) => updateTreeOptimistically(old, level, ids, checked)
      );

      try {
        // Execute the mutation
        const result = await mutationFn();
        return result;
      } catch (error) {
        // Rollback on error
        queryClient.setQueryData(queryKey, previousData);
        throw error;
      }
    },
    [queryClient, queryKey]
  );

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { optimisticUpdate, invalidate };
}

/**
 * Hook for managing optimistic updates for user permissions
 */
export function useOptimisticUserPermission(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["permissions-v2", "users", userId, "tree"];

  const optimisticUpdate = useCallback(
    async <T>(
      mutationFn: () => Promise<T>,
      level: 'module' | 'submodule' | 'feature' | 'operation',
      ids: { moduleId?: string; submoduleId?: string; featureId?: string; operationId?: string },
      checked: boolean
    ): Promise<T> => {
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<PermissionTreeModule[]>(queryKey);

      // Optimistically update
      queryClient.setQueryData<PermissionTreeModule[]>(
        queryKey,
        (old) => updateTreeOptimistically(old, level, ids, checked)
      );

      try {
        // Execute the mutation
        const result = await mutationFn();
        return result;
      } catch (error) {
        // Rollback on error
        queryClient.setQueryData(queryKey, previousData);
        throw error;
      }
    },
    [queryClient, queryKey]
  );

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { optimisticUpdate, invalidate };
}

/**
 * Generic hook for optimistic updates with any query key
 */
export function useOptimisticPermissionTree<T = PermissionTreeModule[]>(
  queryKey: (string | undefined)[]
) {
  const queryClient = useQueryClient();

  const setOptimistic = useCallback(
    (updater: (old: T | undefined) => T | undefined) => {
      queryClient.setQueryData<T>(queryKey, updater);
    },
    [queryClient, queryKey]
  );

  const rollback = useCallback(
    (previousData: T | undefined) => {
      queryClient.setQueryData(queryKey, previousData);
    },
    [queryClient, queryKey]
  );

  const getSnapshot = useCallback(() => {
    return queryClient.getQueryData<T>(queryKey);
  }, [queryClient, queryKey]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { setOptimistic, rollback, getSnapshot, invalidate };
}

