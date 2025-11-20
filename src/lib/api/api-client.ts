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
   * Note: HTTP-only cookies cannot be read from JavaScript, but they are automatically
   * sent with requests when credentials: "include" is set. This method is kept for
   * reference but will return null for HTTP-only cookies (which is expected).
   */
  private getRefreshToken(): string | null {
    // HTTP-only cookies cannot be read from JavaScript
    // The refresh token cookie is HTTP-only and will be sent automatically
    // with credentials: "include" in the fetch request
    // We return null here to indicate we rely on automatic cookie sending
    return null;
  }

  /**
   * Set refresh token in HTTP-only cookie (handled by backend)
   * This is just for reference - actual cookie is set by backend
   */
  private async refreshAccessToken(): Promise<string | null> {
    // Don't try to refresh if we don't have an access token (already logged out)
    if (!this.accessToken) {
      logger.debug("Skipping token refresh - no access token (already logged out)");
      return null;
    }

    try {
      // Construct refresh endpoint URL properly
      const base = this.baseURL.endsWith("/") ? this.baseURL.slice(0, -1) : this.baseURL;
      const response = await fetch(`${base}/auth/refresh`, {
        method: "POST",
        // Don't set Content-Type - refresh token comes from HTTP-only cookie, not body
        credentials: "include", // Important: sends HTTP-only refresh token cookie automatically
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        
        // Store whether we had a token before clearing it
        const hadToken = !!this.accessToken;
        
        // If refresh token is missing (401), we're already logged out - don't log as error
        if (response.status === 401) {
          logger.debug("Token refresh failed - refresh token missing (already logged out)", {
            status: response.status,
            error: errorText,
          });
        } else {
          logger.error("Token refresh failed", new Error(`Status: ${response.status}, ${errorText}`));
        }
        
        // If refresh fails, clear the stored token
        this.setAccessToken(null);
        // Only emit logout if we had a token (to avoid duplicate logout events)
        if (hadToken) {
          eventBus.emit(EVENTS.AUTH_LOGOUT);
        }
        return null;
      }

      // Try to get token from response header first (preferred)
      const accessTokenFromHeader = response.headers.get("x-access-token");
      if (accessTokenFromHeader) {
        this.setAccessToken(accessTokenFromHeader);
        eventBus.emit(EVENTS.AUTH_TOKEN_REFRESHED, { accessToken: accessTokenFromHeader });
        return accessTokenFromHeader;
      }

      // Fallback to response body
      const data: ApiResponse<{ accessToken: string; refreshToken: string }> =
        await response.json();

      if (data.data?.accessToken) {
        this.setAccessToken(data.data.accessToken);
        eventBus.emit(EVENTS.AUTH_TOKEN_REFRESHED, data.data);
        return data.data.accessToken;
      }

      logger.warn("Token refresh response missing access token");
      return null;
    } catch (error) {
      // Check if error is about missing refresh token (401) - this is expected after logout
      const isMissingTokenError = error instanceof Error && 
        (error.message.includes('401') || error.message.includes('Refresh token is required'));
      
      if (isMissingTokenError) {
        logger.debug("Token refresh failed - refresh token missing (already logged out)", {
          error: error instanceof Error ? error.message : String(error),
        });
      } else {
        logger.error("Failed to refresh access token", error as Error);
      }
      
      // Store whether we had a token before clearing it
      const hadToken = !!this.accessToken;
      // Clear token on error
      this.setAccessToken(null);
      // Only emit logout if we had a token (to avoid duplicate logout events)
      if (hadToken) {
        eventBus.emit(EVENTS.AUTH_LOGOUT);
      }
      return null;
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    // Auth endpoints (login, logout, refresh) should NOT retry on failure
    const isAuthEndpoint = endpoint.includes('/auth/login') || 
                          endpoint.includes('/auth/logout') || 
                          endpoint.includes('/auth/refresh');
    
    const {
      timeout = this.timeout,
      retry = isAuthEndpoint 
        ? { attempts: 0, delay: 0 } // No retries for auth endpoints
        : {
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
    // Only set Content-Type if there's a body
    if (fetchConfig.body) {
      headers.set("Content-Type", "application/json");
    }

    let controller = new AbortController();
    let timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: Error | null = null;
    let tokenRefreshed = false;

    for (let attempt = 0; attempt <= retry.attempts; attempt++) {
      try {
        // If token was refreshed, create new AbortController for retry
        if (tokenRefreshed && attempt > 0) {
          controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), timeout);
        }

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

        // Handle 401 Unauthorized - try to refresh token (only on first attempt)
        // Only try to refresh if we have an access token (not already logged out)
        if (response.status === 401 && attempt === 0 && !tokenRefreshed && this.accessToken) {
          logger.info("Access token expired, attempting refresh", { endpoint });
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            headers.set("Authorization", `Bearer ${newToken}`);
            tokenRefreshed = true;
            // Small delay before retry to ensure token is set
            await new Promise((resolve) => setTimeout(resolve, 50));
            continue; // Retry with new token
          } else {
            // Refresh failed - check if we're already logged out
            if (!this.accessToken) {
              // Already logged out - don't emit logout event again
              logger.debug("Token refresh failed - already logged out");
            } else {
              // Refresh failed but we still have a token - logout user
              logger.warn("Token refresh failed, logging out user");
              eventBus.emit(EVENTS.AUTH_LOGOUT);
            }
            const error: ApiError = {
              message: "Session expired. Please login again.",
              statusCode: 401,
              error: "Unauthorized",
            };
            throw error;
          }
        }

        // Only parse JSON if response is ok or we're not retrying
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const error: ApiError = {
            message: data.message || "Request failed",
            statusCode: response.status,
            error: data.error,
            details: data,
          };

          // Don't retry on client errors (4xx) except 401 (which is handled above)
          // Auth endpoints should never retry
          if (response.status >= 400 && response.status < 500 && response.status !== 401) {
            throw error;
          }

          // Don't retry auth endpoints - they should never retry
          if (isAuthEndpoint) {
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

        // Network error - retry (but not for auth endpoints)
        if (attempt < retry.attempts && !(error instanceof Error && "statusCode" in error) && !isAuthEndpoint) {
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
