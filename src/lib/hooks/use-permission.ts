import { useAccessStore } from '@/lib/access/access-store';
import { useMemo } from 'react';

/**
 * Hook to check if user has a specific permission
 * @param permissionKey - Permission key in format "moduleId:submoduleId:featureId:operationId" or using slugs
 * @returns boolean indicating if user has the permission
 * 
 * @example
 * const canRead = usePermission('hr:worker:manage-worker:read');
 * const canEdit = usePermission('hr:worker:manage-worker:update');
 */
export function usePermission(permissionKey: string): boolean {
  const access = useAccessStore((state) => state.access);
  
  return useMemo(() => {
    if (!access) return false;
    if (access.hasAllAccess) return true;
    
    // Parse permission key: module:submodule:feature:operation
    const parts = permissionKey.split(':');
    const [moduleIdOrSlug, submoduleIdOrSlug, featureIdOrSlug, operationIdOrSlug] = parts;
    
    // Find module by ID or slug
    const module = access.modules.find(
      (m) => m.id === moduleIdOrSlug || m.slug === moduleIdOrSlug
    );
    if (!module) return false;
    
    // If only module level, user has access
    if (!submoduleIdOrSlug) return true;
    
    // Find submodule by ID or slug
    const submodule = module.submodules?.find(
      (s) => s.id === submoduleIdOrSlug || s.slug === submoduleIdOrSlug
    );
    if (!submodule) return false;
    
    // If only submodule level, user has access
    if (!featureIdOrSlug) return true;
    
    // Find feature by ID or slug
    const feature = submodule.features?.find(
      (f) => f.id === featureIdOrSlug || f.slug === featureIdOrSlug
    );
    if (!feature) return false;
    
    // If only feature level, user has access
    if (!operationIdOrSlug) return true;
    
    // Check operation level
    return feature.operations?.some(
      (o) => o.id === operationIdOrSlug || o.slug === operationIdOrSlug
    ) ?? false;
  }, [access, permissionKey]);
}

/**
 * Hook to check if user has ANY of the specified permissions (OR logic)
 * @param permissionKeys - Array of permission keys
 * @returns boolean indicating if user has any of the permissions
 * 
 * @example
 * const canModify = useAnyPermission(['hr:worker:manage-worker:update', 'hr:worker:manage-worker:delete']);
 */
export function useAnyPermission(permissionKeys: string[]): boolean {
  const access = useAccessStore((state) => state.access);
  
  return useMemo(() => {
    if (!access) return false;
    if (access.hasAllAccess) return true;
    
    return permissionKeys.some((key) => {
      const parts = key.split(':');
      const [moduleIdOrSlug, submoduleIdOrSlug, featureIdOrSlug, operationIdOrSlug] = parts;
      
      const module = access.modules.find(
        (m) => m.id === moduleIdOrSlug || m.slug === moduleIdOrSlug
      );
      if (!module) return false;
      if (!submoduleIdOrSlug) return true;
      
      const submodule = module.submodules?.find(
        (s) => s.id === submoduleIdOrSlug || s.slug === submoduleIdOrSlug
      );
      if (!submodule) return false;
      if (!featureIdOrSlug) return true;
      
      const feature = submodule.features?.find(
        (f) => f.id === featureIdOrSlug || f.slug === featureIdOrSlug
      );
      if (!feature) return false;
      if (!operationIdOrSlug) return true;
      
      return feature.operations?.some(
        (o) => o.id === operationIdOrSlug || o.slug === operationIdOrSlug
      ) ?? false;
    });
  }, [access, permissionKeys]);
}

/**
 * Hook to check if user has ALL of the specified permissions (AND logic)
 * @param permissionKeys - Array of permission keys
 * @returns boolean indicating if user has all of the permissions
 * 
 * @example
 * const canFullyManage = useAllPermissions([
 *   'hr:worker:manage-worker:read',
 *   'hr:worker:manage-worker:update',
 *   'hr:worker:manage-worker:delete'
 * ]);
 */
