import { API_ENDPOINTS } from "@/config/api";
import { apiClient } from "@/lib/api/api-client";
import type { Employee, EmployeeListResponse, CreateEmployeeInput, UpdateEmployeeInput } from "../domain/employee-schema";

type EmployeeDropdownItem = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
};

export class EmployeeService {
  async getEmployees(params?: { page?: number; limit?: number; search?: string }): Promise<EmployeeListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const url = params ? `${API_ENDPOINTS.employees.list}?${queryParams.toString()}` : API_ENDPOINTS.employees.list;
    const response = await apiClient.get<EmployeeListResponse>(url);
    return response.data || { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  async getAllEmployees(): Promise<EmployeeDropdownItem[]> {
    const response = await apiClient.get<EmployeeDropdownItem[]>(API_ENDPOINTS.employees.all);
    return response.data || [];
  }

  async getEmployee(id: string): Promise<Employee> {
    const response = await apiClient.get<Employee>(API_ENDPOINTS.employees.get(id));
    if (!response.data) {
      throw new Error(response.message || "Failed to fetch employee");
    }
    return response.data;
  }

  async createEmployee(data: CreateEmployeeInput): Promise<Employee> {
    const response = await apiClient.post<Employee>(API_ENDPOINTS.employees.create, data);
    if (!response.data) {
      throw new Error(response.message || "Failed to create employee");
    }
    return response.data;
  }

  async updateEmployee(id: string, data: UpdateEmployeeInput): Promise<Employee> {
    const response = await apiClient.put<Employee>(API_ENDPOINTS.employees.update(id), data);
    if (!response.data) {
      throw new Error(response.message || "Failed to update employee");
    }
    return response.data;
  }

  async deleteEmployee(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.employees.delete(id));
  }
}

export const employeeService = new EmployeeService();

