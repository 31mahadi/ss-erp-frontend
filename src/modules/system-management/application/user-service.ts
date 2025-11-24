import { API_ENDPOINTS } from "@/config/api";
import { apiClient } from "@/lib/api/api-client";
import type { User, UserListResponse, CreateUserInput, UpdateUserInput, UpdateUserPasswordInput } from "../domain/user-schema";

export class UserService {
  async getUsers(params?: { page?: number; limit?: number; search?: string }): Promise<UserListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const url = params ? `${API_ENDPOINTS.users.list}?${queryParams.toString()}` : API_ENDPOINTS.users.list;
    const response = await apiClient.get<UserListResponse>(url);
    return response.data || { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  async getUser(id: string): Promise<User> {
    const response = await apiClient.get<User>(API_ENDPOINTS.users.get(id));
    if (!response.data) throw new Error("User not found");
    return response.data;
  }

  async createUser(data: CreateUserInput): Promise<User> {
    // API client throws errors directly, so we just need to return the data
    const response = await apiClient.post<User>(API_ENDPOINTS.users.create, data);
    if (!response.data) {
      // This should rarely happen, but handle it just in case
      const errorMessage = response.message || "Failed to create user";
      const error: any = new Error(errorMessage);
      error.statusCode = response.statusCode;
      error.details = response;
      throw error;
    }
    return response.data;
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    const response = await apiClient.put<User>(API_ENDPOINTS.users.update(id), data);
    if (!response.data) {
      // If no data, throw error with message from response
      const errorMessage = response.message || "Failed to update user";
      const error: any = new Error(errorMessage);
      error.statusCode = response.statusCode;
      error.details = response;
      throw error;
    }
    return response.data;
  }

  async updateUserPassword(id: string, data: UpdateUserPasswordInput): Promise<void> {
    await apiClient.put(API_ENDPOINTS.users.updatePassword(id), data);
  }

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.users.delete(id));
  }
}

export const userService = new UserService();

