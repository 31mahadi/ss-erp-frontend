import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { systemManagementService } from "../application/service";
import type {
  CreateModuleInput,
  CreateSubmoduleInput,
  CreateFeatureInput,
  CreateOperationInput,
  CreateRoleInput,
} from "../domain/schema";
import { useAuthStore } from "@/lib/auth/auth-store";

// Modules
export function useModules() {
  return useQuery({
    queryKey: ["modules"],
    queryFn: () => systemManagementService.getModules(),
  });
}

export function useModule(id: string) {
  return useQuery({
    queryKey: ["modules", id],
    queryFn: () => systemManagementService.getModule(id),
    enabled: !!id,
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthStore();
  return useMutation({
    mutationFn: (data: CreateModuleInput) => systemManagementService.createModule(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", "tree"] });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false }); // Invalidate all user permission queries
      queryClient.invalidateQueries({ queryKey: ["roles"], exact: false }); // Invalidate all role permission queries
      // Force refetch the permission tree
      queryClient.refetchQueries({ queryKey: ["permissions", "tree"] });
      // Refresh user data to update sidebar menu
      // Add a small delay to ensure backend has processed the changes
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms for backend to process
        await refreshUser();
        // Force a re-render by invalidating access store
        if (process.env.NODE_ENV === 'development') {
          console.log("User data refreshed after module creation");
        }
      } catch (error) {
        // Silently fail - user data refresh is not critical
        console.warn("Failed to refresh user data after module creation:", error);
      }
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthStore();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateModuleInput> }) =>
      systemManagementService.updateModule(id, data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["modules", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["permissions", "tree"] });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["roles"], exact: false });
      queryClient.refetchQueries({ queryKey: ["permissions", "tree"] });
      // Refresh user data to update sidebar menu
      try {
        await refreshUser();
      } catch (error) {
        console.warn("Failed to refresh user data after module update:", error);
      }
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthStore();
  return useMutation({
    mutationFn: (id: string) => systemManagementService.deleteModule(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", "tree"] });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["roles"], exact: false });
      queryClient.refetchQueries({ queryKey: ["permissions", "tree"] });
      // Refresh user data to update sidebar menu
      try {
        await refreshUser();
      } catch (error) {
        console.warn("Failed to refresh user data after module deletion:", error);
      }
    },
  });
}

// Submodules
export function useSubmodules(moduleId?: string) {
  return useQuery({
    queryKey: ["submodules", moduleId],
    queryFn: () => systemManagementService.getSubmodules(moduleId),
  });
}

export function useCreateSubmodule() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthStore();
  return useMutation({
    mutationFn: (data: CreateSubmoduleInput) => systemManagementService.createSubmodule(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["submodules"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", "tree"] });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["roles"], exact: false });
      queryClient.refetchQueries({ queryKey: ["permissions", "tree"] });
      // Refresh user data to update sidebar menu
      try {
        await refreshUser();
      } catch (error) {
        console.warn("Failed to refresh user data after submodule creation:", error);
      }
    },
  });
}

export function useUpdateSubmodule() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthStore();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSubmoduleInput> }) =>
      systemManagementService.updateSubmodule(id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["submodules"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", "tree"] });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["roles"], exact: false });
      queryClient.refetchQueries({ queryKey: ["permissions", "tree"] });
      // Refresh user data to update sidebar menu
      try {
        await refreshUser();
      } catch (error) {
        console.warn("Failed to refresh user data after submodule update:", error);
      }
    },
  });
}

export function useDeleteSubmodule() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthStore();
  return useMutation({
    mutationFn: (id: string) => systemManagementService.deleteSubmodule(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["submodules"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", "tree"] });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["roles"], exact: false });
      queryClient.refetchQueries({ queryKey: ["permissions", "tree"] });
      // Refresh user data to update sidebar menu
      try {
        await refreshUser();
      } catch (error) {
        console.warn("Failed to refresh user data after submodule deletion:", error);
      }
    },
  });
}

// Features
export function useFeatures(submoduleId?: string) {
  return useQuery({
    queryKey: ["features", submoduleId],
    queryFn: () => systemManagementService.getFeatures(submoduleId),
  });
}

export function useCreateFeature() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthStore();
  return useMutation({
    mutationFn: (data: CreateFeatureInput) => systemManagementService.createFeature(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      queryClient.invalidateQueries({ queryKey: ["submodules"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", "tree"] });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["roles"], exact: false });
      queryClient.refetchQueries({ queryKey: ["permissions", "tree"] });
      // Refresh user data to update sidebar menu
      try {
        await refreshUser();
      } catch (error) {
        console.warn("Failed to refresh user data after feature creation:", error);
      }
    },
  });
}

export function useUpdateFeature() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthStore();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateFeatureInput> }) =>
      systemManagementService.updateFeature(id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", "tree"] });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["roles"], exact: false });
      queryClient.refetchQueries({ queryKey: ["permissions", "tree"] });
      // Refresh user data to update sidebar menu
      try {
        await refreshUser();
      } catch (error) {
        console.warn("Failed to refresh user data after feature update:", error);
      }
    },
  });
}

