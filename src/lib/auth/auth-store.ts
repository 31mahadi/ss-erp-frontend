import { API_ENDPOINTS } from "@/config/api";
import { apiClient } from "@/lib/api/api-client";
import { useAccessStore } from "@/lib/access/access-store";
import { EVENTS, eventBus } from "@/lib/event-bus/event-bus";
import { logger } from "@/lib/logger/logger";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, AuthTokens, User } from "./types";

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => {
      // Initialize API client with persisted token if available
      if (typeof window !== "undefined") {
        // Try to restore access token from a separate storage (since we don't persist it in zustand)
        // This is a fallback - the refresh token cookie should handle most cases
        const tokenStorage = localStorage.getItem("auth-token");
        if (tokenStorage) {
          try {
            const { accessToken, expiresAt } = JSON.parse(tokenStorage);
            // Only restore if token hasn't expired (with 5 minute buffer)
            if (accessToken && expiresAt && Date.now() < expiresAt - 5 * 60000) {
              apiClient.setAccessToken(accessToken);
            } else {
              // Token expired, clear it
              localStorage.removeItem("auth-token");
            }
          } catch {
            // Ignore parse errors
            localStorage.removeItem("auth-token");
          }
        }

        // Listen for token refresh events to keep auth state in sync
        eventBus.on(EVENTS.AUTH_TOKEN_REFRESHED, async (data: { accessToken: string }) => {
          // Token is automatically set in API client
          logger.info("Access token refreshed successfully");
          // Refresh user data to get updated permissions
          // This ensures access store is updated when permissions change
          // Use setTimeout to avoid race conditions with the current request
          setTimeout(async () => {
            try {
              await get().refreshUser();
            } catch (error) {
              logger.warn("Failed to refresh user data after token refresh", error as Error);
              // Don't throw - token refresh succeeded, just user data refresh failed
            }
          }, 100);
        });

        // Listen for logout events to clear state (but don't call logout API again)
        eventBus.on(EVENTS.AUTH_LOGOUT, () => {
          // Just clear local state, don't call logout API (which would cause infinite loop)
          apiClient.setAccessToken(null);
          localStorage.removeItem("auth-token");
          set({ user: null, isAuthenticated: false });
          useAccessStore.getState().setAccess(null);
        });
      }

      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,

        setUser: (user: User | null) => {
          set({ user, isAuthenticated: !!user });
          // Sync access info to access store
          if (user?.access) {
            useAccessStore.getState().setAccess(user.access);
          } else {
            useAccessStore.getState().setAccess(null);
          }
          if (user) {
            eventBus.emit(EVENTS.AUTH_LOGIN, user);
          }
        },

        setTokens: (tokens: AuthTokens) => {
          apiClient.setAccessToken(tokens.accessToken);
          // Store access token temporarily for page refresh recovery
          // Decode JWT to get expiration time
          try {
            if (tokens.accessToken) {
              const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
              const expiresAt = payload.exp ? payload.exp * 1000 : Date.now() + 15 * 60000; // Default 15 min if no exp
              localStorage.setItem("auth-token", JSON.stringify({
                accessToken: tokens.accessToken,
                expiresAt,
              }));
            }
          } catch (error) {
            // If we can't decode, don't store it
            logger.warn("Could not decode token for storage", error as Error);
          }
          // Refresh token is stored in HTTP-only cookie by backend
        },

        login: async (email: string, password: string) => {
          set({ isLoading: true });
          try {
            const response = await apiClient.post<{
              accessToken: string;
              refreshToken: string;
              tokenType: string;
              user: User;
            }>(API_ENDPOINTS.auth.login, { email, password });

            if (response.data) {
              const { accessToken, refreshToken, tokenType, user } = response.data;

              get().setTokens({ accessToken, refreshToken, tokenType });
              get().setUser(user);

              logger.info("User logged in successfully", { userId: user.id });
            } else {
              throw new Error(response.message || "Login failed");
            }
          } catch (error) {
            logger.error("Login failed", error as Error, { email });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        logout: async () => {
          // Prevent multiple simultaneous logout calls
          const currentState = get();
          if (!currentState.isAuthenticated && !currentState.user) {
            // Already logged out, skip
            return;
          }

          try {
            await apiClient.post(API_ENDPOINTS.auth.logout);
          } catch (error) {
            logger.warn("Logout request failed", error as Error);
          } finally {
            apiClient.setAccessToken(null);
            set({ user: null, isAuthenticated: false });
            useAccessStore.getState().setAccess(null);
            // Only emit logout event if we were actually logged in
            if (currentState.isAuthenticated || currentState.user) {
              eventBus.emit(EVENTS.AUTH_LOGOUT);
            }
            logger.info("User logged out");
          }
        },

        refreshUser: async () => {
          set({ isLoading: true });
          try {
            const response = await apiClient.get<User>(API_ENDPOINTS.profile.get);
            if (response.data) {
              get().setUser(response.data);
            }
          } catch (error) {
            logger.error("Failed to refresh user data", error as Error);
            // Don't logout on refresh failure - token might still be valid
            // Only logout if we get a 401 (unauthorized)
            const apiError = error as any;
            if (apiError?.statusCode === 401) {
              // Token is invalid, logout
              get().logout();
            }
            // Otherwise, just log the error but don't logout
          } finally {
            set({ isLoading: false });
          }
        },
      };
    },
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
