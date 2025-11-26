"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import * as React from "react";
import {
  useRoles,
  useRoleHierarchicalPermissions,
  useGrantRoleModuleAccess,
  useGrantRoleSubmoduleAccess,
  useGrantRoleFeatureAccess,
  useGrantRoleFeatureOperationAccess,
  useRevokeRoleModuleAccess,
  useRevokeRoleSubmoduleAccess,
  useRevokeRoleFeatureAccess,
  useRevokeRoleFeatureOperationAccess,
} from "../../hooks/use-system-management";
import { PermissionTree } from "../components/permission-tree";
import type { PermissionTreeModule } from "../../domain/types";
import { useToast } from "@/lib/hooks/use-toast";

interface RolePermissionsTabProps {
  roleId?: string;
  onBack?: () => void;
}

export function RolePermissionsTab({ roleId: initialRoleId, onBack }: RolePermissionsTabProps = {}) {
  const { data: roles } = useRoles();
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>(initialRoleId || "");
  
  // Sync initialRoleId with selectedRoleId when it changes
  React.useEffect(() => {
    if (initialRoleId) {
      setSelectedRoleId(initialRoleId);
    }
  }, [initialRoleId]);

  const { data: permissionTree, isLoading, refetch: refetchPermissions } = useRoleHierarchicalPermissions(selectedRoleId);
  
  // Refetch permissions when selectedRoleId changes
  React.useEffect(() => {
    if (selectedRoleId) {
      refetchPermissions();
    }
  }, [selectedRoleId, refetchPermissions]);
  
  const toast = useToast();

  const grantModuleAccess = useGrantRoleModuleAccess();
  const grantSubmoduleAccess = useGrantRoleSubmoduleAccess();
  const grantFeatureAccess = useGrantRoleFeatureAccess();
  const grantFeatureOperationAccess = useGrantRoleFeatureOperationAccess();
  const revokeModuleAccess = useRevokeRoleModuleAccess();
  const revokeSubmoduleAccess = useRevokeRoleSubmoduleAccess();
  const revokeFeatureAccess = useRevokeRoleFeatureAccess();
  const revokeFeatureOperationAccess = useRevokeRoleFeatureOperationAccess();

  // Build selected sets from permission tree
  const selectedModules = React.useMemo(() => {
    const set = new Set<string>();
    if (permissionTree) {
      permissionTree.forEach((module) => {
        if (module.hasAccess === true) {
          set.add(module.id);
        }
      });
    }
    return set;
  }, [permissionTree]);

  const selectedSubmodules = React.useMemo(() => {
    const set = new Set<string>();
    if (permissionTree) {
      permissionTree.forEach((module) => {
        module.submodules.forEach((submodule) => {
          // For roles: include if it has access (all role permissions are toggleable)
          // Explicit means directly granted (not inherited from parent)
          if (submodule.hasAccess === true) {
            set.add(submodule.id);
          }
        });
      });
    }
    return set;
  }, [permissionTree]);

  const selectedFeatures = React.useMemo(() => {
    const set = new Set<string>();
    if (permissionTree) {
      permissionTree.forEach((module) => {
        module.submodules.forEach((submodule) => {
          submodule.features.forEach((feature) => {
            // For roles: include if it has access (all role permissions are toggleable)
            // Explicit means directly granted (not inherited from parent)
            if (feature.hasAccess === true) {
              set.add(feature.id);
            }
          });
        });
      });
    }
    return set;
  }, [permissionTree]);

  const selectedOperations = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (permissionTree) {
      permissionTree.forEach((module) => {
        module.submodules.forEach((submodule) => {
          submodule.features.forEach((feature) => {
            const ops = new Set<string>();
            feature.operations.forEach((operation) => {
              // For roles: include if it has access (all role permissions are toggleable)
              // Explicit means directly granted (not inherited from parent)
              if (operation.hasAccess === true) {
                ops.add(operation.id);
              }
            });
            if (ops.size > 0) {
              map.set(feature.id, ops);
            }
          });
        });
      });
    }
    return map;
  }, [permissionTree]);

  const handleModuleToggle = React.useCallback(
    async (moduleId: string, checked: boolean) => {
      if (!selectedRoleId) return;
      try {
        if (checked) {
          await grantModuleAccess.mutateAsync({ roleId: selectedRoleId, moduleId });
        } else {
          await revokeModuleAccess.mutateAsync({ roleId: selectedRoleId, moduleId });
        }
        // Refetch permissions after mutation
        await refetchPermissions();
        toast.success(`Module access ${checked ? "granted" : "revoked"}`);
      } catch (error) {
        toast.error(`Failed to ${checked ? "grant" : "revoke"} module access`);
        console.error("Module toggle error:", error);
      }
    },
    [selectedRoleId, grantModuleAccess, revokeModuleAccess, toast, refetchPermissions]
  );

  const handleSubmoduleToggle = React.useCallback(
    async (submoduleId: string, checked: boolean, moduleId: string) => {
      if (!selectedRoleId) return;
      try {
        if (checked) {
          await grantSubmoduleAccess.mutateAsync({ roleId: selectedRoleId, submoduleId });
        } else {
          await revokeSubmoduleAccess.mutateAsync({ roleId: selectedRoleId, submoduleId });
        }
        // Refetch permissions after mutation
        await refetchPermissions();
        toast.success(`Submodule access ${checked ? "granted" : "revoked"}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to ${checked ? "grant" : "revoke"} submodule access: ${errorMessage}`);
        console.error("Submodule toggle error:", error);
      }
    },
    [selectedRoleId, grantSubmoduleAccess, revokeSubmoduleAccess, toast, refetchPermissions]
  );

  const handleFeatureToggle = React.useCallback(
    async (featureId: string, checked: boolean, submoduleId: string, moduleId: string) => {
      if (!selectedRoleId) return;
      try {
        if (checked) {
          await grantFeatureAccess.mutateAsync({ roleId: selectedRoleId, featureId });
        } else {
          await revokeFeatureAccess.mutateAsync({ roleId: selectedRoleId, featureId });
        }
        // Refetch permissions after mutation
        await refetchPermissions();
        toast.success(`Feature access ${checked ? "granted" : "revoked"}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to ${checked ? "grant" : "revoke"} feature access: ${errorMessage}`);
        console.error("Feature toggle error:", error);
      }
    },
    [selectedRoleId, grantFeatureAccess, revokeFeatureAccess, toast, refetchPermissions]
  );

  const handleOperationToggle = React.useCallback(
    async (featureId: string, operationId: string, checked: boolean, submoduleId: string, moduleId: string) => {
      if (!selectedRoleId) return;
      try {
        if (checked) {
          await grantFeatureOperationAccess.mutateAsync({
            roleId: selectedRoleId,
            featureId,
            operationId,
          });
        } else {
          await revokeFeatureOperationAccess.mutateAsync({
            roleId: selectedRoleId,
            featureId,
            operationId,
          });
        }
        // Refetch permissions after mutation
        await refetchPermissions();
        toast.success(`Operation access ${checked ? "granted" : "revoked"}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to ${checked ? "grant" : "revoke"} operation access: ${errorMessage}`);
        console.error("Operation toggle error:", error);
      }
    },
    [selectedRoleId, grantFeatureOperationAccess, revokeFeatureOperationAccess, toast, refetchPermissions]
  );

  // Convert permission tree to flat structure for PermissionTree component
  const treeModules: PermissionTreeModule[] = React.useMemo(() => {
    if (!permissionTree) return [];
    return permissionTree.map((module) => ({
      ...module,
      submodules: module.submodules.map((submodule) => ({
        ...submodule,
        features: submodule.features.map((feature) => ({
          ...feature,
          operations: feature.operations.map((operation) => ({
            ...operation,
          })),
        })),
      })),
    }));
  }, [permissionTree]);

  if (!roles || roles.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No roles available. Please create a role first.</p>
        </CardContent>
      </Card>
    );
  }

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Role</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {selectedRole && (
              <div className="mt-4 p-3 bg-accent/50 rounded-md">
                <div className="text-sm font-medium">{selectedRole.name}</div>
                {selectedRole.description && (
                  <div className="text-xs text-muted-foreground mt-1">{selectedRole.description}</div>
                )}
                {selectedRole.isSystemRole && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    System Role
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedRoleId && (
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Permissions for {selectedRole?.name}</CardTitle>
            </CardHeader>
            <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading permissions...</div>
            ) : treeModules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No permissions available.</div>
            ) : (
              <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
                <PermissionTree
                  modules={treeModules}
                  selectedModules={selectedModules}
                  selectedSubmodules={selectedSubmodules}
                  selectedFeatures={selectedFeatures}
                  selectedOperations={selectedOperations}
                  onModuleToggle={handleModuleToggle}
                  onSubmoduleToggle={handleSubmoduleToggle}
                  onFeatureToggle={handleFeatureToggle}
                  onOperationToggle={handleOperationToggle}
                />
              </div>
            )}
          </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

