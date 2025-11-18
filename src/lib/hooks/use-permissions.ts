import { hasAllPermissions, hasAnyPermission, hasPermission } from "@/config/permissions";
import type { PermissionKey } from "@/config/permissions";
import { useAuthStore } from "@/lib/auth/auth-store";

export function usePermissions() {
  const { user } = useAuthStore();
  const permissions = user?.permissions || [];

  return {
    permissions,
    hasPermission: (permission: PermissionKey) => hasPermission(permissions, permission),
    hasAnyPermission: (requiredPermissions: PermissionKey[]) =>
      hasAnyPermission(permissions, requiredPermissions),
    hasAllPermissions: (requiredPermissions: PermissionKey[]) =>
      hasAllPermissions(permissions, requiredPermissions),
    hasAllAccess: user?.access?.hasAllAccess || false,
  };
}
