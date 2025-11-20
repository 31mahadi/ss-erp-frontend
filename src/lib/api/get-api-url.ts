/**
 * Get API base URL from environment variable
 * Ensures proper configuration and provides fallback
 * Converts 0.0.0.0 to localhost for browser compatibility
 */
export function getApiUrl(): string {
  const defaultUrl = "http://localhost:3131/api";

  if (typeof window === "undefined") {
    // Server-side: use environment variable directly
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || defaultUrl;
    // Replace 0.0.0.0 with localhost for server-side requests too
    return apiUrl.replace("0.0.0.0", "localhost");
  }

  // Client-side: use environment variable (set at build time)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    console.warn("NEXT_PUBLIC_API_URL is not set. Using default: http://localhost:3131/api");
    return defaultUrl;
  }

  // Browsers cannot connect to 0.0.0.0, replace with localhost
  const normalizedUrl = apiUrl.replace("0.0.0.0", "localhost");

  // Ensure URL doesn't end with /
  return normalizedUrl.endsWith("/") ? normalizedUrl.slice(0, -1) : normalizedUrl;
}
