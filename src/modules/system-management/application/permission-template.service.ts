import { apiClient } from "@/lib/api/api-client";

export interface PermissionTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  permissions: string[];
  isActive: boolean;
  isSystemTemplate: boolean;
  metadata?: {
    createdBy?: string;
    lastModifiedBy?: string;
    usageCount?: number;
    tags?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  category?: string;
  permissions: string[];
  tags?: string[];
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  category?: string;
  permissions?: string[];
  tags?: string[];
}

export interface ApplyTemplateResult {
  applied?: string[];
  added?: string[];
  skipped: string[];
  errors: string[];
}

export interface CompareTemplatesResult {
  onlyInFirst: string[];
  onlyInSecond: string[];
  inBoth: string[];
}

class PermissionTemplateService {
  private readonly basePath = "/api/v2/permissions/templates";

  async getAll(options?: { category?: string; activeOnly?: boolean }): Promise<PermissionTemplate[]> {
    const params = new URLSearchParams();
    if (options?.category) params.append("category", options.category);
    if (options?.activeOnly !== undefined) params.append("activeOnly", String(options.activeOnly));
    
    const queryString = params.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;
    
    const response = await apiClient.get<PermissionTemplate[]>(url);
    return response.data ?? [];
  }

  async getById(id: string): Promise<PermissionTemplate> {
    const response = await apiClient.get<PermissionTemplate>(`${this.basePath}/${id}`);
    if (!response.data) throw new Error("Template not found");
    return response.data;
  }

  async getCategories(): Promise<string[]> {
    const response = await apiClient.get<string[]>(`${this.basePath}/categories`);
    return response.data ?? [];
  }

  async create(data: CreateTemplateDto): Promise<PermissionTemplate> {
    const response = await apiClient.post<PermissionTemplate>(this.basePath, data);
    if (!response.data) throw new Error("Failed to create template");
    return response.data;
  }

  async update(id: string, data: UpdateTemplateDto): Promise<PermissionTemplate> {
    const response = await apiClient.put<PermissionTemplate>(`${this.basePath}/${id}`, data);
    if (!response.data) throw new Error("Failed to update template");
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async applyToRole(templateId: string, roleId: string): Promise<ApplyTemplateResult> {
    const response = await apiClient.post<ApplyTemplateResult>(
      `${this.basePath}/${templateId}/apply/role/${roleId}`
    );
    return response.data ?? { skipped: [], errors: [] };
  }

  async applyToUser(templateId: string, userId: string): Promise<ApplyTemplateResult> {
    const response = await apiClient.post<ApplyTemplateResult>(
      `${this.basePath}/${templateId}/apply/user/${userId}`
    );
    return response.data ?? { skipped: [], errors: [] };
  }

  async createFromRole(
    roleId: string,
    data: { name: string; description?: string; category?: string; tags?: string[] }
  ): Promise<PermissionTemplate> {
    const response = await apiClient.post<PermissionTemplate>(
      `${this.basePath}/from-role/${roleId}`,
      data
    );
    if (!response.data) throw new Error("Failed to create template from role");
    return response.data;
  }

  async createFromUser(
    userId: string,
    data: { name: string; description?: string; category?: string; tags?: string[] }
  ): Promise<PermissionTemplate> {
    const response = await apiClient.post<PermissionTemplate>(
      `${this.basePath}/from-user/${userId}`,
      data
    );
    if (!response.data) throw new Error("Failed to create template from user");
    return response.data;
  }

  async clone(templateId: string, newName: string): Promise<PermissionTemplate> {
    const response = await apiClient.post<PermissionTemplate>(
      `${this.basePath}/${templateId}/clone`,
      { newName }
    );
    if (!response.data) throw new Error("Failed to clone template");
    return response.data;
  }

  async compare(templateId1: string, templateId2: string): Promise<CompareTemplatesResult> {
    const response = await apiClient.get<CompareTemplatesResult>(
      `${this.basePath}/compare/${templateId1}/${templateId2}`
    );
    return response.data ?? { onlyInFirst: [], onlyInSecond: [], inBoth: [] };
  }
}

export const permissionTemplateService = new PermissionTemplateService();
