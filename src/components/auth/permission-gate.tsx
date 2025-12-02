"use client";

import { ReactNode } from 'react';
import { usePermission, useAnyPermission, useAllPermissions } from '@/lib/hooks/use-permission';

interface PermissionGateProps {
  /**
   * Permission key in format "module:submodule:feature:operation"
   * Can use IDs or slugs
   */
  permission?: string;
  /**
   * Array of permission keys - user needs ANY of these (OR logic)
   */
  anyOf?: string[];
  /**
   * Array of permission keys - user needs ALL of these (AND logic)
   */
  allOf?: string[];
  /**
   * Content to render if user has permission
   */
  children: ReactNode;
  /**
   * Content to render if user doesn't have permission
   * Defaults to null (nothing rendered)
   */
  fallback?: ReactNode;
}

/**
 * Component to conditionally render content based on user permissions
 * 
 * @example
 * // Single permission
 * <PermissionGate permission="hr:worker:manage-worker:delete">
 *   <DeleteButton />
 * </PermissionGate>
 * 
 * @example
 * // Any of multiple permissions (OR)
 * <PermissionGate anyOf={["hr:worker:manage-worker:update", "hr:worker:manage-worker:delete"]}>
 *   <ActionsMenu />
 * </PermissionGate>
 * 
 * @example
 * // All permissions required (AND)
 * <PermissionGate allOf={["hr:worker:manage-worker:read", "hr:worker:manage-worker:update"]}>
 *   <EditableView />
 * </PermissionGate>
 * 
 * @example
 * // With fallback content
 * <PermissionGate permission="hr:worker:manage-worker:delete" fallback={<span>No access</span>}>
 *   <DeleteButton />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
}: PermissionGateProps) {
  // Determine which check to use
  const singlePermission = usePermission(permission || '');
  const anyPermission = useAnyPermission(anyOf || []);
  const allPermission = useAllPermissions(allOf || []);

  let hasPermission = false;

  if (permission) {
    hasPermission = singlePermission;
  } else if (anyOf && anyOf.length > 0) {
    hasPermission = anyPermission;
  } else if (allOf && allOf.length > 0) {
    hasPermission = allPermission;
  } else {
    // No permission specified, allow access
    hasPermission = true;
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component to hide content if user has a specific permission
 * Inverse of PermissionGate
 * 
 * @example
 * <HideWithPermission permission="admin:settings:read">
 *   <UpgradePrompt />
 * </HideWithPermission>
 */
export function HideWithPermission({
  permission,
  anyOf,
  allOf,
  children,
}: Omit<PermissionGateProps, 'fallback'>) {
  return (
    <PermissionGate permission={permission} anyOf={anyOf} allOf={allOf} fallback={children}>
      {null}
    </PermissionGate>
  );
}

interface PermissionSwitchProps {
  /**
   * Permission key to check
   */
  permission: string;
  /**
   * Content to render if user HAS the permission
   */
  whenAllowed: ReactNode;
  /**
   * Content to render if user DOESN'T have the permission
   */
  whenDenied: ReactNode;
}

/**
 * Component to render different content based on permission
 * 
 * @example
 * <PermissionSwitch
 *   permission="hr:worker:manage-worker:update"
 *   whenAllowed={<EditButton />}
 *   whenDenied={<ViewOnlyBadge />}
 * />
 */
export function PermissionSwitch({
  permission,
  whenAllowed,
  whenDenied,
}: PermissionSwitchProps) {
  const hasPermission = usePermission(permission);
  return hasPermission ? <>{whenAllowed}</> : <>{whenDenied}</>;
}

