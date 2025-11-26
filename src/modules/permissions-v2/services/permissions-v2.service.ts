import { apiClient } from '@/lib/api/api-client';
import type { ApiResponse } from '@/lib/api/types';

// Types
export interface PermissionTreeModule {
  id: string;
  name: string;
  slug: string;
  order: number;
  hasAccess: boolean;
  isExplicit?: boolean;
  submodules: PermissionTreeSubmodule[];
}

export interface PermissionTreeSubmodule {
  id: string;
  name: string;
  slug: string;
  moduleId: string;
  hasAccess: boolean;
  isExplicit?: boolean;
  features: PermissionTreeFeature[];
}

export interface PermissionTreeFeature {
  id: string;
  name: string;
  slug: string;
  submoduleId: string;
  hasAccess: boolean;
  isExplicit?: boolean;
  operations: PermissionTreeOperation[];
}

export interface PermissionTreeOperation {
  id: string;
  name: string;
  slug: string;
  featureId: string;
  hasAccess: boolean;
  isExplicit?: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionKey: string;
  moduleId?: string;
  submoduleId?: string;
  featureId?: string;
  operationId?: string;
  allow: boolean;
}

export interface UserEffectivePermission {
  id: string;
  userId: string;
  permissionKey: string;
  allowed: boolean;
  sources?: {
    roles?: string[];
    manual_add?: boolean;
    manual_remove?: boolean;
  };
}

/**
 * Permissions V2 Service
 * Handles all interactions with the new flexible permissions API
 */
class PermissionsV2Service {
  private readonly baseUrl = '/v2/permissions';

  /**
   * Build permission key from components
   */
  buildPermissionKey(
    moduleId: string,
    submoduleId?: string,
    featureId?: string,
    operationId?: string,
  ): string {
    const parts = [moduleId];
    if (submoduleId) parts.push(submoduleId);
    if (featureId) parts.push(featureId);
    if (operationId) parts.push(operationId);
    return parts.join(':');
  }

  /**
   * Get hierarchical permission tree (structure only)
   */
  async getHierarchicalPermissionTree(): Promise<PermissionTreeModule[]> {
    const response = await apiClient.get<ApiResponse<PermissionTreeModule[]>>(
      '/admin/permissions/tree',
    );
    if (!response.data) {
      throw new Error('Failed to fetch permission tree');
    }
    return response.data;
  }

  /**
   * Get user effective permissions with tree structure
   * Uses the backend endpoint that returns the tree with access status already merged
   */
  async getUserEffectivePermissions(userId: string): Promise<PermissionTreeModule[]> {
    const response = await apiClient.get<ApiResponse<PermissionTreeModule[]>>(
      `${this.baseUrl}/users/${userId}/permissions/tree`,
    );
    if (!response.data) {
      throw new Error('Failed to fetch user permissions tree');
    }
    return response.data;
  }

  /**
   * Get role permissions with tree structure
   */
  async getRolePermissions(roleId: string): Promise<PermissionTreeModule[]> {
    // Get structure tree
    const tree = await this.getHierarchicalPermissionTree();
    
    // Get role permissions
    const rolePermsResponse = await apiClient.get<ApiResponse<RolePermission[]>>(
      `${this.baseUrl}/roles/${roleId}/permissions`,
    );
    const rolePermissions = rolePermsResponse.data || [];

    // Build a map of role permissions
    const permissionMap = new Map<string, RolePermission>();
    rolePermissions.forEach((perm) => {
      if (perm.allow) {
        permissionMap.set(perm.permissionKey, perm);
      }
    });

    // Merge tree with role permissions
    return tree.map((module) => {
      const moduleKey = module.id;
      const modulePerm = permissionMap.get(moduleKey);
      const hasModuleAccess = !!modulePerm;

      const submodules = module.submodules.map((submodule) => {
        const submoduleKey = `${module.id}:${submodule.id}`;
        const submodulePerm = permissionMap.get(submoduleKey);
        const hasSubmoduleAccess = !!submodulePerm || hasModuleAccess;

        const features = submodule.features.map((feature) => {
          const featureKey = `${module.id}:${submodule.id}:${feature.id}`;
          const featurePerm = permissionMap.get(featureKey);
          const hasFeatureAccess = !!featurePerm || hasSubmoduleAccess;

          const operations = feature.operations.map((operation) => {
            const operationKey = `${module.id}:${submodule.id}:${feature.id}:${operation.id}`;
            const operationPerm = permissionMap.get(operationKey);
            const hasOperationAccess = !!operationPerm || hasFeatureAccess;

            return {
              ...operation,
              hasAccess: hasOperationAccess,
            };
          });

          return {
            ...feature,
            hasAccess: hasFeatureAccess || operations.some((op) => op.hasAccess),
            operations,
          };
        });

        return {
          ...submodule,
          hasAccess: hasSubmoduleAccess || features.some((f) => f.hasAccess),
          features,
        };
      });

      return {
        ...module,
        hasAccess: hasModuleAccess || submodules.some((s) => s.hasAccess),
        submodules,
      };
    });
  }

  /**
   * Add permission to role
   */
  async addPermissionToRole(
    roleId: string,
    permissionKey: string,
    moduleId?: string,
    submoduleId?: string,
    featureId?: string,
    operationId?: string,
  ): Promise<void> {
    await apiClient.post(`${this.baseUrl}/roles/${roleId}/permissions`, {
      permissionKey,
      allow: true,
      moduleId,
      submoduleId,
      featureId,
      operationId,
    });
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleId: string, permissionKey: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/roles/${roleId}/permissions/${encodeURIComponent(permissionKey)}`);
  }

  /**
   * Add manual permission to user
   */
  async addManualPermissionToUser(
    userId: string,
    permissionKey: string,
    moduleId?: string,
    submoduleId?: string,
    featureId?: string,
    operationId?: string,
  ): Promise<void> {
    await apiClient.post(`${this.baseUrl}/users/${userId}/permissions/manual`, {
      permissionKey,
      moduleId,
      submoduleId,
      featureId,
      operationId,
    });
  }

  /**
   * Remove manual permission from user
   */
  async removeManualPermissionFromUser(userId: string, permissionKey: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/users/${userId}/permissions/manual/${encodeURIComponent(permissionKey)}`);
  }

  /**
   * Add manual deny to user
   */
  async addManualDenyToUser(
    userId: string,
    permissionKey: string,
    moduleId?: string,
    submoduleId?: string,
    featureId?: string,
    operationId?: string,
  ): Promise<void> {
    await apiClient.post(`${this.baseUrl}/users/${userId}/permissions/deny`, {
      permissionKey,
      moduleId,
      submoduleId,
      featureId,
      operationId,
    });
  }
}

export const permissionsV2Service = new PermissionsV2Service();

