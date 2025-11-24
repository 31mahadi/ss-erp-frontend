"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
        </CardHeader>
        <CardContent>
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

