import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/api-client';
import { permissionsV2Service, type PermissionTreeModule } from '../services/permissions-v2.service';

// Types
export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface PermissionExplanation {
  allowed: boolean;
  reason: string;
  sources: {
    roles?: string[];
    manual_add?: boolean;
    manual_remove?: boolean;
  };
}

// Hooks for Roles
export function useRoles() {
  return useQuery({
    queryKey: ['permissions-v2', 'roles'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Role[] }>('/v2/permissions/roles');
      return response.data?.data || [];
    },
  });
}

export function useRole(roleId: string) {
  return useQuery({
    queryKey: ['permissions-v2', 'roles', roleId],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Role }>(`/v2/permissions/roles/${roleId}`);
      return response.data?.data;
    },
    enabled: !!roleId,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await apiClient.post<{ data: Role }>('/v2/permissions/roles', data);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions-v2', 'roles'] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, data }: { roleId: string; data: Partial<Role> }) => {
      const response = await apiClient.put<{ data: Role }>(`/v2/permissions/roles/${roleId}`, data);
      return response.data?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permissions-v2', 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['permissions-v2', 'roles', variables.roleId] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: string) => {
      await apiClient.delete(`/v2/permissions/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions-v2', 'roles'] });
    },
  });
}

// Hooks for Role Permissions Tree
export function useRolePermissionsTree(roleId: string) {
  return useQuery({
    queryKey: ['permissions-v2', 'roles', roleId, 'permissions', 'tree'],
    queryFn: () => permissionsV2Service.getRolePermissions(roleId),
    enabled: !!roleId,
  });
}

export function useAddPermissionToRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roleId,
      permissionKey,
      moduleId,
      submoduleId,
      featureId,
      operationId,
    }: {
      roleId: string;
      permissionKey: string;
      moduleId?: string;
      submoduleId?: string;
      featureId?: string;
      operationId?: string;
    }) => {
      await permissionsV2Service.addPermissionToRole(
        roleId,
        permissionKey,
        moduleId,
        submoduleId,
        featureId,
        operationId,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['permissions-v2', 'roles', variables.roleId, 'permissions'],
      });
    },
  });
}

export function useRemovePermissionFromRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, permissionKey }: { roleId: string; permissionKey: string }) => {
      await permissionsV2Service.removePermissionFromRole(roleId, permissionKey);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['permissions-v2', 'roles', variables.roleId, 'permissions'],
      });
    },
  });
}

// Hooks for User Role Assignment
export function useAssignRoleToUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      await apiClient.post(`/v2/permissions/users/${userId}/roles/${roleId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['permissions-v2', 'users', variables.userId, 'permissions'],
      });
    },
  });
}

export function useRemoveRoleFromUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      await apiClient.delete(`/v2/permissions/users/${userId}/roles/${roleId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['permissions-v2', 'users', variables.userId, 'permissions'],
      });
    },
  });
}

// Hooks for User Manual Permissions
export function useUserEffectivePermissionsTree(userId: string) {
  return useQuery({
    queryKey: ['permissions-v2', 'users', userId, 'permissions', 'tree'],
    queryFn: () => permissionsV2Service.getUserEffectivePermissions(userId),
    enabled: !!userId,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Always refetch on mount to ensure fresh data
    refetchOnReconnect: false,
    staleTime: 0, // Always consider data stale - refetch when needed
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors (authentication errors)
      if (error?.statusCode === 401) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useCheckPermission() {
  return useMutation({
    mutationFn: async ({ userId, permissionKey }: { userId: string; permissionKey: string }) => {
      const response = await apiClient.get<PermissionExplanation>(
        `/v2/permissions/users/${userId}/permissions/check/${permissionKey}`,
      );
      return response.data;
    },
  });
}

export function usePermissionExplanation() {
  return useMutation({
    mutationFn: async ({ userId, permissionKey }: { userId: string; permissionKey: string }) => {
      const response = await apiClient.get<PermissionExplanation>(
        `/v2/permissions/users/${userId}/permissions/explain/${permissionKey}`,
      );
      return response.data;
    },
  });
}

export function useAddManualPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      permissionKey,
      moduleId,
      submoduleId,
      featureId,
      operationId,
    }: {
      userId: string;
      permissionKey: string;
      moduleId?: string;
      submoduleId?: string;
      featureId?: string;
      operationId?: string;
    }) => {
      await permissionsV2Service.addManualPermissionToUser(
        userId,
        permissionKey,
        moduleId,
        submoduleId,
        featureId,
        operationId,
      );
    },
    retry: false, // Don't retry failed mutations
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['permissions-v2', 'users', variables.userId, 'permissions'],
      });
    },
  });
}

export function useRemoveManualPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, permissionKey }: { userId: string; permissionKey: string }) => {
      await permissionsV2Service.removeManualPermissionFromUser(userId, permissionKey);
    },
    retry: false, // Don't retry failed mutations
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['permissions-v2', 'users', variables.userId, 'permissions'],
      });
    },
  });
}

export function useAddManualDeny() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      permissionKey,
      moduleId,
      submoduleId,
      featureId,
      operationId,
    }: {
      userId: string;
      permissionKey: string;
      moduleId?: string;
      submoduleId?: string;
      featureId?: string;
      operationId?: string;
    }) => {
      await permissionsV2Service.addManualDenyToUser(
        userId,
        permissionKey,
        moduleId,
        submoduleId,
        featureId,
        operationId,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['permissions-v2', 'users', variables.userId, 'permissions'],
      });
    },
  });
}

// Helper hook to build permission keys
export function usePermissionKeyBuilder() {
  return {
    build: (
      moduleId: string,
      submoduleId?: string,
      featureId?: string,
      operationId?: string,
    ) => permissionsV2Service.buildPermissionKey(moduleId, submoduleId, featureId, operationId),
  };
}

