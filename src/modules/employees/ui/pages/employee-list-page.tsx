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
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, useAllEmployees } from "../../hooks/use-employees";
import { useAllDepartments, useAllPositions } from "@/modules/config/hooks/use-config";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmployeeSchema, updateEmployeeSchema, type CreateEmployeeInput, type UpdateEmployeeInput } from "../../domain/employee-schema";
import { useToast } from "@/lib/hooks";
import { usePermission } from "@/lib/hooks/use-permission";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useRoles } from "@/modules/system-management/hooks/use-system-management";
import { Plus, Search, Edit, Trash2, Mail, Phone, Building2, Briefcase, User } from "lucide-react";
import * as React from "react";

export function EmployeeListPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [editingEmployeeId, setEditingEmployeeId] = React.useState<string | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = React.useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const canRead = usePermission("hr:employee:employee-list:read");
  const canCreate = usePermission("hr:employee:employee-list:create");
  const canUpdate = usePermission("hr:employee:employee-list:update");
  const canDelete = usePermission("hr:employee:employee-list:delete");

  const { data: employeesData, isLoading } = useEmployees({ page, limit: 20, search: search || undefined });
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const toast = useToast();

  const { data: allEmployees } = useAllEmployees();
  const { data: allDepartments } = useAllDepartments();
  const { data: allPositions } = useAllPositions();
  const { data: roles } = useRoles();

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    watch: watchCreate,
    control: controlCreate,
    formState: { errors: errorsCreate },
  } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      employeeId: `EMP${Date.now().toString().slice(-6)}`,
      firstName: "John",
      lastName: "Doe",
      email: `john.doe.${Date.now()}@example.com`,
      phone: "+1234567890",
      department: "HR",
      position: "Software Engineer",
      dateOfBirth: "1990-01-15",
      hireDate: new Date().toISOString().split("T")[0],
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
      notes: "Test employee for development",
      createUser: false,
      password: "",
      roleIds: [],
    },
  });

  const createUserChecked = watchCreate("createUser");

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    reset: resetUpdate,
    watch: watchUpdate,
    control: controlUpdate,
    formState: { errors: errorsUpdate },
    setValue: setValueUpdate,
  } = useForm<UpdateEmployeeInput>({
    resolver: zodResolver(updateEmployeeSchema),
  });

  const selectedDepartmentUpdate = watchUpdate("department");

  // Load employee data for editing
  React.useEffect(() => {
    if (editingEmployeeId && employeesData?.data) {
      const employee = employeesData.data.find((e) => e.id === editingEmployeeId);
      if (employee) {
        setValueUpdate("employeeId", employee.employeeId);
        setValueUpdate("firstName", employee.firstName);
        setValueUpdate("lastName", employee.lastName);
        setValueUpdate("email", employee.email);
        setValueUpdate("phone", employee.phone);
        setValueUpdate("department", employee.department);
        setValueUpdate("position", employee.position);
        setValueUpdate("dateOfBirth", employee.dateOfBirth);
        setValueUpdate("hireDate", employee.hireDate);
        setValueUpdate("address", employee.address);
        setValueUpdate("city", employee.city);
        setValueUpdate("state", employee.state);
        setValueUpdate("zipCode", employee.zipCode);
        setValueUpdate("country", employee.country);
        setValueUpdate("notes", employee.notes);
        setValueUpdate("isActive", employee.isActive);
      }
    }
  }, [editingEmployeeId, employeesData, setValueUpdate]);

  const onSubmitCreate = async (data: CreateEmployeeInput) => {
    try {
      await createEmployee.mutateAsync(data);
      resetCreate();
      setIsCreateDialogOpen(false);
      toast.success("Employee created successfully");
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.details?.message ||
        "Failed to create employee";
      toast.error(errorMessage);
    }
  };

  const onSubmitUpdate = async (data: UpdateEmployeeInput) => {
    if (!editingEmployeeId) return;
    try {
      await updateEmployee.mutateAsync({ id: editingEmployeeId, data });
      setEditingEmployeeId(null);
      resetUpdate();
      toast.success("Employee updated successfully");
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.details?.message ||
        "Failed to update employee";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!deletingEmployeeId) return;
    try {
      await deleteEmployee.mutateAsync(deletingEmployeeId);
      setDeletingEmployeeId(null);
      toast.success("Employee deleted successfully");
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.details?.message ||
        "Failed to delete employee";
      toast.error(errorMessage);
    }
  };

  if (!canRead) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You don't have permission to view employees.</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Employee List"
        description="Manage employee information and records"
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base break-words">Employees</CardTitle>
              <p className="text-xs text-muted-foreground mt-1 break-words">
                View and manage employee records
              </p>
            </div>
            {canCreate && (
              <Dialog 
                open={isCreateDialogOpen} 
                onOpenChange={(open) => {
                  setIsCreateDialogOpen(open);
                  if (open) {
                    // Reset form with fresh test data when dialog opens
                    const timestamp = Date.now();
                    resetCreate({
                      employeeId: `EMP${timestamp.toString().slice(-6)}`,
                      firstName: "John",
                      lastName: "Doe",
                      email: `john.doe.${timestamp}@example.com`,
                      phone: "+1234567890",
                      department: "HR",
                      position: "Software Engineer",
                      dateOfBirth: "1990-01-15",
                      hireDate: new Date().toISOString().split("T")[0],
                      address: "123 Main Street",
                      city: "New York",
                      state: "NY",
                      zipCode: "10001",
                      country: "USA",
                      notes: "Test employee for development",
                      createUser: false,
                      password: "",
                      roleIds: [],
                    });
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto flex-shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    New Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Employee</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-4">
                    <div className="rounded-lg bg-muted/50 p-3 mb-4">
                      <p className="text-xs text-muted-foreground">
                        💡 <strong>Test Mode:</strong> Form is pre-filled with test data. You can modify any field before submitting.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employeeId">Employee ID *</Label>
                        <Input
                          id="employeeId"
                          {...registerCreate("employeeId")}
                          placeholder="EMP001"
                        />
                        {errorsCreate.employeeId && (
                          <p className="text-xs text-destructive">{errorsCreate.employeeId.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...registerCreate("email")}
                          placeholder="john.doe@example.com"
                        />
                        {errorsCreate.email && (
                          <p className="text-xs text-destructive">{errorsCreate.email.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" {...registerCreate("firstName")} placeholder="John" />
                        {errorsCreate.firstName && (
                          <p className="text-xs text-destructive">{errorsCreate.firstName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input id="lastName" {...registerCreate("lastName")} placeholder="Doe" />
                        {errorsCreate.lastName && (
                          <p className="text-xs text-destructive">{errorsCreate.lastName.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" {...registerCreate("phone")} placeholder="+1234567890" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Controller
                          name="department"
                          control={controlCreate}
                          render={({ field }) => (
                            <select
                              id="department"
                              {...field}
                              className="w-full p-2 border rounded-md bg-background"
                            >
                              <option value="">Select a department</option>
                              {allDepartments?.map((dept) => (
                                <option key={dept.id} value={dept.code}>
                                  {dept.name} ({dept.code})
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Controller
                          name="position"
                          control={controlCreate}
                          render={({ field }) => {
                            const selectedDepartment = watchCreate("department");
                            // Filter positions by selected department if department is selected
                            const filteredPositions = selectedDepartment
                              ? allPositions?.filter((pos) => pos.department === selectedDepartment || !pos.department)
                              : allPositions;
                            
                            return (
                              <select
                                id="position"
                                value={field.value || ""}
                                onChange={(e) => {
                                  // Find the selected position and use its name as the value
                                  const selectedPos = filteredPositions?.find((pos) => pos.code === e.target.value);
                                  field.onChange(selectedPos ? selectedPos.name : "");
                                }}
                                className="w-full p-2 border rounded-md bg-background"
                              >
                                <option value="">Select a position</option>
                                {filteredPositions?.map((pos) => {
                                  const displayName = pos.level
                                    ? `${pos.name} (${pos.level})`
                                    : pos.name;
                                  const displayText = pos.department
                                    ? `${displayName} - ${pos.department}`
                                    : displayName;
                                  return (
                                    <option key={pos.id} value={pos.code}>
                                      {displayText}
                                    </option>
                                  );
                                })}
                              </select>
                            );
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input id="dateOfBirth" type="date" {...registerCreate("dateOfBirth")} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hireDate">Hire Date</Label>
                      <Input id="hireDate" type="date" {...registerCreate("hireDate")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" {...registerCreate("address")} placeholder="123 Main St" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" {...registerCreate("city")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" {...registerCreate("state")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input id="zipCode" {...registerCreate("zipCode")} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" {...registerCreate("country")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" {...registerCreate("notes")} rows={3} />
                    </div>
                    
                    {/* User Creation Section */}
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Controller
                          name="createUser"
                          control={controlCreate}
                          render={({ field }) => (
                            <Checkbox
                              id="createUser"
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label htmlFor="createUser" className="font-normal cursor-pointer">
                          Also create user account for this employee
                        </Label>
                      </div>
                      
                      {createUserChecked && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <Input
                              id="password"
                              type="password"
                              {...registerCreate("password")}
                              placeholder="Enter password"
                            />
                            {errorsCreate.password && (
                              <p className="text-xs text-destructive">{errorsCreate.password.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="roleIds">Roles *</Label>
                            <Controller
                              name="roleIds"
                              control={controlCreate}
                              render={({ field }) => (
                                <select
                                  id="roleIds"
                                  multiple
                                  className="w-full p-2 border rounded-md bg-background min-h-[100px]"
                                  value={field.value || []}
                                  onChange={(e) => {
                                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                    field.onChange(selectedOptions);
                                  }}
                                >
                                  {roles?.map((role) => (
                                    <option key={role.id} value={role.id}>
                                      {role.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            />
                            {errorsCreate.roleIds && (
                              <p className="text-xs text-destructive">{errorsCreate.roleIds.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Hold Ctrl/Cmd to select multiple roles
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // Reset form with fresh test data
                          const timestamp = Date.now();
                          resetCreate({
                            employeeId: `EMP${timestamp.toString().slice(-6)}`,
                            firstName: "John",
                            lastName: "Doe",
                            email: `john.doe.${timestamp}@example.com`,
                            phone: "+1234567890",
                            department: "HR",
                            position: "Software Engineer",
                            dateOfBirth: "1990-01-15",
                            hireDate: new Date().toISOString().split("T")[0],
                            address: "123 Main Street",
                            city: "New York",
                            state: "NY",
                            zipCode: "10001",
                            country: "USA",
                            notes: "Test employee for development",
                            createUser: false,
                            password: "",
                            roleIds: [],
                          });
                        }}
                      >
                        Reset Form
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createEmployee.isPending}>
                        {createEmployee.isPending ? "Creating..." : "Create Employee"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
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
          ) : employeesData?.data && employeesData.data.length > 0 ? (
            <>
              {/* Mobile: Card view */}
              <div className="md:hidden space-y-4">
                {employeesData.data.map((employee) => (
                  <Card key={employee.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{employee.employeeId}</div>
                          </div>
                        </div>
                        <Badge variant={employee.isActive ? "default" : "secondary"}>
                          {employee.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        {employee.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{employee.email}</span>
                          </div>
                        )}
                        {employee.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{employee.phone}</span>
                          </div>
                        )}
                        {employee.department && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>{employee.department}</span>
                          </div>
                        )}
                        {employee.position && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Briefcase className="h-4 w-4" />
                            <span>{employee.position}</span>
                          </div>
                        )}
                      </div>
                      {(canUpdate || canDelete) && (
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          {canUpdate && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => setEditingEmployeeId(employee.id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => setDeletingEmployeeId(employee.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop: Table view */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      {(canUpdate || canDelete) && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeesData.data.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {employee.firstName[0]}{employee.lastName[0]}
                            </div>
                            <div>
                              <div className="font-medium">
                                {employee.firstName} {employee.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">{employee.employeeId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {employee.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span>{employee.email}</span>
                              </div>
                            )}
                            {employee.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{employee.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {employee.department || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {employee.position || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={employee.isActive ? "default" : "secondary"}>
                            {employee.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        {(canUpdate || canDelete) && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {canUpdate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingEmployeeId(employee.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingEmployeeId(employee.id)}
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

              {/* Pagination */}
              {employeesData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {employeesData.page} of {employeesData.totalPages} ({employeesData.total} total)
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
                      onClick={() => setPage((p) => Math.min(employeesData.totalPages, p + 1))}
                      disabled={page === employeesData.totalPages}
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
              <p>No employees found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      {editingEmployeeId && (
        <Dialog open={!!editingEmployeeId} onOpenChange={() => setEditingEmployeeId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitUpdate(onSubmitUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-employeeId">Employee ID</Label>
                  <Input id="edit-employeeId" {...registerUpdate("employeeId")} />
                  {errorsUpdate.employeeId && (
                    <p className="text-xs text-destructive">{errorsUpdate.employeeId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" {...registerUpdate("email")} />
                  {errorsUpdate.email && (
                    <p className="text-xs text-destructive">{errorsUpdate.email.message}</p>
                  )}
                </div>
              </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" {...registerUpdate("phone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Controller
                    name="department"
                    control={controlUpdate}
                    render={({ field }) => (
                      <select
                        id="edit-department"
                        {...field}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">Select a department</option>
                        {allDepartments?.map((dept) => (
                          <option key={dept.id} value={dept.code}>
                            {dept.name} ({dept.code})
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-position">Position</Label>
                  <Controller
                    name="position"
                    control={controlUpdate}
                    render={({ field }) => {
                      // Filter positions by selected department if department is selected
                      const filteredPositions = selectedDepartmentUpdate
                        ? allPositions?.filter((pos) => pos.department === selectedDepartmentUpdate || !pos.department)
                        : allPositions;
                      
                      // Find the current position code based on the position name
                      const currentPositionCode = allPositions?.find((pos) => pos.name === field.value)?.code || "";
                      
                      return (
                        <select
                          id="edit-position"
                          value={currentPositionCode}
                          onChange={(e) => {
                            // Find the selected position and use its name as the value
                            const selectedPos = filteredPositions?.find((pos) => pos.code === e.target.value);
                            field.onChange(selectedPos ? selectedPos.name : "");
                          }}
                          className="w-full p-2 border rounded-md bg-background"
                        >
                          <option value="">Select a position</option>
                          {filteredPositions?.map((pos) => {
                            const displayName = pos.level
                              ? `${pos.name} (${pos.level})`
                              : pos.name;
                            const displayText = pos.department
                              ? `${displayName} - ${pos.department}`
                              : displayName;
                            return (
                              <option key={pos.id} value={pos.code}>
                                {displayText}
                              </option>
                            );
                          })}
                        </select>
                      );
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                  <Input id="edit-dateOfBirth" type="date" {...registerUpdate("dateOfBirth")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hireDate">Hire Date</Label>
                <Input id="edit-hireDate" type="date" {...registerUpdate("hireDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input id="edit-address" {...registerUpdate("address")} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input id="edit-city" {...registerUpdate("city")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-state">State</Label>
                  <Input id="edit-state" {...registerUpdate("state")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-zipCode">Zip Code</Label>
                  <Input id="edit-zipCode" {...registerUpdate("zipCode")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Input id="edit-country" {...registerUpdate("country")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea id="edit-notes" {...registerUpdate("notes")} rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingEmployeeId(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateEmployee.isPending}>
                  {updateEmployee.isPending ? "Updating..." : "Update Employee"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingEmployeeId && (
        <ConfirmDialog
          open={!!deletingEmployeeId}
          onOpenChange={() => setDeletingEmployeeId(null)}
          onConfirm={handleDelete}
          title="Delete Employee"
          description="Are you sure you want to delete this employee? This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
        />
      )}
    </PageContainer>
  );
}

