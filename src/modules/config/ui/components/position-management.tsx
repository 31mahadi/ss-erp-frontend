"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { usePositions, useCreatePosition, useUpdatePosition, useDeletePosition, useAllDepartments } from "../../hooks/use-config";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPositionSchema, updatePositionSchema, type CreatePositionInput, type UpdatePositionInput } from "../../domain/position-schema";
import { useToast } from "@/lib/hooks";
import { usePermission } from "@/lib/hooks/use-permission";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Search, Edit, Trash2, Briefcase } from "lucide-react";
import * as React from "react";

export function PositionManagement() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [editingPositionId, setEditingPositionId] = React.useState<string | null>(null);
  const [deletingPositionId, setDeletingPositionId] = React.useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const canRead = usePermission("system-management:config:position-list:read");
  const canCreate = usePermission("system-management:config:position-list:create");
  const canUpdate = usePermission("system-management:config:position-list:update");
  const canDelete = usePermission("system-management:config:position-list:delete");

  const { data: positionsData, isLoading } = usePositions({ page, limit: 20, search: search || undefined });
  const { data: allDepartments } = useAllDepartments();
  const createPosition = useCreatePosition();
  const updatePosition = useUpdatePosition();
  const deletePosition = useDeletePosition();
  const toast = useToast();

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: errorsCreate },
  } = useForm<CreatePositionInput>({
    resolver: zodResolver(createPositionSchema),
    defaultValues: {
      code: `POS${Date.now().toString().slice(-4)}`,
      name: "Software Engineer",
      description: "Test position",
      level: "Mid",
      sortOrder: 0,
    },
  });

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    reset: resetUpdate,
    formState: { errors: errorsUpdate },
    setValue: setValueUpdate,
  } = useForm<UpdatePositionInput>({
    resolver: zodResolver(updatePositionSchema),
  });

  React.useEffect(() => {
    if (editingPositionId && positionsData?.data) {
      const position = positionsData.data.find((p) => p.id === editingPositionId);
      if (position) {
        setValueUpdate("code", position.code);
        setValueUpdate("name", position.name);
        setValueUpdate("description", position.description);
        setValueUpdate("department", position.department);
        setValueUpdate("level", position.level);
        setValueUpdate("sortOrder", position.sortOrder);
        setValueUpdate("isActive", position.isActive);
      }
    }
  }, [editingPositionId, positionsData, setValueUpdate]);

  const onSubmitCreate = async (data: CreatePositionInput) => {
    try {
      await createPosition.mutateAsync(data);
      resetCreate({
        code: `POS${Date.now().toString().slice(-4)}`,
        name: "Software Engineer",
        description: "Test position",
        level: "Mid",
        sortOrder: 0,
      });
      setIsCreateDialogOpen(false);
      toast.success("Position created successfully");
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.details?.message ||
        "Failed to create position";
      toast.error(errorMessage);
    }
  };

  const onSubmitUpdate = async (data: UpdatePositionInput) => {
    if (!editingPositionId) return;
    try {
      await updatePosition.mutateAsync({ id: editingPositionId, data });
      setEditingPositionId(null);
      resetUpdate();
      toast.success("Position updated successfully");
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.details?.message ||
        "Failed to update position";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!deletingPositionId) return;
    try {
      await deletePosition.mutateAsync(deletingPositionId);
      setDeletingPositionId(null);
      toast.success("Position deleted successfully");
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.details?.message ||
        "Failed to delete position";
      toast.error(errorMessage);
    }
  };

  if (!canRead) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">You don't have permission to view positions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Positions</h3>
          <p className="text-xs text-muted-foreground">Manage position master data</p>
        </div>
        {canCreate && (
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (open) {
              resetCreate({
                code: `POS${Date.now().toString().slice(-4)}`,
                name: "Software Engineer",
                description: "Test position",
                level: "Mid",
                sortOrder: 0,
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Position
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Position</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code (optional - auto-generated if not provided)</Label>
                  <Input id="code" {...registerCreate("code")} placeholder="SE" />
                  {errorsCreate.code && (
                    <p className="text-xs text-destructive">{errorsCreate.code.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" {...registerCreate("name")} placeholder="Software Engineer" />
                  {errorsCreate.name && (
                    <p className="text-xs text-destructive">{errorsCreate.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...registerCreate("description")} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <select
                      id="department"
                      {...registerCreate("department")}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="">Select a department</option>
                      {allDepartments?.map((dept) => (
                        <option key={dept.id} value={dept.code}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Input id="level" {...registerCreate("level")} placeholder="Senior" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input id="sortOrder" type="number" {...registerCreate("sortOrder", { valueAsNumber: true })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPosition.isPending}>
                    {createPosition.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search positions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : positionsData?.data && positionsData.data.length > 0 ? (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  {(canUpdate || canDelete) && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {positionsData.data.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">{position.code}</TableCell>
                    <TableCell>{position.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {position.description || "-"}
                    </TableCell>
                    <TableCell>{position.department || "-"}</TableCell>
                    <TableCell>{position.level || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={position.isActive ? "default" : "secondary"}>
                        {position.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPositionId(position.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingPositionId(position.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {positionsData.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {positionsData.page} of {positionsData.totalPages} ({positionsData.total} total)
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
                  onClick={() => setPage((p) => Math.min(positionsData.totalPages, p + 1))}
                  disabled={page === positionsData.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No positions found</p>
        </div>
      )}

      {editingPositionId && (
        <Dialog open={!!editingPositionId} onOpenChange={() => setEditingPositionId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Position</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitUpdate(onSubmitUpdate)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Code</Label>
                <Input id="edit-code" {...registerUpdate("code")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" {...registerUpdate("name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" {...registerUpdate("description")} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <select
                    id="edit-department"
                    {...registerUpdate("department")}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="">Select a department</option>
                    {allDepartments?.map((dept) => (
                      <option key={dept.id} value={dept.code}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-level">Level</Label>
                  <Input id="edit-level" {...registerUpdate("level")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sortOrder">Sort Order</Label>
                <Input id="edit-sortOrder" type="number" {...registerUpdate("sortOrder", { valueAsNumber: true })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingPositionId(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePosition.isPending}>
                  {updatePosition.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {deletingPositionId && (
        <ConfirmDialog
          open={!!deletingPositionId}
          onOpenChange={() => setDeletingPositionId(null)}
          onConfirm={handleDelete}
          title="Delete Position"
          description="Are you sure you want to delete this position? This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
        />
      )}
    </div>
  );
}

