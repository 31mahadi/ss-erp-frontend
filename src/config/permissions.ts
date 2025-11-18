/**
 * Permission utility functions for RBAC system
 * Supports dot-notation: module.submodule.feature.operation
 */

export type PermissionKey = string;

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userPermissions: string[] | undefined,
  requiredPermission: PermissionKey
): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  // Exact match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check for wildcard permissions (e.g., "module.submodule.*" matches "module.submodule.feature.read")
  const permissionParts = requiredPermission.split(".");
  for (let i = permissionParts.length; i > 0; i--) {
    const wildcardPermission = [...permissionParts.slice(0, i), "*"].join(".");
    if (userPermissions.includes(wildcardPermission)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(
  userPermissions: string[] | undefined,
  requiredPermissions: PermissionKey[]
): boolean {
  return requiredPermissions.some((permission) => hasPermission(userPermissions, permission));
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(
  userPermissions: string[] | undefined,
  requiredPermissions: PermissionKey[]
): boolean {
  return requiredPermissions.every((permission) => hasPermission(userPermissions, permission));
}

/**
 * Build permission key from parts
 */
export function buildPermissionKey(
  module: string,
  submodule?: string,
  feature?: string,
  operation?: string
): PermissionKey {
  const parts = [module];
  if (submodule) parts.push(submodule);
  if (feature) parts.push(feature);
  if (operation) parts.push(operation);
  return parts.join(".");
}

/**
 * Parse permission key into parts
 */
export function parsePermissionKey(permission: PermissionKey): {
  module?: string;
  submodule?: string;
  feature?: string;
  operation?: string;
} {
  const parts = permission.split(".");
  return {
    module: parts[0],
    submodule: parts[1],
    feature: parts[2],
    operation: parts[3],
  };
}
