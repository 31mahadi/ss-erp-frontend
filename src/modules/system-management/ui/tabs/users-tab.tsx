"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, Search, Mail, User } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { updateUserSchema, type UpdateUserInput } from "../../domain/user-schema";
import { useUsers, useUpdateUser, useDeleteUser, useUser } from "../../hooks/use-users";
import { useRoles } from "../../hooks/use-system-management";
import {
  useUserHierarchicalPermissions,
  useGrantUserSubmoduleAccess,
  useGrantUserFeatureAccess,
  useGrantUserFeatureOperationAccess,
  useRevokeUserSubmoduleAccess,
  useRevokeUserFeatureAccess,
  useRevokeUserFeatureOperationAccess,
} from "../../hooks/use-system-management";
import { Checkbox } from "@/components/ui/checkbox";
import { PermissionTree } from "../components/permission-tree";
import type { PermissionTreeModule } from "../../domain/types";
import { useToast } from "@/lib/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface UsersTabProps {
  onSelectUser?: (userId: string) => void;
}

export function UsersTab({ onSelectUser }: UsersTabProps = {}) {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);

  const { data: usersData, isLoading } = useUsers({ page, limit: 20, search: searchQuery || undefined });
  const { data: roles } = useRoles();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const toast = useToast();

  const [updateRoleIds, setUpdateRoleIds] = React.useState<string[]>([]);
  const [updateIsEmailVerified, setUpdateIsEmailVerified] = React.useState(false);
  const [updateIsActive, setUpdateIsActive] = React.useState(true);
  const [deletingUserId, setDeletingUserId] = React.useState<string | null>(null);

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    reset: resetUpdate,
    formState: { errors: errorsUpdate },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
  });

  const onSubmitUpdate = async (data: UpdateUserInput) => {
    if (!editingUserId) return;
    try {
      await updateUser.mutateAsync({
        id: editingUserId,
        data: {
          ...data,
          roleIds: updateRoleIds,
          isEmailVerified: updateIsEmailVerified,
          isActive: updateIsActive,
        },
      });
      resetUpdate();
      setEditingUserId(null);
      setUpdateRoleIds([]);
      toast.success("User updated successfully");
    } catch (error: any) {
      // Extract error message from multiple possible locations
      const errorMessage = 
        error?.response?.data?.message || 
        error?.data?.message || 
        error?.message || 
        error?.details?.message ||
        (typeof error === 'string' ? error : "Failed to update user");
      toast.error(errorMessage);
      console.error("Failed to update user:", error);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUserId(user.id);
    
    // Map role names to role IDs
    const roleIds: string[] = [];
    if (user.roleIds && user.roleIds.length > 0) {
      // If roleIds are already available, use them
      roleIds.push(...user.roleIds);
    } else if (user.roles && user.roles.length > 0 && roles) {
      // Otherwise, map role names to IDs
      user.roles.forEach((roleName: string) => {
        const role = roles.find((r) => r.name === roleName);
        if (role) {
          roleIds.push(role.id);
        }
      });
    }
    
    setUpdateRoleIds(roleIds);
    setUpdateIsEmailVerified(user.isEmailVerified || false);
    setUpdateIsActive(user.isActive !== false);
    resetUpdate({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    });
  };

  const handleDelete = async (id: string) => {
    setDeletingUserId(id);
  };


  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by email, name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Users ({usersData?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading users...</div>
          ) : usersData?.data && usersData.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData.data.map((user) => (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          onSelectUser?.(user.id);
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {user.firstName?.[0] || user.lastName?.[0] || user.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">
                                {user.firstName || user.lastName
                                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                  : "No Name"}
                              </div>
                              {user.phone && <div className="text-xs text-muted-foreground">{user.phone}</div>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{user.email}</span>
                            {user.isEmailVerified && (
                              <Badge variant="outline" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <Badge key={role} variant="secondary" className="text-xs">
                                  {role}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt ? (
                            <span className="text-sm text-muted-foreground">
                              {new Date(user.lastLoginAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.email.toLowerCase() !== '01.mahadi@gmail.com' && (
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(user)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              {usersData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {usersData.page} of {usersData.totalPages} ({usersData.total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(usersData.totalPages, p + 1))}
                      disabled={page === usersData.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {editingUserId && (
        <Dialog open={!!editingUserId} onOpenChange={() => setEditingUserId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitUpdate(onSubmitUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input id="edit-firstName" {...registerUpdate("firstName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input id="edit-lastName" {...registerUpdate("lastName")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" {...registerUpdate("phone")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-isEmailVerified"
                    checked={updateIsEmailVerified}
                    onCheckedChange={setUpdateIsEmailVerified}
                  />
                  <Label htmlFor="edit-isEmailVerified" className="font-normal cursor-pointer">
                    Email Verified
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-isActive"
                    checked={updateIsActive}
                    onCheckedChange={setUpdateIsActive}
                  />
                  <Label htmlFor="edit-isActive" className="font-normal cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign Roles</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {roles?.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-role-${role.id}`}
                        checked={updateRoleIds.includes(role.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setUpdateRoleIds((prev) => [...prev, role.id]);
                          } else {
                            setUpdateRoleIds((prev) => prev.filter((id) => id !== role.id));
                          }
                        }}
                      />
                      <Label htmlFor={`edit-role-${role.id}`} className="font-normal cursor-pointer">
                        {role.name}
                        {role.description && <span className="text-xs text-muted-foreground ml-2">({role.description})</span>}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingUserId(null)}>
                  Cancel
                </Button>
                <Button type="submit">Update User</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* User Detail View */}
      {selectedUserId && (
        <UserDetailView userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}

      {/* Delete Confirmation */}
      {deletingUserId && (
        <ConfirmDialog
          open={!!deletingUserId}
          onOpenChange={(open) => !open && setDeletingUserId(null)}
          onConfirm={async () => {
            try {
              await deleteUser.mutateAsync(deletingUserId);
              toast.success("User deleted successfully");
              setDeletingUserId(null);
            } catch (error: any) {
              // Extract error message from multiple possible locations
              const errorMessage = 
                error?.response?.data?.message || 
                error?.data?.message || 
                error?.message || 
                error?.details?.message ||
                (typeof error === 'string' ? error : "Failed to delete user");
              toast.error(errorMessage);
            }
          }}
          title="Delete User?"
          description="Are you sure you want to delete this user? This action cannot be undone."
          variant="destructive"
          confirmText="Delete"
        />
      )}
    </div>
  );
}

function UserDetailView({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data: user, isLoading } = useUser(userId);
  const { data: permissionTree, isLoading: permissionsLoading } = useUserHierarchicalPermissions(userId);
  const { data: roles } = useRoles();
  const toast = useToast();

  const grantSubmoduleAccess = useGrantUserSubmoduleAccess();
  const grantFeatureAccess = useGrantUserFeatureAccess();
  const grantFeatureOperationAccess = useGrantUserFeatureOperationAccess();
  const revokeSubmoduleAccess = useRevokeUserSubmoduleAccess();
  const revokeFeatureAccess = useRevokeUserFeatureAccess();
  const revokeFeatureOperationAccess = useRevokeUserFeatureOperationAccess();

  // Build selected sets from permission tree - include all items with access
  // The PermissionTree component will handle the hierarchy display
  const selectedModules = React.useMemo(() => {
    const set = new Set<string>();
    if (permissionTree) {
      permissionTree.forEach((module) => {
        if (module.hasAccess) {
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
          if (submodule.hasAccess) {
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
            if (feature.hasAccess) {
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
              if (operation.hasAccess) {
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
      const module = permissionTree?.find((m) => m.id === moduleId);
      if (module) {
        try {
          const promises = module.submodules.map((submodule) =>
            checked
              ? grantSubmoduleAccess.mutateAsync({ userId, submoduleId: submodule.id })
              : revokeSubmoduleAccess.mutateAsync({ userId, submoduleId: submodule.id })
          );
          await Promise.all(promises);
          toast.success(`Module ${checked ? "granted" : "revoked"} successfully`);
        } catch (error) {
          toast.error(`Failed to ${checked ? "grant" : "revoke"} module access`);
          console.error("Module toggle error:", error);
        }
      }
    },
    [userId, permissionTree, grantSubmoduleAccess, revokeSubmoduleAccess, toast]
  );

  const handleSubmoduleToggle = React.useCallback(
    async (submoduleId: string, checked: boolean) => {
      try {
        if (checked) {
          await grantSubmoduleAccess.mutateAsync({ userId, submoduleId });
          toast.success("Submodule access granted");
        } else {
          await revokeSubmoduleAccess.mutateAsync({ userId, submoduleId });
          toast.success("Submodule access revoked");
        }
      } catch (error) {
        toast.error(`Failed to ${checked ? "grant" : "revoke"} submodule access`);
        console.error("Submodule toggle error:", error);
      }
    },
    [userId, grantSubmoduleAccess, revokeSubmoduleAccess, toast]
  );

  const handleFeatureToggle = React.useCallback(
    async (featureId: string, checked: boolean) => {
      try {
        if (checked) {
          await grantFeatureAccess.mutateAsync({ userId, featureId });
          toast.success("Feature access granted");
        } else {
          await revokeFeatureAccess.mutateAsync({ userId, featureId });
          toast.success("Feature access revoked");
        }
      } catch (error) {
        toast.error(`Failed to ${checked ? "grant" : "revoke"} feature access`);
        console.error("Feature toggle error:", error);
      }
    },
    [userId, grantFeatureAccess, revokeFeatureAccess, toast]
  );

  const handleOperationToggle = React.useCallback(
    async (featureId: string, operationId: string, checked: boolean) => {
      try {
        if (checked) {
          await grantFeatureOperationAccess.mutateAsync({
            userId,
            featureId,
            operationId,
          });
          toast.success("Operation access granted");
        } else {
          await revokeFeatureOperationAccess.mutateAsync({
            userId,
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
    [userId, grantFeatureOperationAccess, revokeFeatureOperationAccess, toast]
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">Loading user details...</CardContent>
      </Card>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {user.firstName || user.lastName
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                : user.email}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">User Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Phone:</span> {user.phone || "N/A"}
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Email Verified:</span>{" "}
                  <Badge variant={user.isEmailVerified ? "default" : "secondary"}>
                    {user.isEmailVerified ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Assigned Roles</h3>
              <div className="flex flex-wrap gap-2">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <Badge key={role} variant="outline">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                )}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold mb-4">Permissions</h3>
            {permissionsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading permissions...</div>
            ) : treeModules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No permissions available.</div>
            ) : (
              <div className="max-h-[calc(100vh-30rem)] overflow-y-auto">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

