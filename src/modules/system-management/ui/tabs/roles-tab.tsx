"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import * as React from "react";
import { useDeleteRole, useRoles } from "../../hooks/use-system-management";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/lib/hooks/use-toast";

interface RolesTabProps {
  onSelectRole?: (roleId: string) => void;
}

export function RolesTab({ onSelectRole }: RolesTabProps = {}) {
  const { data: roles, isLoading } = useRoles();
  const deleteRole = useDeleteRole();
  const toast = useToast();
  const [deletingRoleId, setDeletingRoleId] = React.useState<string | null>(null);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="break-words">All Roles</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile: Card view, Desktop: Table view */}
          <div className="block md:hidden space-y-3">
            {roles?.map((role) => (
              <Card 
                key={role.id} 
                className={cn(
                  "cursor-pointer hover:bg-accent/50",
                  onSelectRole ? "" : "cursor-default"
                )}
                onClick={onSelectRole ? () => onSelectRole(role.id) : undefined}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">{role.description || "-"}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {role.isSystemRole ? "System Role" : "Custom Role"}
                        </Badge>
                      </div>
                    </div>
                    {!role.isSystemRole && role.name !== 'Root Admin' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingRoleId(role.id);
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Desktop: Table view */}
          <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles?.map((role) => (
                <TableRow 
                  key={role.id}
                  className={onSelectRole ? "cursor-pointer hover:bg-accent/50" : ""}
                  onClick={onSelectRole ? () => onSelectRole(role.id) : undefined}
                >
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description || "-"}</TableCell>
                  <TableCell>{role.isSystemRole ? "Yes" : "No"}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {!role.isSystemRole && role.name !== 'Root Admin' && (
                      <Button variant="ghost" size="sm" onClick={() => setDeletingRoleId(role.id)}>
                        Delete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      {deletingRoleId && (
        <ConfirmDialog
          open={!!deletingRoleId}
          onOpenChange={(open) => !open && setDeletingRoleId(null)}
          onConfirm={async () => {
            try {
              await deleteRole.mutateAsync(deletingRoleId);
              toast.success("Role deleted successfully");
              setDeletingRoleId(null);
            } catch (error: any) {
              toast.error(error?.message || "Failed to delete role");
            }
          }}
          title="Delete Role?"
          description="Are you sure you want to delete this role? This action cannot be undone."
          variant="destructive"
          confirmText="Delete"
        />
      )}
    </div>
  );
}