export function useDeleteFeature() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthStore();
  return useMutation({
    mutationFn: (id: string) => systemManagementService.deleteFeature(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      queryClient.invalidateQueries({ queryKey: ["submodules"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", "tree"] });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["roles"], exact: false });
      queryClient.refetchQueries({ queryKey: ["permissions", "tree"] });
      // Refresh user data to update sidebar menu
      try {
        await refreshUser();
      } catch (error) {
        console.warn("Failed to refresh user data after feature deletion:", error);
      }
    },
  });
}

// Operations
export function useOperations() {
  return useQuery({
    queryKey: ["operations"],
    queryFn: () => systemManagementService.getOperations(),
  });
}

export function useCreateOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOperationInput) => systemManagementService.createOperation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", "tree"] });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["roles"], exact: false });
      queryClient.refetchQueries({ queryKey: ["permissions", "tree"] });
    },
  });
}

export function useUpdateOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateOperationInput> }) =>
      systemManagementService.updateOperation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", "tree"] });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["roles"], exact: false });
      queryClient.refetchQueries({ queryKey: ["permissions", "tree"] });
    },
  });
}

export function useDeleteOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => systemManagementService.deleteOperation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", "tree"] });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["roles"], exact: false });
      queryClient.refetchQueries({ queryKey: ["permissions", "tree"] });
    },
  });
}

// Roles
export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => systemManagementService.getRoles(),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleInput) => systemManagementService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRoleInput> }) =>
      systemManagementService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => systemManagementService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

// Role Access Control
export function useRoleModuleAccess(roleId: string) {
  return useQuery({
    queryKey: ["roles", roleId, "module-access"],
    queryFn: () => systemManagementService.getRoleModuleAccess(roleId),
    enabled: !!roleId,
  });
}

export function useGrantRoleModuleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, moduleId }: { roleId: string; moduleId: string }) =>
      systemManagementService.grantRoleModuleAccess(roleId, moduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["roles", variables.roleId, "permissions"],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "module-access"] });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ["roles", variables.roleId, "permissions", "tree"],
      });
    },
  });
}

export function useRevokeRoleModuleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, moduleId }: { roleId: string; moduleId: string }) =>
      systemManagementService.revokeRoleModuleAccess(roleId, moduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["roles", variables.roleId, "permissions"],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "module-access"] });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ["roles", variables.roleId, "permissions", "tree"],
      });
    },
  });
}

export function useRoleSubmoduleAccess(roleId: string) {
  return useQuery({
    queryKey: ["roles", roleId, "submodule-access"],
    queryFn: () => systemManagementService.getRoleSubmoduleAccess(roleId),
    enabled: !!roleId,
  });
}

export function useGrantRoleSubmoduleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, submoduleId }: { roleId: string; submoduleId: string }) =>
      systemManagementService.grantRoleSubmoduleAccess(roleId, submoduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["roles", variables.roleId, "permissions"],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "submodule-access"] });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ["roles", variables.roleId, "permissions", "tree"],
      });
    },
  });
}

export function useRevokeRoleSubmoduleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, submoduleId }: { roleId: string; submoduleId: string }) =>
      systemManagementService.revokeRoleSubmoduleAccess(roleId, submoduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["roles", variables.roleId, "permissions"],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "submodule-access"] });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ["roles", variables.roleId, "permissions", "tree"],
      });
    },
  });
}

export function useRoleFeatureAccess(roleId: string) {
  return useQuery({
    queryKey: ["roles", roleId, "feature-access"],
    queryFn: () => systemManagementService.getRoleFeatureAccess(roleId),
    enabled: !!roleId,
  });
}

export function useGrantRoleFeatureAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, featureId }: { roleId: string; featureId: string }) =>
      systemManagementService.grantRoleFeatureAccess(roleId, featureId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["roles", variables.roleId, "permissions"],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "feature-access"] });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ["roles", variables.roleId, "permissions", "tree"],
      });
    },
  });
}

export function useRevokeRoleFeatureAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, featureId }: { roleId: string; featureId: string }) =>
      systemManagementService.revokeRoleFeatureAccess(roleId, featureId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["roles", variables.roleId, "permissions"],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "feature-access"] });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ["roles", variables.roleId, "permissions", "tree"],
      });
    },
  });
}

export function useRoleFeatureOperationAccess(roleId: string) {
  return useQuery({
    queryKey: ["roles", roleId, "feature-operation-access"],
    queryFn: () => systemManagementService.getRoleFeatureOperationAccess(roleId),
    enabled: !!roleId,
  });
}

export function useGrantRoleFeatureOperationAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, featureId, operationId }: { roleId: string; featureId: string; operationId: string }) =>
      systemManagementService.grantRoleFeatureOperationAccess(roleId, featureId, operationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["roles", variables.roleId, "permissions"],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "feature-operation-access"] });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ["roles", variables.roleId, "permissions", "tree"],
      });
    },
  });
}

export function useRevokeRoleFeatureOperationAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, featureId, operationId }: { roleId: string; featureId: string; operationId: string }) =>
      systemManagementService.revokeRoleFeatureOperationAccess(roleId, featureId, operationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["roles", variables.roleId, "permissions"],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "feature-operation-access"] });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ["roles", variables.roleId, "permissions", "tree"],
      });
    },
  });
}

// Feature Operations
export function useFeatureOperations(featureId: string) {
  return useQuery({
    queryKey: ["features", featureId, "operations"],
    queryFn: () => systemManagementService.getFeatureOperations(featureId),
    enabled: !!featureId,
  });
}

export function useAddOperationToFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ featureId, operationId, isDefault }: { featureId: string; operationId: string; isDefault?: boolean }) =>
      systemManagementService.addOperationToFeature(featureId, operationId, isDefault ?? false),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["features", variables.featureId, "operations"] });
      queryClient.invalidateQueries({ queryKey: ["features"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", "tree"] });
    },
  });
}

export function useRemoveOperationFromFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ featureId, operationId }: { featureId: string; operationId: string }) =>
      systemManagementService.removeOperationFromFeature(featureId, operationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["features", variables.featureId, "operations"] });
      queryClient.invalidateQueries({ queryKey: ["features"] });
    },
  });
}

// Hierarchical Permission Tree
export function useHierarchicalPermissionTree() {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ["permissions", "tree"],
    queryFn: () => systemManagementService.getHierarchicalPermissionTree(),
    enabled: isAuthenticated, // Only fetch when authenticated
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors (authentication errors)
      if (error?.statusCode === 401) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 60000, // Consider data fresh for 60 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

export function useRoleHierarchicalPermissions(roleId: string) {
  return useQuery({
    queryKey: ["roles", roleId, "permissions", "tree"],
    queryFn: () => systemManagementService.getRoleHierarchicalPermissions(roleId),
    enabled: !!roleId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

// User Permission Management
export function useUserHierarchicalPermissions(userId: string) {
  return useQuery({
    queryKey: ["users", userId, "permissions", "tree"],
    queryFn: () => systemManagementService.getUserHierarchicalPermissions(userId),
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useGrantUserSubmoduleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, submoduleId }: { userId: string; submoduleId: string }) =>
      systemManagementService.grantUserSubmoduleAccess(userId, submoduleId),
    onSuccess: (_, variables) => {
      // Invalidate all permission-related queries for this user
      queryClient.invalidateQueries({ 
        queryKey: ["users", variables.userId, "permissions"],
        exact: false, // Invalidate all queries that start with this key
      });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ["users", variables.userId, "permissions", "tree"],
      });
    },
  });
}

export function useRevokeUserSubmoduleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, submoduleId }: { userId: string; submoduleId: string }) =>
      systemManagementService.revokeUserSubmoduleAccess(userId, submoduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["users", variables.userId, "permissions"],
        exact: false,
      });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ["users", variables.userId, "permissions", "tree"],
      });
    },
  });
}

export function useGrantUserFeatureAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, featureId }: { userId: string; featureId: string }) =>
      systemManagementService.grantUserFeatureAccess(userId, featureId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["users", variables.userId, "permissions"],
        exact: false,
      });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ["users", variables.userId, "permissions", "tree"],
      });
    },
  });
}

export function useRevokeUserFeatureAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, featureId }: { userId: string; featureId: string }) =>
      systemManagementService.revokeUserFeatureAccess(userId, featureId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["users", variables.userId, "permissions"],
        exact: false,
      });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ["users", variables.userId, "permissions", "tree"],
      });
    },
  });
}

export function useGrantUserFeatureOperationAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      featureId,
      operationId,
    }: {
      userId: string;
      featureId: string;
      operationId: string;
    }) => systemManagementService.grantUserFeatureOperationAccess(userId, featureId, operationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["users", variables.userId, "permissions"],
        exact: false,
      });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ["users", variables.userId, "permissions", "tree"],
      });
    },
  });
}

export function useRevokeUserFeatureOperationAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      featureId,
      operationId,
    }: {
      userId: string;
      featureId: string;
      operationId: string;
    }) => systemManagementService.revokeUserFeatureOperationAccess(userId, featureId, operationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["users", variables.userId, "permissions"],
        exact: false,
      });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ["users", variables.userId, "permissions", "tree"],
      });
    },
  });
}

