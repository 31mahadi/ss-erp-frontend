"use client";

import * as React from "react";
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
      // If user is persisted, refresh user data to ensure it's up to date
      // The API client will handle token refresh automatically if needed
      if (user) {
        try {
          await refreshUser();
        } catch (error) {
          // If refresh fails, user will be logged out automatically by refreshUser
          console.error("Auth initialization failed:", error);
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
