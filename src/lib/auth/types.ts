export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  roles: string[];
  permissions?: string[];
  access?: UserAccessInfo;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface UserAccessInfo {
  modules: ModuleAccessInfo[];
  allPermissions?: string[];
  hasAllAccess: boolean;
}

export interface ModuleAccessInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  views?: ViewAccessInfo[];
  submodules?: SubmoduleAccessInfo[];
}

export interface ViewAccessInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  route?: string;
  icon?: string;
  order: number;
  permissions: ViewPermissionInfo[];
  hasNotificationAccess: boolean;
}

export interface ViewPermissionInfo {
  slug: string;
  name: string;
  isDefault: boolean;
}

export interface SubmoduleAccessInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  features: FeatureAccessInfo[];
}

export interface FeatureAccessInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  route?: string;
  icon?: string;
  order: number;
  operations: OperationAccessInfo[];
}

export interface OperationAccessInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isDefault: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
