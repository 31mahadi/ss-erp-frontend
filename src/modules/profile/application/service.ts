import { API_ENDPOINTS } from "@/config/api";
import { apiClient } from "@/lib/api/api-client";
import type { Profile, UpdateProfileData } from "../domain/types";

export class ProfileService {
  async getProfile(): Promise<Profile> {
    const response = await apiClient.get<Profile>(API_ENDPOINTS.profile.get);
    if (!response.data) {
      throw new Error(response.message || "Failed to fetch profile");
    }
    return response.data;
  }

  async updateProfile(data: UpdateProfileData): Promise<Profile> {
    const response = await apiClient.patch<Profile>(API_ENDPOINTS.profile.update, data);
    if (!response.data) {
      throw new Error(response.message || "Failed to update profile");
    }
    return response.data;
  }
}

export const profileService = new ProfileService();
