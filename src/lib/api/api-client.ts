import { API_CONFIG } from "@/config/api";
import { EVENTS, eventBus } from "@/lib/event-bus/event-bus";
import { logger } from "@/lib/logger/logger";
import type { ApiError, ApiResponse, RequestConfig } from "./types";

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private accessToken: string | null = null;
  private tokenExpiryTime: number | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.startProactiveRefresh();
  }

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(token: string | null): void {
    this.accessToken = token;
    if (token) {
      // Decode JWT to get expiration time (without verification, just for timing)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp) {
          // Set expiry time (in milliseconds)
          this.tokenExpiryTime = payload.exp * 1000;
          // Schedule proactive refresh 1 minute before expiration
          this.scheduleProactiveRefresh();
        }
      } catch (error) {
        // If we can't decode the token, don't schedule refresh
        logger.warn("Could not decode token for expiry time", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      this.tokenExpiryTime = null;
      this.cancelProactiveRefresh();
    }
  }

  /**
   * Schedule proactive token refresh before expiration
   */
  private scheduleProactiveRefresh(): void {
    this.cancelProactiveRefresh();
    
    if (!this.tokenExpiryTime || !this.accessToken) {
      return;
    }

    const now = Date.now();
    const timeUntilExpiry = this.tokenExpiryTime - now;
    
    // If token already expired or expires in less than 30 seconds, refresh immediately
    if (timeUntilExpiry <= 30000) {
      logger.info("Token expired or expiring very soon, refreshing immediately");
      this.refreshAccessToken().catch((error) => {
        logger.debug("Immediate token refresh failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
      return;
    }
    
    // Refresh 2 minutes before expiration to give plenty of buffer
    const refreshTime = Math.max(30000, timeUntilExpiry - 2 * 60000);

    logger.debug("Scheduling proactive token refresh", {
      timeUntilExpiry: `${Math.round(timeUntilExpiry / 1000)}s`,
      refreshIn: `${Math.round(refreshTime / 1000)}s`,
    });

    this.refreshTimer = setTimeout(() => {
      logger.info("Proactively refreshing token before expiration");
      this.refreshAccessToken().catch((error) => {
        // Only log network errors as debug, not as warnings
        const isNetworkError = error instanceof TypeError && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('Network request failed') ||
           error.message.includes('Load failed'));
        
        const errorContext = {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          } : String(error),
        };
        
        if (isNetworkError) {
          logger.debug("Proactive token refresh failed - network error (may be temporary)", errorContext);
        } else {
          logger.warn("Proactive token refresh failed", errorContext);
        }
      });
    }, refreshTime);
  }

  /**
   * Cancel scheduled proactive refresh
   */
  private cancelProactiveRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Start proactive refresh mechanism
   */
  private startProactiveRefresh(): void {
    // Check token expiry every 15 seconds for more responsive refresh
    setInterval(() => {
      if (this.tokenExpiryTime && this.accessToken) {
        const now = Date.now();
        const timeUntilExpiry = this.tokenExpiryTime - now;
        
        // If token already expired, clear it (don't try to use expired tokens)
        if (timeUntilExpiry <= 0) {
          logger.warn("Token has expired, clearing and will refresh on next request");
          // Don't clear the token here - let the 401 handler deal with it
          // This avoids race conditions with in-flight requests
          return;
        }
        
        // If token expires in less than 3 minutes, refresh it proactively
        // This gives us a buffer to handle network delays and multiple refreshes
        if (timeUntilExpiry < 3 * 60000) {
          // Only refresh if we're not already refreshing
          if (!this.refreshPromise) {
            logger.info("Token expiring soon, refreshing proactively", {
              timeUntilExpiry: `${Math.round(timeUntilExpiry / 1000)}s`,
            });
            this.refreshAccessToken().catch((error) => {
              // Only log network errors as debug, not as warnings
              const isNetworkError = error instanceof TypeError && 
                (error.message.includes('Failed to fetch') || 
                 error.message.includes('NetworkError') ||
                 error.message.includes('Network request failed') ||
                 error.message.includes('Load failed'));
              
              const errorContext = {
                error: error instanceof Error ? {
                  message: error.message,
                  stack: error.stack,
                  name: error.name,
                } : String(error),
              };
              
              if (isNetworkError) {
                logger.debug("Proactive token refresh failed - network error (may be temporary)", errorContext);
              } else {
                logger.warn("Proactive token refresh failed", errorContext);
              }
            });
          }
        }
      }
    }, 15000); // Check every 15 seconds
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
  async refreshAccessToken(): Promise<string | null> {
    // Don't try to refresh if we don't have an access token (already logged out)
    if (!this.accessToken) {
      logger.debug("Skipping token refresh - no access token (already logged out)");
      return null;
    }

    // If a refresh is already in progress, wait for it instead of starting a new one
    if (this.refreshPromise) {
      logger.debug("Token refresh already in progress, waiting...");
      return this.refreshPromise;
    }

    // Create a new refresh promise
    this.refreshPromise = (async () => {
      try {
        // Construct refresh endpoint URL properly
        const base = this.baseURL.endsWith("/") ? this.baseURL.slice(0, -1) : this.baseURL;
        const response = await fetch(`${base}/auth/refresh`, {
          method: "POST",
          // Don't set Content-Type - refresh token comes from HTTP-only cookie, not body
          credentials: "include", // Important: sends HTTP-only refresh token cookie automatically
          headers: {
            // Don't send Authorization header for refresh endpoint
          },
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          
          // Store whether we had a token before clearing it
          const hadToken = !!this.accessToken;
          
          // If refresh token is missing (401), we're already logged out - don't log as error
          if (response.status === 401) {
            logger.warn("Token refresh failed - refresh token missing or expired", {
              status: response.status,
              error: errorText,
              hadToken,
            });
          } else {
            logger.error("Token refresh failed", new Error(`Status: ${response.status}, ${errorText}`), {
              status: response.status,
              error: errorText,
              hadToken,
            });
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
          logger.info("Token refreshed successfully from header");
          this.setAccessToken(accessTokenFromHeader);
          eventBus.emit(EVENTS.AUTH_TOKEN_REFRESHED, { accessToken: accessTokenFromHeader });
          return accessTokenFromHeader;
        }

        // Fallback to response body
        const data: ApiResponse<{ accessToken: string; refreshToken: string }> =
          await response.json();

        if (data.data?.accessToken) {
          logger.info("Token refreshed successfully from body");
          this.setAccessToken(data.data.accessToken);
          eventBus.emit(EVENTS.AUTH_TOKEN_REFRESHED, data.data);
          return data.data.accessToken;
        }

        logger.warn("Token refresh response missing access token", { responseData: data });
        return null;
      } catch (error) {
        // Check if error is about missing refresh token (401) - this is expected after logout
        const isMissingTokenError = error instanceof Error && 
          (error.message.includes('401') || error.message.includes('Refresh token is required'));
        
        // Check if it's a network error (Failed to fetch, CORS, etc.)
        const isNetworkError = error instanceof TypeError && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('Network request failed') ||
           error.message.includes('Load failed'));
        
        if (isMissingTokenError) {
          logger.debug("Token refresh failed - refresh token missing (already logged out)", {
            error: error instanceof Error ? error.message : String(error),
          });
        } else if (isNetworkError) {
          // Network errors are usually temporary - don't log as error, just debug
          // Don't logout user on network errors as they might be temporary
          logger.debug("Token refresh failed - network error (may be temporary)", {
            error: error instanceof Error ? error.message : String(error),
          });
          // Don't clear token or logout on network errors - let the user retry
          return null;
        } else {
          logger.error("Failed to refresh access token", error as Error);
        }
        
        // Only clear token and logout if it's not a network error
        if (!isNetworkError) {
          // Store whether we had a token before clearing it
          const hadToken = !!this.accessToken;
          // Clear token on error
          this.setAccessToken(null);
          // Only emit logout if we had a token (to avoid duplicate logout events)
          if (hadToken) {
            eventBus.emit(EVENTS.AUTH_LOGOUT);
          }
        }
        return null;
      } finally {
        // Clear the refresh promise so new refreshes can be initiated
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
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
          logger.info("Access token expired, attempting refresh", { endpoint, hasToken: !!this.accessToken });
          
          // Wait for any ongoing refresh to complete
          const newToken = await this.refreshAccessToken();
          
          if (newToken) {
            // Token is already set by refreshAccessToken, just update headers
            headers.set("Authorization", `Bearer ${newToken}`);
            tokenRefreshed = true;
            logger.debug("Token refreshed successfully, retrying request", { endpoint, hasNewToken: !!newToken });
            // Small delay before retry to ensure token is set and any other concurrent requests can use the new token
            await new Promise((resolve) => setTimeout(resolve, 100));
            continue; // Retry with new token
          } else {
            // Refresh failed - check if we're already logged out
            if (!this.accessToken) {
              // Already logged out - don't emit logout event again
              logger.debug("Token refresh failed - already logged out");
            } else {
              // Refresh failed but we still have a token - logout user immediately
              logger.warn("Token refresh failed, logging out user", { endpoint });
              this.setAccessToken(null);
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
        
        // If we get 401 after refresh attempt, don't retry - logout immediately
        if (response.status === 401 && (attempt > 0 || tokenRefreshed || !this.accessToken)) {
          logger.warn("401 error after refresh attempt or no token - logging out", { endpoint, attempt, tokenRefreshed, hasToken: !!this.accessToken });
          if (this.accessToken) {
            this.setAccessToken(null);
            eventBus.emit(EVENTS.AUTH_LOGOUT);
          }
          const error: ApiError = {
            message: "Session expired. Please login again.",
            statusCode: 401,
            error: "Unauthorized",
          };
          throw error;
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
