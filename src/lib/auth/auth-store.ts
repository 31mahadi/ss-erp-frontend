import { API_ENDPOINTS } from "@/config/api";
import { apiClient } from "@/lib/api/api-client";
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
        const persistedState = localStorage.getItem("auth-storage");
        if (persistedState) {
          try {
            const parsed = JSON.parse(persistedState);
            if (parsed.state?.user) {
              // Token will be refreshed on app init
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,

        setUser: (user: User | null) => {
          set({ user, isAuthenticated: !!user });
          if (user) {
            eventBus.emit(EVENTS.AUTH_LOGIN, user);
          }
        },

        setTokens: (tokens: AuthTokens) => {
          apiClient.setAccessToken(tokens.accessToken);
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
          try {
            await apiClient.post(API_ENDPOINTS.auth.logout);
          } catch (error) {
            logger.warn("Logout request failed", error as Error);
          } finally {
            apiClient.setAccessToken(null);
            set({ user: null, isAuthenticated: false });
            eventBus.emit(EVENTS.AUTH_LOGOUT);
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
            // If refresh fails, user might be logged out
            get().logout();
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