export function useAllPermissions(permissionKeys: string[]): boolean {
  const access = useAccessStore((state) => state.access);
  
  return useMemo(() => {
    if (!access) return false;
    if (access.hasAllAccess) return true;
    
    return permissionKeys.every((key) => {
      const parts = key.split(':');
      const [moduleIdOrSlug, submoduleIdOrSlug, featureIdOrSlug, operationIdOrSlug] = parts;
      
      const module = access.modules.find(
        (m) => m.id === moduleIdOrSlug || m.slug === moduleIdOrSlug
      );
      if (!module) return false;
      if (!submoduleIdOrSlug) return true;
      
      const submodule = module.submodules?.find(
        (s) => s.id === submoduleIdOrSlug || s.slug === submoduleIdOrSlug
      );
      if (!submodule) return false;
      if (!featureIdOrSlug) return true;
      
      const feature = submodule.features?.find(
        (f) => f.id === featureIdOrSlug || f.slug === featureIdOrSlug
      );
      if (!feature) return false;
      if (!operationIdOrSlug) return true;
      
      return feature.operations?.some(
        (o) => o.id === operationIdOrSlug || o.slug === operationIdOrSlug
      ) ?? false;
    });
  }, [access, permissionKeys]);
}

/**
 * Hook to get all permissions for CRUD operations on a feature
 * @param moduleSlug - Module slug
 * @param submoduleSlug - Submodule slug
 * @param featureSlug - Feature slug
 * @returns Object with boolean flags for each CRUD operation
 * 
 * @example
 * const { canRead, canCreate, canUpdate, canDelete } = useFeaturePermissions('hr', 'worker', 'manage-worker');
 */
export function useFeaturePermissions(
  moduleSlug: string,
  submoduleSlug: string,
  featureSlug: string
): {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  hasAnyAccess: boolean;
  hasFullAccess: boolean;
} {
  const canRead = usePermission(`${moduleSlug}:${submoduleSlug}:${featureSlug}:read`);
  const canCreate = usePermission(`${moduleSlug}:${submoduleSlug}:${featureSlug}:create`);
  const canUpdate = usePermission(`${moduleSlug}:${submoduleSlug}:${featureSlug}:update`);
  const canDelete = usePermission(`${moduleSlug}:${submoduleSlug}:${featureSlug}:delete`);
  
  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    hasAnyAccess: canRead || canCreate || canUpdate || canDelete,
    hasFullAccess: canRead && canCreate && canUpdate && canDelete,
  };
}

/**
 * Hook to check if user has module-level access
 * @param moduleSlug - Module slug
 * @returns boolean indicating if user has access to the module
 */
export function useModuleAccess(moduleSlug: string): boolean {
  const hasAccess = useAccessStore((state) => state.hasModuleAccess(moduleSlug));
  return hasAccess;
}

/**
 * Hook to check if user has submodule-level access
 * @param moduleSlug - Module slug
 * @param submoduleSlug - Submodule slug
 * @returns boolean indicating if user has access to the submodule
 */
export function useSubmoduleAccess(moduleSlug: string, submoduleSlug: string): boolean {
  const hasAccess = useAccessStore((state) => state.hasSubmoduleAccess(moduleSlug, submoduleSlug));
  return hasAccess;
}

/**
 * Hook to check if user has feature-level access
 * @param moduleSlug - Module slug
 * @param submoduleSlug - Submodule slug
 * @param featureSlug - Feature slug
 * @returns boolean indicating if user has access to the feature
 */
export function useFeatureAccess(
  moduleSlug: string,
  submoduleSlug: string,
  featureSlug: string
): boolean {
  const hasAccess = useAccessStore((state) => 
    state.hasFeatureAccess(moduleSlug, submoduleSlug, featureSlug)
  );
  return hasAccess;
}

