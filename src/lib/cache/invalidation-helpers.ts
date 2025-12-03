import type { QueryClient } from "@tanstack/react-query";

/**
 * Centralized query invalidation helpers
 * Use these to ensure consistent cache invalidation across the app
 */

/**
 * Invalidate all permission-related queries
 * Call this after any CRUD operation on modules, submodules, features, operations, or roles
 */
export function invalidatePermissionQueries(queryClient: QueryClient): void {
  const keysToInvalidate = [
    ["modules"],
    ["submodules"],
    ["features"],
    ["operations"],
    ["permissions", "tree"],
  ];

  keysToInvalidate.forEach((key) =>
    queryClient.invalidateQueries({ queryKey: key, exact: false })
  );
}

/**
 * Invalidate all user-related queries
 * Call this after permission changes that affect users
 */
export function invalidateUserQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
  queryClient.invalidateQueries({ queryKey: ["permissions-v2", "users"], exact: false });
}

/**
 * Invalidate all role-related queries
 * Call this after role CRUD or role permission changes
 */
export function invalidateRoleQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ["roles"], exact: false });
}

/**
 * Invalidate all permission-related queries and force refetch the tree
 * Use this for major structure changes
 */
export function invalidateAndRefetchPermissions(queryClient: QueryClient): void {
  invalidatePermissionQueries(queryClient);
  invalidateUserQueries(queryClient);
  invalidateRoleQueries(queryClient);
  
  // Force refetch the permission tree
  queryClient.refetchQueries({ queryKey: ["permissions", "tree"] });
}

/**
 * Invalidate queries for a specific role's permissions
 */
export function invalidateRolePermissions(
  queryClient: QueryClient,
  roleId: string
): void {
  queryClient.invalidateQueries({
    queryKey: ["roles", roleId, "permissions"],
    exact: false,
  });
  queryClient.invalidateQueries({
    queryKey: ["roles", roleId, "module-access"],
  });
  queryClient.invalidateQueries({
    queryKey: ["roles", roleId, "submodule-access"],
  });
  queryClient.invalidateQueries({
    queryKey: ["roles", roleId, "feature-access"],
  });
  queryClient.invalidateQueries({
    queryKey: ["roles", roleId, "feature-operation-access"],
  });
  
  // Also invalidate user permissions since role changes affect users
  invalidateUserQueries(queryClient);
  
  // Force refetch
  queryClient.refetchQueries({
    queryKey: ["roles", roleId, "permissions", "tree"],
  });
}

/**
 * Invalidate queries for a specific user's permissions
 */
export function invalidateUserPermissions(
  queryClient: QueryClient,
  userId: string
): void {
  queryClient.invalidateQueries({
    queryKey: ["users", userId, "permissions"],
    exact: false,
  });
  
  // Force refetch
  queryClient.refetchQueries({
    queryKey: ["users", userId, "permissions", "tree"],
  });
}

/**
 * Get error message from unknown error
 * Utility for consistent error handling
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "An unexpected error occurred";
}

