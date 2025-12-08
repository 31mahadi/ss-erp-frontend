"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from "../../hooks/use-config";
import { useAllEmployees } from "@/modules/employees/hooks/use-employees";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDepartmentSchema, updateDepartmentSchema, type CreateDepartmentInput, type UpdateDepartmentInput } from "../../domain/department-schema";
import { useToast } from "@/lib/hooks";
import { usePermission } from "@/lib/hooks/use-permission";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Search, Edit, Trash2, Building2 } from "lucide-react";
import * as React from "react";

export function DepartmentManagement() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [editingDepartmentId, setEditingDepartmentId] = React.useState<string | null>(null);
  const [deletingDepartmentId, setDeletingDepartmentId] = React.useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const canRead = usePermission("system-management:config:department-list:read");
  const canCreate = usePermission("system-management:config:department-list:create");
  const canUpdate = usePermission("system-management:config:department-list:update");
  const canDelete = usePermission("system-management:config:department-list:delete");

  const { data: departmentsData, isLoading } = useDepartments({ page, limit: 20, search: search || undefined });
  const { data: allEmployees } = useAllEmployees();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();
  const toast = useToast();

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: errorsCreate },
  } = useForm<CreateDepartmentInput>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: {
      code: `DEPT${Date.now().toString().slice(-4)}`,
      name: "Human Resources",
      description: "Test department",
      sortOrder: 0,
    },
  });

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    reset: resetUpdate,
    formState: { errors: errorsUpdate },
    setValue: setValueUpdate,
  } = useForm<UpdateDepartmentInput>({
    resolver: zodResolver(updateDepartmentSchema),
  });

  React.useEffect(() => {
    if (editingDepartmentId && departmentsData?.data) {
      const department = departmentsData.data.find((d) => d.id === editingDepartmentId);
      if (department) {
        setValueUpdate("code", department.code);
        setValueUpdate("name", department.name);
        setValueUpdate("description", department.description);
        setValueUpdate("headOfDepartment", department.headOfDepartment);
        setValueUpdate("sortOrder", department.sortOrder);
        setValueUpdate("isActive", department.isActive);
      }
    }
  }, [editingDepartmentId, departmentsData, setValueUpdate]);

  const onSubmitCreate = async (data: CreateDepartmentInput) => {
    try {
      await createDepartment.mutateAsync(data);
      resetCreate({
        code: `DEPT${Date.now().toString().slice(-4)}`,
        name: "Human Resources",
        description: "Test department",
        sortOrder: 0,
      });
      setIsCreateDialogOpen(false);
      toast.success("Department created successfully");
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.details?.message ||
        "Failed to create department";
      toast.error(errorMessage);
    }
  };

  const onSubmitUpdate = async (data: UpdateDepartmentInput) => {
    if (!editingDepartmentId) return;
    try {
      await updateDepartment.mutateAsync({ id: editingDepartmentId, data });
      setEditingDepartmentId(null);
      resetUpdate();
      toast.success("Department updated successfully");
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.details?.message ||
        "Failed to update department";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!deletingDepartmentId) return;
    try {
      await deleteDepartment.mutateAsync(deletingDepartmentId);
      setDeletingDepartmentId(null);
      toast.success("Department deleted successfully");
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.details?.message ||
        "Failed to delete department";
      toast.error(errorMessage);
    }
  };

  if (!canRead) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">You don't have permission to view departments.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Departments</h3>
          <p className="text-xs text-muted-foreground">Manage department master data</p>
        </div>
        {canCreate && (
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (open) {
              resetCreate({
                code: `DEPT${Date.now().toString().slice(-4)}`,
                name: "Human Resources",
                description: "Test department",
                sortOrder: 0,
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Department</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code (optional - auto-generated if not provided)</Label>
                  <Input id="code" {...registerCreate("code")} placeholder="HR" />
                  {errorsCreate.code && (
                    <p className="text-xs text-destructive">{errorsCreate.code.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" {...registerCreate("name")} placeholder="Human Resources" />
                  {errorsCreate.name && (
                    <p className="text-xs text-destructive">{errorsCreate.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...registerCreate("description")} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headOfDepartment">Head of Department</Label>
                  <select
                    id="headOfDepartment"
                    {...registerCreate("headOfDepartment")}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="">Select an employee</option>
                    {allEmployees?.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input id="sortOrder" type="number" {...registerCreate("sortOrder", { valueAsNumber: true })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createDepartment.isPending}>
                    {createDepartment.isPending ? "Creating..." : "Create"}
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
            placeholder="Search departments..."
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
      ) : departmentsData?.data && departmentsData.data.length > 0 ? (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Head</TableHead>
                  <TableHead>Status</TableHead>
                  {(canUpdate || canDelete) && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentsData.data.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.code}</TableCell>
                    <TableCell>{department.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {department.description || "-"}
                    </TableCell>
                    <TableCell>{department.headOfDepartment || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={department.isActive ? "default" : "secondary"}>
                        {department.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingDepartmentId(department.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingDepartmentId(department.id)}
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

          {departmentsData.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {departmentsData.page} of {departmentsData.totalPages} ({departmentsData.total} total)
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
                  onClick={() => setPage((p) => Math.min(departmentsData.totalPages, p + 1))}
                  disabled={page === departmentsData.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No departments found</p>
        </div>
      )}

      {editingDepartmentId && (
        <Dialog open={!!editingDepartmentId} onOpenChange={() => setEditingDepartmentId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
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
              <div className="space-y-2">
                <Label htmlFor="edit-headOfDepartment">Head of Department</Label>
                <select
                  id="edit-headOfDepartment"
                  {...registerUpdate("headOfDepartment")}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="">Select an employee</option>
                  {allEmployees?.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sortOrder">Sort Order</Label>
                <Input id="edit-sortOrder" type="number" {...registerUpdate("sortOrder", { valueAsNumber: true })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingDepartmentId(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateDepartment.isPending}>
                  {updateDepartment.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {deletingDepartmentId && (
        <ConfirmDialog
          open={!!deletingDepartmentId}
          onOpenChange={() => setDeletingDepartmentId(null)}
          onConfirm={handleDelete}
          title="Delete Department"
          description="Are you sure you want to delete this department? This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
        />
      )}
    </div>
  );
}

