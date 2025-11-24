export interface Module {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Submodule {
  id: string;
  moduleId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  module?: Module;
  features?: Feature[];
}

export interface Feature {
  id: string;
  submoduleId: string;
  name: string;
  slug: string;
  description?: string;
  route?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  submodule?: Submodule;
  featureOperations?: FeatureOperation[];
}

export interface Operation {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureOperation {
  id: string;
  featureId: string;
  operationId: string;
  isDefault: boolean;
  feature?: Feature;
  operation?: Operation;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleModuleAccess {
  id: string;
  roleId: string;
  moduleId: string;
  role?: Role;
  module?: Module;
}

export interface RoleSubmoduleAccess {
  id: string;
  roleId: string;
  submoduleId: string;
  role?: Role;
  submodule?: Submodule;
}

export interface RoleFeatureAccess {
  id: string;
  roleId: string;
  featureId: string;
  role?: Role;
  feature?: Feature;
}

export interface RoleFeatureOperationAccess {
  id: string;
  roleId: string;
  featureId: string;
  operationId: string;
  role?: Role;
  feature?: Feature;
  operation?: Operation;
}

export interface PermissionTreeOperation {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isDefault: boolean;
  hasAccess?: boolean;
  isExplicit?: boolean;
  isDenied?: boolean; // Explicitly denied even if role has it
}

export interface PermissionTreeFeature {
  id: string;
  name: string;
  slug: string;
  description?: string;
  route?: string;
  icon?: string;
  order: number;
  hasAccess?: boolean;
  isExplicit?: boolean;
  isDenied?: boolean; // Explicitly denied even if role has it
  operations: PermissionTreeOperation[];
}

export interface PermissionTreeSubmodule {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  hasAccess?: boolean;
  isExplicit?: boolean;
  isDenied?: boolean; // Explicitly denied even if role has it
  features: PermissionTreeFeature[];
}

export interface PermissionTreeModule {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  hasAccess?: boolean;
  submodules: PermissionTreeSubmodule[];
}

