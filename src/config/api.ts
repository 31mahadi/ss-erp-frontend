import { getApiUrl } from "@/lib/api/get-api-url";

export const API_CONFIG = {
  baseURL: getApiUrl(),
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    validateAccessToken: "/auth/validate/access-token",
    validateRefreshToken: "/auth/validate/refresh-token",
    sessions: "/auth/sessions",
    revokeSession: (sessionId: string) => `/auth/sessions/${sessionId}`,
    revokeAllSessions: "/auth/sessions",
  },
  profile: {
    get: "/profile",
    update: "/profile",
  },
  users: {
    list: "/users",
    get: (id: string) => `/users/${id}`,
    create: "/users",
    update: (id: string) => `/users/${id}`,
    updatePassword: (id: string) => `/users/${id}/password`,
    delete: (id: string) => `/users/${id}`,
  },
  admin: {
    modules: {
      list: "/admin/modules",
      get: (id: string) => `/admin/modules/${id}`,
      create: "/admin/modules",
      update: (id: string) => `/admin/modules/${id}`,
      delete: (id: string) => `/admin/modules/${id}`,
    },
    views: {
      list: "/admin/views",
      get: (id: string) => `/admin/views/${id}`,
      create: "/admin/views",
      update: (id: string) => `/admin/views/${id}`,
      delete: (id: string) => `/admin/views/${id}`,
      addPermission: (id: string) => `/admin/views/${id}/permissions`,
      removePermission: (id: string, permissionSlug: string) =>
        `/admin/views/${id}/permissions/${permissionSlug}`,
    },
    roles: {
      list: "/admin/roles",
      get: (id: string) => `/admin/roles/${id}`,
      create: "/admin/roles",
      update: (id: string) => `/admin/roles/${id}`,
      delete: (id: string) => `/admin/roles/${id}`,
      moduleAccess: {
        list: (id: string) => `/admin/roles/${id}/module-access`,
        grant: (id: string) => `/admin/roles/${id}/module-access`,
        revoke: (id: string, moduleId: string) => `/admin/roles/${id}/module-access/${moduleId}`,
      },
      viewAccess: {
        list: (id: string) => `/admin/roles/${id}/view-access`,
        grant: (id: string) => `/admin/roles/${id}/view-access`,
        revoke: (id: string, viewId: string) => `/admin/roles/${id}/view-access/${viewId}`,
      },
    },
  },
} as const;
