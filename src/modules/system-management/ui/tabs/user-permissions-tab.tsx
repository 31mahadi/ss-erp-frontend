"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserCheck } from "lucide-react";
import * as React from "react";
import {
  useUserEffectivePermissionsTree,
  useAddManualPermission,
  useRemoveManualPermission,
  usePermissionKeyBuilder,
} from "../../../permissions-v2/hooks/use-flexible-permissions";
import { PermissionTree } from "../components/permission-tree";
import type { PermissionTreeModule } from "../../domain/types";
import { apiClient } from "@/lib/api/api-client";
import { API_ENDPOINTS } from "@/config/api";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";
import { logger } from "@/lib/logger/logger";

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

  // Sync initialUserId with selectedUserId when it changes
  React.useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(initialUserId);
    }
  }, [initialUserId]);

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

  const { data: permissionTree, isLoading: permissionsLoading, refetch: refetchPermissions } = useUserEffectivePermissionsTree(selectedUserId);

  // React Query automatically refetches when selectedUserId changes (it's in the queryKey)

  const toast = useToast();
  const addManualPermission = useAddManualPermission();
  const removeManualPermission = useRemoveManualPermission();
  const permissionKeyBuilder = usePermissionKeyBuilder();

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
          // Only include explicit (manual_add) permissions - atomic evaluation
          // Role-based permissions are shown as checked but not in selected set (can't be revoked)
          if (submodule.hasAccess === true && submodule.isExplicit === true) {
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
            // Only include explicit (manual_add) permissions - atomic evaluation
            // Role-based permissions are shown as checked but not in selected set (can't be revoked)
            if (feature.hasAccess === true && feature.isExplicit === true) {
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
              // Only include explicit operations - role-based operations should NOT be in selectedOperations
              // This ensures that role-based operations show as checked but disabled (can't be unticked)
              if (operation.hasAccess === true && operation.isExplicit === true) {
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

  // Track ongoing mutations to prevent duplicate calls
  const [ongoingMutations, setOngoingMutations] = React.useState<Set<string>>(new Set());

  // Helper function to extract error message
  const getErrorMessage = React.useCallback((error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "object" && error !== null && "message" in error) {
      return String((error as { message: unknown }).message);
    }
    return String(error);
  }, []);

  // Helper function to create Error object for logging
  const createErrorForLogging = React.useCallback((error: unknown): Error => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(getErrorMessage(error));
  }, [getErrorMessage]);

  const handleModuleToggle = React.useCallback(
    async (moduleId: string, checked: boolean) => {
      if (!selectedUserId) {
        toast.error("Please select a user first");
        return;
      }

      // Prevent duplicate calls
      const mutationKey = `module-${moduleId}-${checked}`;
      if (ongoingMutations.has(mutationKey)) {
        return; // Already processing
      }

      // For modules, we need to grant/revoke at submodule level
      const module = permissionTree?.find((m) => m.id === moduleId);
      if (!module) {
        toast.error("Module not found");
        return;
      }
      if (!module.submodules || module.submodules.length === 0) {
        toast.error("Module has no submodules");
        return;
      }

      setOngoingMutations((prev) => new Set(prev).add(mutationKey));

      try {
        // When unchecking, only remove explicit (manual_add) permissions
        // Role-based permissions cannot be revoked via module toggle
        const promises = module.submodules
          .filter((submodule) => {
            // If checking, include all submodules (will add manual_add)
            // If unchecking, only include submodules that have explicit (manual_add) permissions
            return checked || (submodule.isExplicit === true && submodule.hasAccess === true);
          })
          .map((submodule) => {
            const permissionKey = permissionKeyBuilder.build(moduleId, submodule.id);
            return checked
              ? addManualPermission.mutateAsync({
                  userId: selectedUserId,
                  permissionKey,
                  moduleId,
                  submoduleId: submodule.id,
                })
              : removeManualPermission.mutateAsync({
                  userId: selectedUserId,
                  permissionKey,
                }).catch((error) => {
                  // Ignore 400/404 errors for non-existent permissions (idempotent)
                  const errorMessage = getErrorMessage(error);
                  if (errorMessage.includes('does not exist') || errorMessage.includes('404')) {
                    return; // Permission doesn't exist, which is fine
                  }
                  throw error; // Re-throw other errors
                });
          });
        await Promise.all(promises);
        // Don't manually refetch - React Query will automatically refetch when mutations invalidate queries
        toast.success(`Module ${checked ? "granted" : "revoked"} successfully`);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        toast.error(`Failed to ${checked ? "grant" : "revoke"} module access: ${errorMessage}`);
        
        // Build context object, only including defined values
        const context: Record<string, unknown> = {
          moduleId: moduleId || "unknown",
          checked: checked ?? false,
        };
        if (selectedUserId) context.userId = selectedUserId;
        if (error && typeof error === "object" && error !== null) {
          context.errorDetails = error;
        }
        
        logger.error("Module toggle error", createErrorForLogging(error), context);
      } finally {
        setOngoingMutations((prev) => {
          const next = new Set(prev);
          next.delete(mutationKey);
          return next;
        });
      }
    },
    [selectedUserId, permissionTree, addManualPermission, removeManualPermission, permissionKeyBuilder, toast, ongoingMutations]
  );

  const handleSubmoduleToggle = React.useCallback(
    async (submoduleId: string, checked: boolean, moduleId: string) => {
      if (!selectedUserId) {
        toast.error("Please select a user first");
        return;
      }

      // Prevent duplicate calls
      const mutationKey = `submodule-${submoduleId}-${checked}`;
      if (ongoingMutations.has(mutationKey)) {
        return; // Already processing
      }
      
      // Find the submodule in the permission tree to check if it's explicit
      const submodule = permissionTree
        ?.flatMap((m) => m.submodules)
        .find((s) => s.id === submoduleId);
      
      // If trying to revoke and submodule is not explicit (manual_add), show error
      // Atomic evaluation: only explicit (manual_add) permissions can be revoked
      if (!checked && submodule && (!submodule.isExplicit || !submodule.hasAccess)) {
        toast.error("Cannot revoke role-based submodule access. Only explicit (manual) permissions can be revoked.");
        return;
      }
      
      const permissionKey = permissionKeyBuilder.build(moduleId, submoduleId);
      
      setOngoingMutations((prev) => new Set(prev).add(mutationKey));

      try {
        if (checked) {
          await addManualPermission.mutateAsync({
            userId: selectedUserId,
            permissionKey,
            moduleId,
            submoduleId,
          });
        } else {
          await removeManualPermission.mutateAsync({
            userId: selectedUserId,
            permissionKey,
          }).catch((error) => {
            // Ignore 400/404 errors for non-existent permissions (idempotent)
            const errorMessage = getErrorMessage(error);
            if (errorMessage.includes('does not exist') || errorMessage.includes('404')) {
              return; // Permission doesn't exist, which is fine
            }
            throw error; // Re-throw other errors
          });
        }
        // Don't manually refetch - React Query will automatically refetch when mutations invalidate queries
        toast.success(`Submodule access ${checked ? "granted" : "revoked"}`);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        toast.error(`Failed to ${checked ? "grant" : "revoke"} submodule access: ${errorMessage}`);
        
        // Build context object, only including defined values
        const context: Record<string, unknown> = {
          submoduleId: submoduleId || "unknown",
          checked: checked ?? false,
          moduleId: moduleId || "unknown",
        };
        if (selectedUserId) context.userId = selectedUserId;
        if (error && typeof error === "object" && error !== null) {
          context.errorDetails = error;
        }
        
        logger.error("Submodule toggle error", createErrorForLogging(error), context);
      } finally {
        setOngoingMutations((prev) => {
          const next = new Set(prev);
          next.delete(mutationKey);
          return next;
        });
      }
    },
    [selectedUserId, permissionTree, addManualPermission, removeManualPermission, permissionKeyBuilder, toast, ongoingMutations]
  );

  const handleFeatureToggle = React.useCallback(
    async (featureId: string, checked: boolean, submoduleId: string, moduleId: string) => {
      if (!selectedUserId) {
        toast.error("Please select a user first");
        return;
      }

      // Prevent duplicate calls
      const mutationKey = `feature-${featureId}-${checked}`;
      if (ongoingMutations.has(mutationKey)) {
        return; // Already processing
      }
      
      // Find the feature in the permission tree to check if it's explicit
      const feature = permissionTree
        ?.flatMap((m) => m.submodules)
        .flatMap((s) => s.features)
        .find((f) => f.id === featureId);
      
      // If trying to revoke and feature is not explicit (manual_add), show error
      // Atomic evaluation: only explicit (manual_add) permissions can be revoked
      if (!checked && feature && (!feature.isExplicit || !feature.hasAccess)) {
        toast.error("Cannot revoke role-based feature access. Only explicit (manual) permissions can be revoked.");
        return;
      }
      
      const permissionKey = permissionKeyBuilder.build(moduleId, submoduleId, featureId);
      
      setOngoingMutations((prev) => new Set(prev).add(mutationKey));

      try {
        if (checked) {
          await addManualPermission.mutateAsync({
            userId: selectedUserId,
            permissionKey,
            moduleId,
            submoduleId,
            featureId,
          });
        } else {
          await removeManualPermission.mutateAsync({
            userId: selectedUserId,
            permissionKey,
          }).catch((error) => {
            // Ignore 400/404 errors for non-existent permissions (idempotent)
            const errorMessage = getErrorMessage(error);
            if (errorMessage.includes('does not exist') || errorMessage.includes('404')) {
              return; // Permission doesn't exist, which is fine
            }
            throw error; // Re-throw other errors
          });
        }
        // Don't manually refetch - React Query will automatically refetch when mutations invalidate queries
        toast.success(`Feature access ${checked ? "granted" : "revoked"}`);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        toast.error(`Failed to ${checked ? "grant" : "revoke"} feature access: ${errorMessage}`);
        
        // Build context object, only including defined values
        const context: Record<string, unknown> = {
          featureId: featureId || "unknown",
          checked: checked ?? false,
          submoduleId: submoduleId || "unknown",
          moduleId: moduleId || "unknown",
        };
        if (selectedUserId) context.userId = selectedUserId;
        if (error && typeof error === "object" && error !== null) {
          context.errorDetails = error;
        }
        
        logger.error("Feature toggle error", createErrorForLogging(error), context);
      } finally {
        setOngoingMutations((prev) => {
          const next = new Set(prev);
          next.delete(mutationKey);
          return next;
        });
      }
    },
    [selectedUserId, permissionTree, addManualPermission, removeManualPermission, permissionKeyBuilder, toast, ongoingMutations]
  );

  const handleOperationToggle = React.useCallback(
    async (featureId: string, operationId: string, checked: boolean, submoduleId: string, moduleId: string) => {
      if (!selectedUserId) {
        toast.error("Please select a user first");
        return;
      }

      // Create a more unique mutation key that includes all identifiers
      const mutationKey = `operation-${selectedUserId}-${moduleId}-${submoduleId}-${featureId}-${operationId}-${checked}`;
      if (ongoingMutations.has(mutationKey)) {
        logger.debug("Operation toggle already in progress", { mutationKey });
        return; // Already processing
      }
      
      // Find the operation in the permission tree to check if it's explicit
      const operation = permissionTree
        ?.flatMap((m) => m.submodules)
        .flatMap((s) => s.features)
        .find((f) => f.id === featureId)
        ?.operations.find((op) => op.id === operationId);
      
      // If trying to revoke and operation is not explicit (manual_add), show error and return early
      // Atomic evaluation: only explicit (manual_add) permissions can be revoked
      if (!checked && operation && (!operation.isExplicit || !operation.hasAccess)) {
        toast.error("Cannot revoke role-based operation access. Only explicit (manual) permissions can be revoked.");
        return;
      }
      
      const permissionKey = permissionKeyBuilder.build(moduleId, submoduleId, featureId, operationId);
      
      // Set mutation state BEFORE async operations
      setOngoingMutations((prev) => {
        const next = new Set(prev);
        next.add(mutationKey);
        return next;
      });

      try {
        if (checked) {
          await addManualPermission.mutateAsync({
            userId: selectedUserId,
            permissionKey,
            moduleId,
            submoduleId,
            featureId,
            operationId,
          });
        } else {
          // Only try to remove if it's explicit
          if (!operation?.isExplicit) {
            // If not explicit, don't try to remove - it's role-based
            logger.debug("Skipping removal of non-explicit operation permission", { operationId, permissionKey });
            // Clear mutation state and return early
            setOngoingMutations((prev) => {
              const next = new Set(prev);
              next.delete(mutationKey);
              return next;
            });
            return;
          }
          
          await removeManualPermission.mutateAsync({
            userId: selectedUserId,
            permissionKey,
          }).catch((error) => {
            // Ignore 400/404 errors for non-existent permissions (idempotent)
            const errorMessage = getErrorMessage(error);
            if (errorMessage.includes('does not exist') || errorMessage.includes('404')) {
              return; // Permission doesn't exist, which is fine
            }
            throw error; // Re-throw other errors
          });
        }
        // Don't manually refetch - React Query will automatically refetch when mutations invalidate queries
        // The mutations already have onSuccess callbacks that invalidate the queries
        toast.success(`Operation access ${checked ? "granted" : "revoked"}`);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        toast.error(`Failed to ${checked ? "grant" : "revoke"} operation access: ${errorMessage}`);
        
        // Build context object, only including defined values
        const context: Record<string, unknown> = {
          operationId: operationId || "unknown",
          featureId: featureId || "unknown",
          checked: checked ?? false,
          submoduleId: submoduleId || "unknown",
          moduleId: moduleId || "unknown",
        };
        if (selectedUserId) context.userId = selectedUserId;
        if (error && typeof error === "object" && error !== null) {
          context.errorDetails = error;
        }
        
        logger.error("Operation toggle error", createErrorForLogging(error), context);
      } finally {
        // Always clear mutation state
        setOngoingMutations((prev) => {
          const next = new Set(prev);
          next.delete(mutationKey);
          return next;
        });
      }
    },
    [selectedUserId, permissionTree, addManualPermission, removeManualPermission, permissionKeyBuilder, toast, ongoingMutations, logger]
  );

  const treeModules: PermissionTreeModule[] = React.useMemo(() => {
    if (!permissionTree) return [];
    return permissionTree.map((module) => ({
      ...module,
      submodules: module.submodules.map((submodule, submoduleIndex) => ({
        ...submodule,
        order: (submodule as { order?: number }).order ?? submoduleIndex,
        features: submodule.features.map((feature, featureIndex) => ({
          ...feature,
          order: (feature as { order?: number }).order ?? featureIndex,
          operations: feature.operations.map((operation) => ({
            ...operation,
            isDefault: (operation as { isDefault?: boolean }).isDefault ?? false,
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

