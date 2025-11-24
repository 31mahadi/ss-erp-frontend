"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRoleSchema, type CreateRoleInput } from "../../domain/schema";
import { useCreateRole } from "../../hooks/use-system-management";
import { useToast } from "@/lib/hooks/use-toast";
import { RolePermissionsTab } from "./role-permissions-tab";
import { RolesTab } from "./roles-tab";

export function RoleManagementTab() {
  const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const createRole = useCreateRole();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
  });

  const onSubmit = async (data: CreateRoleInput) => {
    try {
      await createRole.mutateAsync(data);
      reset();
      setIsCreateDialogOpen(false);
      toast.success("Role created successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create role");
      console.error("Failed to create role:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Role Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Create and manage roles, then assign permissions to each role
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => reset()}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" {...register("name")} placeholder="e.g., Manager" />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" {...register("description")} placeholder="Optional description" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createRole.isPending}>
                      {createRole.isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {selectedRoleId ? (
            <RolePermissionsTab roleId={selectedRoleId} onBack={() => setSelectedRoleId(null)} />
          ) : (
            <RolesTab onSelectRole={setSelectedRoleId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

