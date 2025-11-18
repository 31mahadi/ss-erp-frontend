import { API_ENDPOINTS } from "@/config/api";
import { useAuthStore } from "@/lib/auth/auth-store";
import { useApiPatch, useApiQuery } from "@/lib/hooks/use-api";
import type { Profile, UpdateProfileData } from "../domain/types";

/**
 * Hook to get current user profile
 */
export function useProfile() {
  const { setUser } = useAuthStore();

  return useApiQuery<Profile>(API_ENDPOINTS.profile.get, {
    onSuccess: (data) => {
      setUser(data);
    },
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const { setUser } = useAuthStore();

  return useApiPatch<Profile, UpdateProfileData>(API_ENDPOINTS.profile.update, {
    invalidateQueries: [API_ENDPOINTS.profile.get],
    onSuccess: (data) => {
      setUser(data);
    },
  });
}
