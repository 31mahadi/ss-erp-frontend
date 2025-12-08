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
  employees: {
    list: "/employees",
    all: "/employees/all",
    get: (id: string) => `/employees/${id}`,
    create: "/employees",
    update: (id: string) => `/employees/${id}`,
    delete: (id: string) => `/employees/${id}`,
  },
  config: {
    departments: {
      list: "/config/departments",
      all: "/config/departments/all",
      get: (id: string) => `/config/departments/${id}`,
      create: "/config/departments",
      update: (id: string) => `/config/departments/${id}`,
      delete: (id: string) => `/config/departments/${id}`,
    },
    positions: {
      list: "/config/positions",
      all: "/config/positions/all",
      get: (id: string) => `/config/positions/${id}`,
      create: "/config/positions",
      update: (id: string) => `/config/positions/${id}`,
      delete: (id: string) => `/config/positions/${id}`,
    },
  },
  admin: {
    modules: {
      list: "/admin/modules",
      get: (id: string) => `/admin/modules/${id}`,
      create: "/admin/modules",
      update: (id: string) => `/admin/modules/${id}`,
      delete: (id: string) => `/admin/modules/${id}`,
    },
    submodules: {
      list: "/admin/submodules",
      get: (id: string) => `/admin/submodules/${id}`,
      create: "/admin/submodules",
      update: (id: string) => `/admin/submodules/${id}`,
      delete: (id: string) => `/admin/submodules/${id}`,
    },
    features: {
      list: "/admin/features",
      get: (id: string) => `/admin/features/${id}`,
      create: "/admin/features",
      update: (id: string) => `/admin/features/${id}`,
      delete: (id: string) => `/admin/features/${id}`,
      operations: {
        list: (id: string) => `/admin/features/${id}/operations`,
        add: (id: string) => `/admin/features/${id}/operations`,
        remove: (id: string, operationId: string) => `/admin/features/${id}/operations/${operationId}`,
      },
    },
    operations: {
      list: "/admin/operations",
      get: (id: string) => `/admin/operations/${id}`,
      create: "/admin/operations",
      update: (id: string) => `/admin/operations/${id}`,
      delete: (id: string) => `/admin/operations/${id}`,
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
      submoduleAccess: {
        list: (id: string) => `/admin/roles/${id}/submodule-access`,
        grant: (id: string) => `/admin/roles/${id}/submodule-access`,
        revoke: (id: string, submoduleId: string) => `/admin/roles/${id}/submodule-access/${submoduleId}`,
      },
      featureAccess: {
        list: (id: string) => `/admin/roles/${id}/feature-access`,
        grant: (id: string) => `/admin/roles/${id}/feature-access`,
        revoke: (id: string, featureId: string) => `/admin/roles/${id}/feature-access/${featureId}`,
      },
      featureOperationAccess: {
        list: (id: string) => `/admin/roles/${id}/feature-operation-access`,
        grant: (id: string) => `/admin/roles/${id}/feature-operation-access`,
        revoke: (id: string, featureId: string, operationId: string) =>
          `/admin/roles/${id}/feature-operation-access/${featureId}/${operationId}`,
      },
      permissions: {
        tree: (id: string) => `/admin/roles/${id}/permissions/tree`,
      },
    },
    permissions: {
      tree: "/admin/permissions/tree",
    },
    users: {
      permissions: {
        tree: (id: string) => `/admin/users/${id}/permissions/tree`,
        grantSubmodule: (id: string) => `/admin/users/${id}/submodule-access`,
        revokeSubmodule: (id: string, submoduleId: string) => `/admin/users/${id}/submodule-access/${submoduleId}`,
        grantFeature: (id: string) => `/admin/users/${id}/feature-access`,
        revokeFeature: (id: string, featureId: string) => `/admin/users/${id}/feature-access/${featureId}`,
        grantOperation: (id: string) => `/admin/users/${id}/feature-operation-access`,
        revokeOperation: (id: string, featureId: string, operationId: string) =>
          `/admin/users/${id}/feature-operation-access/${featureId}/${operationId}`,
        denySubmodule: (id: string) => `/admin/users/${id}/submodule-denial`,
        removeSubmoduleDenial: (id: string, submoduleId: string) => `/admin/users/${id}/submodule-denial/${submoduleId}`,
        denyFeature: (id: string) => `/admin/users/${id}/feature-denial`,
        removeFeatureDenial: (id: string, featureId: string) => `/admin/users/${id}/feature-denial/${featureId}`,
        denyOperation: (id: string) => `/admin/users/${id}/feature-operation-denial`,
        removeOperationDenial: (id: string, featureId: string, operationId: string) =>
          `/admin/users/${id}/feature-operation-denial/${featureId}/${operationId}`,
      },
    },
  },
} as const;
