import { API_ENDPOINTS } from "@/config/api";
import { apiClient } from "@/lib/api/api-client";
import { useAuthStore } from "@/lib/auth/auth-store";
import type { AuthTokens, User } from "@/lib/auth/types";
import { logger } from "@/lib/logger/logger";
import { useMutation } from "@tanstack/react-query";

/**
 * Hook for login mutation
 */
export function useLogin() {
  const { login, setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        user: User;
      }>(API_ENDPOINTS.auth.login, credentials);

      if (!response.data) {
        throw new Error(response.message || "Login failed");
      }

      return response.data;
    },
    onSuccess: (data) => {
      const { accessToken, refreshToken, tokenType, user } = data;
      setTokens({ accessToken, refreshToken, tokenType });
      setUser(user);
      logger.info("User logged in successfully", { userId: user.id });
    },
    onError: (error) => {
      const apiError = error as any;
      const statusCode = apiError?.statusCode || apiError?.response?.status;
      const errorMessage = apiError?.message || "Login failed";
      
      logger.error("Login failed", error as Error, {
        statusCode,
        message: errorMessage,
        error: apiError?.error,
        details: apiError?.details,
      });
    },
  });
}

/**
 * Hook for logout mutation
 */
export function useLogout() {
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post(API_ENDPOINTS.auth.logout);
    },
    onSuccess: () => {
      logout();
    },
    onError: (error) => {
      logger.warn("Logout request failed", error as Error);
      // Still logout locally even if request fails
      logout();
    },
  });
}
