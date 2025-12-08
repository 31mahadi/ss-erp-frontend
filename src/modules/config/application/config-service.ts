import { API_ENDPOINTS } from "@/config/api";
import { apiClient } from "@/lib/api/api-client";
import type { Department, DepartmentListResponse, CreateDepartmentInput, UpdateDepartmentInput } from "../domain/department-schema";
import type { Position, PositionListResponse, CreatePositionInput, UpdatePositionInput } from "../domain/position-schema";

type DepartmentDropdownItem = {
  id: string;
  code: string;
  name: string;
};

type PositionDropdownItem = {
  id: string;
  code: string;
  name: string;
  department?: string;
  level?: string;
};

export class ConfigService {
  // Department methods
  async getDepartments(params?: { page?: number; limit?: number; search?: string }): Promise<DepartmentListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const url = params ? `${API_ENDPOINTS.config.departments.list}?${queryParams.toString()}` : API_ENDPOINTS.config.departments.list;
    const response = await apiClient.get<DepartmentListResponse>(url);
    return response.data || { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  async getAllDepartments(): Promise<DepartmentDropdownItem[]> {
    const response = await apiClient.get<DepartmentDropdownItem[]>(API_ENDPOINTS.config.departments.all);
    return response.data || [];
  }

  async getDepartment(id: string): Promise<Department> {
    const response = await apiClient.get<Department>(API_ENDPOINTS.config.departments.get(id));
    if (!response.data) {
      throw new Error(response.message || "Failed to fetch department");
    }
    return response.data;
  }

  async createDepartment(data: CreateDepartmentInput): Promise<Department> {
    const response = await apiClient.post<Department>(API_ENDPOINTS.config.departments.create, data);
    if (!response.data) {
      throw new Error(response.message || "Failed to create department");
    }
    return response.data;
  }

  async updateDepartment(id: string, data: UpdateDepartmentInput): Promise<Department> {
    const response = await apiClient.put<Department>(API_ENDPOINTS.config.departments.update(id), data);
    if (!response.data) {
      throw new Error(response.message || "Failed to update department");
    }
    return response.data;
  }

  async deleteDepartment(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.config.departments.delete(id));
  }

  // Position methods
  async getPositions(params?: { page?: number; limit?: number; search?: string }): Promise<PositionListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const url = params ? `${API_ENDPOINTS.config.positions.list}?${queryParams.toString()}` : API_ENDPOINTS.config.positions.list;
    const response = await apiClient.get<PositionListResponse>(url);
    return response.data || { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  async getAllPositions(): Promise<PositionDropdownItem[]> {
    const response = await apiClient.get<PositionDropdownItem[]>(API_ENDPOINTS.config.positions.all);
    return response.data || [];
  }

  async getPosition(id: string): Promise<Position> {
    const response = await apiClient.get<Position>(API_ENDPOINTS.config.positions.get(id));
    if (!response.data) {
      throw new Error(response.message || "Failed to fetch position");
    }
    return response.data;
  }

  async createPosition(data: CreatePositionInput): Promise<Position> {
    const response = await apiClient.post<Position>(API_ENDPOINTS.config.positions.create, data);
    if (!response.data) {
      throw new Error(response.message || "Failed to create position");
    }
    return response.data;
  }

  async updatePosition(id: string, data: UpdatePositionInput): Promise<Position> {
    const response = await apiClient.put<Position>(API_ENDPOINTS.config.positions.update(id), data);
    if (!response.data) {
      throw new Error(response.message || "Failed to update position");
    }
    return response.data;
  }

  async deletePosition(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.config.positions.delete(id));
  }
}

export const configService = new ConfigService();

