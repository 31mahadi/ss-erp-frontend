import { API_ENDPOINTS } from "@/config/api";
import { apiClient } from "@/lib/api/api-client";
import type {
  Module,
  Submodule,
  Feature,
  Operation,
  FeatureOperation,
  Role,
  RoleModuleAccess,
  RoleSubmoduleAccess,
  RoleFeatureAccess,
  RoleFeatureOperationAccess,
  PermissionTreeModule,
} from "../domain/types";

export class SystemManagementService {
  // Modules
  async getModules(): Promise<Module[]> {
    const response = await apiClient.get<Module[]>(API_ENDPOINTS.admin.modules.list);
    return response.data || [];
  }

  async getModule(id: string): Promise<Module> {
    const response = await apiClient.get<Module>(API_ENDPOINTS.admin.modules.get(id));
    if (!response.data) throw new Error("Module not found");
    return response.data;
  }

  async createModule(data: { name: string; slug: string; description?: string; icon?: string; order?: number }): Promise<Module> {
    const response = await apiClient.post<Module>(API_ENDPOINTS.admin.modules.create, data);
    if (!response.data) throw new Error("Failed to create module");
    return response.data;
  }

  async updateModule(id: string, data: Partial<Module>): Promise<Module> {
    const response = await apiClient.put<Module>(API_ENDPOINTS.admin.modules.update(id), data);
    if (!response.data) throw new Error("Failed to update module");
    return response.data;
  }

