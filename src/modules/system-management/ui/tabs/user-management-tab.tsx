"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, type CreateUserInput } from "../../domain/user-schema";
import { useCreateUser } from "../../hooks/use-users";
import { useRoles } from "../../hooks/use-system-management";
import { useToast, useUrlState } from "@/lib/hooks";
import { UsersTab } from "./users-tab";
import { UserPermissionsTab } from "./user-permissions-tab";

export function UserManagementTab() {
  // Persist selected user in URL (so it survives refresh)
  const [selectedUserId, setSelectedUserId] = useUrlState<string>("userId", null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [createRoleIds, setCreateRoleIds] = React.useState<string[]>([]);
  const createUser = useCreateUser();
  const { data: roles } = useRoles();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      password: "SuperAdmin@123",
    },
  });

  const onSubmit = async (data: CreateUserInput) => {
    try {
      await createUser.mutateAsync({ ...data, roleIds: createRoleIds });
      reset();
      setCreateRoleIds([]);
      setIsCreateDialogOpen(false);
      toast.success("User created successfully");
    } catch (error: any) {
      // Extract error message from multiple possible locations
      // The API client throws ApiError objects with a 'message' property
      let errorMessage = "Failed to create user";
      
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error;
        } else {
          // Check all possible locations for the error message
          // Priority: direct message > response data > details > error field
          errorMessage = 
            error?.message ||
            error?.response?.data?.message ||
            error?.data?.message ||
            error?.details?.message ||
            (typeof error?.error === 'string' ? error.error : error?.error?.message) ||
            errorMessage;
        }
      }
      
      // Always show toast with the extracted message
      toast.error(errorMessage);
      
      // Improved error logging - log the actual error object and extracted message
      console.error("Failed to create user:", {
        extractedMessage: errorMessage,
        errorObject: error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        hasMessage: !!error?.message,
        messageValue: error?.message,
        statusCode: error?.statusCode,
      });
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base break-words">User Management</CardTitle>
              <p className="text-xs text-muted-foreground mt-1 break-words">
                Manage users, assign roles, and configure explicit permissions (including denials)
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => reset()} className="w-full sm:w-auto flex-shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  New User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" {...register("email")} />
                      {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input id="password" type="password" {...register("password")} />
                      {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" {...register("firstName")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" {...register("lastName")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...register("phone")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign Roles</Label>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                      {roles?.map((role) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={createRoleIds.includes(role.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCreateRoleIds((prev) => [...prev, role.id]);
                              } else {
                                setCreateRoleIds((prev) => prev.filter((id) => id !== role.id));
                              }
                            }}
                          />
                          <Label htmlFor={`role-${role.id}`} className="font-normal cursor-pointer">
                            {role.name}
                            {role.description && <span className="text-xs text-muted-foreground ml-2">({role.description})</span>}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createUser.isPending}>
                      {createUser.isPending ? "Creating..." : "Create User"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {selectedUserId ? (
            <UserPermissionsTab userId={selectedUserId} onBack={() => setSelectedUserId(null)} />
          ) : (
            <UsersTab onSelectUser={setSelectedUserId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

