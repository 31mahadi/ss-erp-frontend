"use client";

import * as React from "react";
import { logger } from "@/lib/logger/logger";
import { apiClient } from "@/lib/api/api-client";
import { useAuthStore } from "./auth-store";

/**
 * Initialize auth state on app load
 * This component should be mounted once in the app
 * Token refresh is handled automatically by the API client on 401 errors
 */
export function AuthInit({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuthStore();
  const [isInitialized, setIsInitialized] = React.useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on mount to initialize auth
  React.useEffect(() => {
    async function initializeAuth() {
      // If user is persisted, try to refresh user data to ensure it's up to date
      // The API client will handle token refresh automatically if needed
      if (user) {
        try {
          // First, check if we have a valid token
          const currentToken = apiClient.getAccessToken();
          
          if (!currentToken) {
            // No token, try to refresh using the refresh token cookie
            logger.info("No access token on page load, attempting refresh");
            try {
              const newToken = await apiClient.refreshAccessToken();
              if (!newToken) {
                logger.warn("Token refresh on page load failed - no token returned");
                // Will be handled by refreshUser below
              }
            } catch (refreshError) {
              logger.warn("Token refresh on page load failed", refreshError as Error);
              // Continue to try refreshUser - it will handle the 401
            }
          }
          
          // Now try to refresh user data
          await refreshUser();
        } catch (error) {
          // If refresh fails, user will be logged out automatically by refreshUser
          logger.error("Auth initialization failed", error as Error);
        }
      }
      setIsInitialized(true);
    }

    initializeAuth();
  }, []); // Only run once on mount

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Initializing...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