  async deleteModule(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.modules.delete(id));
  }

  // Submodules
  async getSubmodules(moduleId?: string): Promise<Submodule[]> {
    const url = moduleId
      ? `${API_ENDPOINTS.admin.submodules.list}?moduleId=${moduleId}`
      : API_ENDPOINTS.admin.submodules.list;
    const response = await apiClient.get<Submodule[]>(url);
    return response.data || [];
  }

  async getSubmodule(id: string): Promise<Submodule> {
    const response = await apiClient.get<Submodule>(API_ENDPOINTS.admin.submodules.get(id));
    if (!response.data) throw new Error("Submodule not found");
    return response.data;
  }

  async createSubmodule(data: {
    moduleId: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
  }): Promise<Submodule> {
    const response = await apiClient.post<Submodule>(API_ENDPOINTS.admin.submodules.create, data);
    if (!response.data) throw new Error("Failed to create submodule");
    return response.data;
  }

  async updateSubmodule(id: string, data: Partial<Submodule>): Promise<Submodule> {
    const response = await apiClient.put<Submodule>(API_ENDPOINTS.admin.submodules.update(id), data);
    if (!response.data) throw new Error("Failed to update submodule");
    return response.data;
  }

  async deleteSubmodule(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.submodules.delete(id));
  }

  // Features
  async getFeatures(submoduleId?: string): Promise<Feature[]> {
    const url = submoduleId
      ? `${API_ENDPOINTS.admin.features.list}?submoduleId=${submoduleId}`
      : API_ENDPOINTS.admin.features.list;
    const response = await apiClient.get<Feature[]>(url);
    return response.data || [];
  }

  async getFeature(id: string): Promise<Feature> {
    const response = await apiClient.get<Feature>(API_ENDPOINTS.admin.features.get(id));
    if (!response.data) throw new Error("Feature not found");
    return response.data;
  }

  async createFeature(data: {
    submoduleId: string;
    name: string;
    slug: string;
    description?: string;
    route?: string;
    icon?: string;
    sortOrder?: number;
  }): Promise<Feature> {
    const response = await apiClient.post<Feature>(API_ENDPOINTS.admin.features.create, data);
    if (!response.data) throw new Error("Failed to create feature");
    return response.data;
  }

  async updateFeature(id: string, data: Partial<Feature>): Promise<Feature> {
    const response = await apiClient.put<Feature>(API_ENDPOINTS.admin.features.update(id), data);
    if (!response.data) throw new Error("Failed to update feature");
    return response.data;
  }

  async deleteFeature(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.features.delete(id));
  }

  // Feature Operations
  async getFeatureOperations(featureId: string): Promise<FeatureOperation[]> {
    const response = await apiClient.get<FeatureOperation[]>(API_ENDPOINTS.admin.features.operations.list(featureId));
    return response.data || [];
  }

  async addOperationToFeature(featureId: string, operationId: string, isDefault: boolean = false): Promise<void> {
    await apiClient.post(API_ENDPOINTS.admin.features.operations.add(featureId), { operationId, isDefault });
  }

  async removeOperationFromFeature(featureId: string, operationId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.features.operations.remove(featureId, operationId));
  }

  // Operations
  async getOperations(): Promise<Operation[]> {
    const response = await apiClient.get<Operation[]>(API_ENDPOINTS.admin.operations.list);
    return response.data || [];
  }

  async getOperation(id: string): Promise<Operation> {
    const response = await apiClient.get<Operation>(API_ENDPOINTS.admin.operations.get(id));
    if (!response.data) throw new Error("Operation not found");
    return response.data;
  }

  async createOperation(data: { name: string; slug: string; description?: string; sortOrder?: number }): Promise<Operation> {
    const response = await apiClient.post<Operation>(API_ENDPOINTS.admin.operations.create, data);
    if (!response.data) throw new Error("Failed to create operation");
    return response.data;
  }

  async updateOperation(id: string, data: Partial<Operation>): Promise<Operation> {
    const response = await apiClient.put<Operation>(API_ENDPOINTS.admin.operations.update(id), data);
    if (!response.data) throw new Error("Failed to update operation");
    return response.data;
  }

  async deleteOperation(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.operations.delete(id));
  }

  // Roles
  async getRoles(): Promise<Role[]> {
    const response = await apiClient.get<Role[]>(API_ENDPOINTS.admin.roles.list);
    return response.data || [];
  }

  async getRole(id: string): Promise<Role> {
    const response = await apiClient.get<Role>(API_ENDPOINTS.admin.roles.get(id));
    if (!response.data) throw new Error("Role not found");
    return response.data;
  }

  async createRole(data: { name: string; description?: string }): Promise<Role> {
    const response = await apiClient.post<Role>(API_ENDPOINTS.admin.roles.create, data);
    if (!response.data) throw new Error("Failed to create role");
    return response.data;
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    const response = await apiClient.put<Role>(API_ENDPOINTS.admin.roles.update(id), data);
    if (!response.data) throw new Error("Failed to update role");
    return response.data;
  }

  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.roles.delete(id));
  }

  // Role Access Control
  async getRoleModuleAccess(roleId: string): Promise<RoleModuleAccess[]> {
    const response = await apiClient.get<RoleModuleAccess[]>(API_ENDPOINTS.admin.roles.moduleAccess.list(roleId));
    return response.data || [];
  }

  async grantRoleModuleAccess(roleId: string, moduleId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.admin.roles.moduleAccess.grant(roleId), { moduleId });
  }

  async revokeRoleModuleAccess(roleId: string, moduleId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.roles.moduleAccess.revoke(roleId, moduleId));
  }

  async getRoleSubmoduleAccess(roleId: string): Promise<RoleSubmoduleAccess[]> {
    const response = await apiClient.get<RoleSubmoduleAccess[]>(API_ENDPOINTS.admin.roles.submoduleAccess.list(roleId));
    return response.data || [];
  }

  async grantRoleSubmoduleAccess(roleId: string, submoduleId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.admin.roles.submoduleAccess.grant(roleId), { submoduleId });
  }

  async revokeRoleSubmoduleAccess(roleId: string, submoduleId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.roles.submoduleAccess.revoke(roleId, submoduleId));
  }

  async getRoleFeatureAccess(roleId: string): Promise<RoleFeatureAccess[]> {
    const response = await apiClient.get<RoleFeatureAccess[]>(API_ENDPOINTS.admin.roles.featureAccess.list(roleId));
    return response.data || [];
  }

  async grantRoleFeatureAccess(roleId: string, featureId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.admin.roles.featureAccess.grant(roleId), { featureId });
  }

  async revokeRoleFeatureAccess(roleId: string, featureId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.roles.featureAccess.revoke(roleId, featureId));
  }

  async getRoleFeatureOperationAccess(roleId: string): Promise<RoleFeatureOperationAccess[]> {
    const response = await apiClient.get<RoleFeatureOperationAccess[]>(
      API_ENDPOINTS.admin.roles.featureOperationAccess.list(roleId)
    );
    return response.data || [];
  }

  async grantRoleFeatureOperationAccess(roleId: string, featureId: string, operationId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.admin.roles.featureOperationAccess.grant(roleId), { featureId, operationId });
  }

  async revokeRoleFeatureOperationAccess(roleId: string, featureId: string, operationId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.roles.featureOperationAccess.revoke(roleId, featureId, operationId));
  }

  // Hierarchical Permission Tree
  async getHierarchicalPermissionTree(): Promise<PermissionTreeModule[]> {
    const response = await apiClient.get<PermissionTreeModule[]>(API_ENDPOINTS.admin.permissions.tree);
    return response.data || [];
  }

  async getRoleHierarchicalPermissions(roleId: string): Promise<PermissionTreeModule[]> {
    const response = await apiClient.get<PermissionTreeModule[]>(API_ENDPOINTS.admin.roles.permissions.tree(roleId));
    return response.data || [];
  }

  // User Permission Management
  async getUserHierarchicalPermissions(userId: string): Promise<PermissionTreeModule[]> {
    const response = await apiClient.get<PermissionTreeModule[]>(API_ENDPOINTS.admin.users.permissions.tree(userId));
    return response.data || [];
  }

  async grantUserSubmoduleAccess(userId: string, submoduleId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.admin.users.permissions.grantSubmodule(userId), { submoduleId });
  }

  async revokeUserSubmoduleAccess(userId: string, submoduleId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.users.permissions.revokeSubmodule(userId, submoduleId));
  }

  async grantUserFeatureAccess(userId: string, featureId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.admin.users.permissions.grantFeature(userId), { featureId });
  }

  async revokeUserFeatureAccess(userId: string, featureId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.users.permissions.revokeFeature(userId, featureId));
  }

  async grantUserFeatureOperationAccess(userId: string, featureId: string, operationId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.admin.users.permissions.grantOperation(userId), { featureId, operationId });
  }

  async revokeUserFeatureOperationAccess(userId: string, featureId: string, operationId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.users.permissions.revokeOperation(userId, featureId, operationId));
  }

  // User Permission Denials (explicitly remove access even if role has it)
  async denyUserSubmoduleAccess(userId: string, submoduleId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.admin.users.permissions.denySubmodule(userId), { submoduleId });
  }

  async removeUserSubmoduleDenial(userId: string, submoduleId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.users.permissions.removeSubmoduleDenial(userId, submoduleId));
  }

  async denyUserFeatureAccess(userId: string, featureId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.admin.users.permissions.denyFeature(userId), { featureId });
  }

  async removeUserFeatureDenial(userId: string, featureId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.users.permissions.removeFeatureDenial(userId, featureId));
  }

  async denyUserFeatureOperationAccess(userId: string, featureId: string, operationId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.admin.users.permissions.denyOperation(userId), { featureId, operationId });
  }

  async removeUserFeatureOperationDenial(userId: string, featureId: string, operationId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.users.permissions.removeOperationDenial(userId, featureId, operationId));
  }
}

export const systemManagementService = new SystemManagementService();

