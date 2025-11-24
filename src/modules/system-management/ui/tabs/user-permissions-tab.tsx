"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserCheck } from "lucide-react";
import * as React from "react";
import {
  useUserHierarchicalPermissions,
  useGrantUserSubmoduleAccess,
  useGrantUserFeatureAccess,
  useGrantUserFeatureOperationAccess,
  useRevokeUserSubmoduleAccess,
  useRevokeUserFeatureAccess,
  useRevokeUserFeatureOperationAccess,
} from "../../hooks/use-system-management";
import { PermissionTree } from "../components/permission-tree";
import type { PermissionTreeModule } from "../../domain/types";
import { apiClient } from "@/lib/api/api-client";
import { API_ENDPOINTS } from "@/config/api";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

interface UserPermissionsTabProps {
  userId?: string;
  onBack?: () => void;
}

export function UserPermissionsTab({ userId: initialUserId, onBack }: UserPermissionsTabProps = {}) {
  const [selectedUserId, setSelectedUserId] = React.useState<string>(initialUserId || "");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users", "list", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "50");
      const response = await apiClient.get<{ data: User[]; total: number }>(
        `${API_ENDPOINTS.users.list}?${params.toString()}`
      );
      return response.data || { data: [], total: 0 };
    },
  });

  const { data: permissionTree, isLoading: permissionsLoading } = useUserHierarchicalPermissions(selectedUserId);

  const toast = useToast();
  const grantSubmoduleAccess = useGrantUserSubmoduleAccess();
  const grantFeatureAccess = useGrantUserFeatureAccess();
  const grantFeatureOperationAccess = useGrantUserFeatureOperationAccess();
  const revokeSubmoduleAccess = useRevokeUserSubmoduleAccess();
  const revokeFeatureAccess = useRevokeUserFeatureAccess();
  const revokeFeatureOperationAccess = useRevokeUserFeatureOperationAccess();

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
          if (submodule.hasAccess === true && module.hasAccess !== true) {
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
            if (
              feature.hasAccess === true &&
              module.hasAccess !== true &&
              submodule.hasAccess !== true
            ) {
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
              if (
                operation.hasAccess === true &&
                module.hasAccess !== true &&
                submodule.hasAccess !== true &&
                feature.hasAccess !== true
              ) {
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
      if (!selectedUserId) return;
      // For modules, we need to grant/revoke at submodule level
      const module = permissionTree?.find((m) => m.id === moduleId);
      if (module) {
        try {
          const promises = module.submodules.map((submodule) =>
            checked
              ? grantSubmoduleAccess.mutateAsync({ userId: selectedUserId, submoduleId: submodule.id })
              : revokeSubmoduleAccess.mutateAsync({ userId: selectedUserId, submoduleId: submodule.id })
          );
          await Promise.all(promises);
          toast.success(`Module ${checked ? "granted" : "revoked"} successfully`);
        } catch (error) {
          toast.error(`Failed to ${checked ? "grant" : "revoke"} module access`);
          console.error("Module toggle error:", error);
        }
      }
    },
    [selectedUserId, permissionTree, grantSubmoduleAccess, revokeSubmoduleAccess, toast]
  );

  const handleSubmoduleToggle = React.useCallback(
    async (submoduleId: string, checked: boolean) => {
      if (!selectedUserId) return;
      try {
        if (checked) {
          await grantSubmoduleAccess.mutateAsync({ userId: selectedUserId, submoduleId });
          toast.success("Submodule access granted");
        } else {
          await revokeSubmoduleAccess.mutateAsync({ userId: selectedUserId, submoduleId });
          toast.success("Submodule access revoked");
        }
      } catch (error) {
        toast.error(`Failed to ${checked ? "grant" : "revoke"} submodule access`);
        console.error("Submodule toggle error:", error);
      }
    },
    [selectedUserId, grantSubmoduleAccess, revokeSubmoduleAccess, toast]
  );

  const handleFeatureToggle = React.useCallback(
    async (featureId: string, checked: boolean) => {
      if (!selectedUserId) return;
      try {
        if (checked) {
          await grantFeatureAccess.mutateAsync({ userId: selectedUserId, featureId });
          toast.success("Feature access granted");
        } else {
          await revokeFeatureAccess.mutateAsync({ userId: selectedUserId, featureId });
          toast.success("Feature access revoked");
        }
      } catch (error) {
        toast.error(`Failed to ${checked ? "grant" : "revoke"} feature access`);
        console.error("Feature toggle error:", error);
      }
    },
    [selectedUserId, grantFeatureAccess, revokeFeatureAccess, toast]
  );

  const handleOperationToggle = React.useCallback(
    async (featureId: string, operationId: string, checked: boolean) => {
      if (!selectedUserId) return;
      try {
        if (checked) {
          await grantFeatureOperationAccess.mutateAsync({
            userId: selectedUserId,
            featureId,
            operationId,
          });
          toast.success("Operation access granted");
        } else {
          await revokeFeatureOperationAccess.mutateAsync({
            userId: selectedUserId,
            featureId,
            operationId,
          });
          toast.success("Operation access revoked");
        }
      } catch (error) {
        toast.error(`Failed to ${checked ? "grant" : "revoke"} operation access`);
        console.error("Operation toggle error:", error);
      }
    },
    [selectedUserId, grantFeatureOperationAccess, revokeFeatureOperationAccess, toast]
  );

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

  const selectedUser = usersData?.data?.find((u) => u.id === selectedUserId);
  const showUserSelection = !initialUserId;

  return (
    <div className="space-y-6">
      {onBack && (
        <Button variant="outline" onClick={onBack}>
          ← Back to Users
        </Button>
      )}
      <div className={`grid grid-cols-1 ${showUserSelection ? "lg:grid-cols-3" : ""} gap-4`}>
        {/* User Selection - only show if no initial userId */}
        {showUserSelection && (
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm"
              />
              {usersLoading ? (
                <div className="text-sm text-muted-foreground text-center py-8">Loading users...</div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto">
                  {usersData?.data?.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedUserId === user.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-accent border-border"
                      }`}
                    >
                      <div className="font-medium">
                        {user.firstName || user.lastName
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                          : user.email}
                      </div>
                      <div className={`text-sm ${selectedUserId === user.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {user.email}
                      </div>
                      {user.roles && user.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={selectedUserId === user.id ? "secondary" : "outline"}
                              className="text-xs"
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                  {usersData?.data?.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">No users found</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Permission Tree */}
        <Card className={showUserSelection ? "lg:col-span-2" : "w-full"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedUser
                ? `Permissions for ${selectedUser.firstName || selectedUser.lastName ? `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() : selectedUser.email}`
                : "Select a user to manage permissions"}
            </CardTitle>
            {selectedUser && selectedUser.roles && selectedUser.roles.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
                <span className="text-xs font-medium text-muted-foreground">Roles:</span>
                {selectedUser.roles.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs">
                    {role}
                  </Badge>
                ))}
                <span className="text-xs text-muted-foreground ml-auto">
                  Blue badges = Explicit overrides
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedUserId ? (
              <div className="text-center py-16 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select a user from the list to manage their permissions</p>
              </div>
            ) : permissionsLoading ? (
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
      </div>
    </div>
  );
}

