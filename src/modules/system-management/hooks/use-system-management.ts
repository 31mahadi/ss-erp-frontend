import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { systemManagementService } from "../application/service";
import type {
  CreateModuleInput,
  CreateSubmoduleInput,
  CreateFeatureInput,
  CreateOperationInput,
  CreateRoleInput,
} from "../domain/schema";

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
  return useMutation({
    mutationFn: (data: CreateModuleInput) => systemManagementService.createModule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateModuleInput> }) =>
      systemManagementService.updateModule(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["modules", variables.id] });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => systemManagementService.deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
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
  return useMutation({
    mutationFn: (data: CreateSubmoduleInput) => systemManagementService.createSubmodule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submodules"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });
}

export function useUpdateSubmodule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSubmoduleInput> }) =>
      systemManagementService.updateSubmodule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submodules"] });
    },
  });
}

export function useDeleteSubmodule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => systemManagementService.deleteSubmodule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submodules"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
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
  return useMutation({
    mutationFn: (data: CreateFeatureInput) => systemManagementService.createFeature(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      queryClient.invalidateQueries({ queryKey: ["submodules"] });
    },
  });
}

export function useUpdateFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateFeatureInput> }) =>
      systemManagementService.updateFeature(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
    },
  });
}

export function useDeleteFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => systemManagementService.deleteFeature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
      queryClient.invalidateQueries({ queryKey: ["submodules"] });
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
    },
  });
}

export function useDeleteOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => systemManagementService.deleteOperation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
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
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "module-access"] });
    },
  });
}

export function useRevokeRoleModuleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, moduleId }: { roleId: string; moduleId: string }) =>
      systemManagementService.revokeRoleModuleAccess(roleId, moduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "module-access"] });
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
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "submodule-access"] });
    },
  });
}

export function useRevokeRoleSubmoduleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, submoduleId }: { roleId: string; submoduleId: string }) =>
      systemManagementService.revokeRoleSubmoduleAccess(roleId, submoduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "submodule-access"] });
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
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "feature-access"] });
    },
  });
}

export function useRevokeRoleFeatureAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, featureId }: { roleId: string; featureId: string }) =>
      systemManagementService.revokeRoleFeatureAccess(roleId, featureId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "feature-access"] });
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
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "feature-operation-access"] });
    },
  });
}

export function useRevokeRoleFeatureOperationAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, featureId, operationId }: { roleId: string; featureId: string; operationId: string }) =>
      systemManagementService.revokeRoleFeatureOperationAccess(roleId, featureId, operationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roles", variables.roleId, "feature-operation-access"] });
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

