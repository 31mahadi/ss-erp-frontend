import { API_CONFIG } from "@/config/api";
import { EVENTS, eventBus } from "@/lib/event-bus/event-bus";
import { logger } from "@/lib/logger/logger";
import type { ApiError, ApiResponse, RequestConfig } from "./types";

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private accessToken: string | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
  }

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get refresh token from cookie
   */
  private getRefreshToken(): string | null {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie.split(";");
    const refreshTokenCookie = cookies.find((cookie) => cookie.trim().startsWith("refreshToken="));
    return refreshTokenCookie ? decodeURIComponent(refreshTokenCookie.split("=")[1]) : null;
  }

  /**
   * Set refresh token in HTTP-only cookie (handled by backend)
   * This is just for reference - actual cookie is set by backend
   */
  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      // Construct refresh endpoint URL properly
      const base = this.baseURL.endsWith("/") ? this.baseURL.slice(0, -1) : this.baseURL;
      const response = await fetch(`${base}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data: ApiResponse<{ accessToken: string; refreshToken: string }> =
        await response.json();

      if (data.data?.accessToken) {
        this.setAccessToken(data.data.accessToken);
        eventBus.emit(EVENTS.AUTH_TOKEN_REFRESHED, data.data);
        return data.data.accessToken;
      }

      return null;
    } catch (error) {
      logger.error("Failed to refresh access token", error as Error);
      return null;
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const {
      timeout = this.timeout,
      retry = {
        attempts: API_CONFIG.retryAttempts,
        delay: API_CONFIG.retryDelay,
      },
      ...fetchConfig
    } = config;

    // Ensure proper URL construction
    let url: string;
    if (endpoint.startsWith("http")) {
      url = endpoint;
    } else {
      // Ensure baseURL doesn't end with / and endpoint starts with /
      const base = this.baseURL.endsWith("/") ? this.baseURL.slice(0, -1) : this.baseURL;
      const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
      url = `${base}${path}`;
    }

    // Add authorization header if token exists
    const headers = new Headers(fetchConfig.headers);
    if (this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }
    headers.set("Content-Type", "application/json");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retry.attempts; attempt++) {
      try {
        const startTime = Date.now();
        const response = await fetch(url, {
          ...fetchConfig,
          headers,
          signal: controller.signal,
          credentials: "include", // Important for cookies
        });

        clearTimeout(timeoutId);

        const duration = Date.now() - startTime;
        if (duration > 5000) {
          logger.warn("Slow API request", {
            endpoint,
            duration: `${duration}ms`,
          });
        }

        // Handle 401 Unauthorized - try to refresh token
        if (response.status === 401 && attempt === 0) {
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            headers.set("Authorization", `Bearer ${newToken}`);
            continue; // Retry with new token
          }
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const error: ApiError = {
            message: data.message || "Request failed",
            statusCode: response.status,
            error: data.error,
            details: data,
          };

          // Don't retry on client errors (4xx) except 401
          if (response.status >= 400 && response.status < 500 && response.status !== 401) {
            throw error;
          }

          // Retry on server errors (5xx) or network errors
          if (attempt < retry.attempts) {
            await new Promise((resolve) => setTimeout(resolve, retry.delay * (attempt + 1)));
            lastError = error as unknown as Error;
            continue;
          }

          throw error;
        }

        return data as ApiResponse<T>;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Request timeout");
        }

        // Network error - retry
        if (attempt < retry.attempts && !(error instanceof Error && "statusCode" in error)) {
          await new Promise((resolve) => setTimeout(resolve, retry.delay * (attempt + 1)));
          lastError = error as Error;
          continue;
        }

        throw error;
      }
    }

    throw lastError || new Error("Request failed after retries");
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
