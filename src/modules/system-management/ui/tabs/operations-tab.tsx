"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { generateSlug } from "@/lib/utils/slug";
import { createOperationSchema, type CreateOperationInput } from "../../domain/schema";
import { useCreateOperation, useDeleteOperation, useOperations, useUpdateOperation } from "../../hooks/use-system-management";

export function OperationsTab() {
  const { data: operations, isLoading } = useOperations();
  const createOperation = useCreateOperation();
  const updateOperation = useUpdateOperation();
  const deleteOperation = useDeleteOperation();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingOperation, setEditingOperation] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateOperationInput>({
    resolver: zodResolver(createOperationSchema),
  });

  const nameValue = watch("name");

  const onSubmit = async (data: CreateOperationInput) => {
    try {
      // Auto-generate slug from name (only for new items, preserve existing for edits)
      const slug = editingOperation
        ? operations?.find((o) => o.id === editingOperation)?.slug || generateSlug(data.name)
        : generateSlug(data.name);

      // Auto-calculate sortOrder for new items (max sortOrder + 1)
      let sortOrder = data.sortOrder;
      if (!editingOperation) {
        const maxSortOrder = operations?.reduce((max, o) => Math.max(max, o.sortOrder || 0), -1) ?? -1;
        sortOrder = maxSortOrder + 1;
      }

      const submitData = {
        ...data,
        slug,
        sortOrder,
      };

      if (editingOperation) {
        await updateOperation.mutateAsync({ id: editingOperation, data: submitData });
      } else {
        await createOperation.mutateAsync(submitData);
      }
      reset();
      setIsDialogOpen(false);
      setEditingOperation(null);
    } catch (error) {
      console.error("Failed to save operation:", error);
    }
  };

  const handleEdit = (operation: { id: string; name: string; slug: string; description?: string; sortOrder: number }) => {
    setEditingOperation(operation.id);
    reset({
      name: operation.name,
      description: operation.description,
      sortOrder: operation.sortOrder,
    });
    setIsDialogOpen(true);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                reset();
                setEditingOperation(null);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Operation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingOperation ? "Edit Operation" : "Create Operation"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} placeholder="e.g., Read, Create, Update, Delete" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                {nameValue && (
                  <p className="text-xs text-muted-foreground">
                    Slug: {generateSlug(nameValue)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...register("description")} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createOperation.isPending || updateOperation.isPending}>
                  {editingOperation ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations?.map((operation) => (
                <TableRow key={operation.id}>
                  <TableCell className="font-medium">{operation.name}</TableCell>
                  <TableCell>{operation.slug}</TableCell>
                  <TableCell>{operation.description || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(operation)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteOperation.mutate(operation.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

