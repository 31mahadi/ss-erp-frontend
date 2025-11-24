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
import { createModuleSchema, type CreateModuleInput } from "../../domain/schema";
import {
  useCreateModule,
  useDeleteModule,
  useModules,
  useUpdateModule,
} from "../../hooks/use-system-management";

export function ModulesTab() {
  const { data: modules, isLoading } = useModules();
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingModule, setEditingModule] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateModuleInput>({
    resolver: zodResolver(createModuleSchema),
  });

  const nameValue = watch("name");

  const onSubmit = async (data: CreateModuleInput) => {
    try {
      // Auto-generate slug from name (only for new items, preserve existing for edits)
      const slug = editingModule 
        ? modules?.find((m) => m.id === editingModule)?.slug || generateSlug(data.name)
        : generateSlug(data.name);
      
      // Auto-calculate order for new items (max order + 1)
      let order = data.order;
      if (!editingModule) {
        const maxOrder = modules?.reduce((max, m) => Math.max(max, m.order || 0), -1) ?? -1;
        order = maxOrder + 1;
      }

      const submitData = {
        ...data,
        slug,
        order,
      };

      if (editingModule) {
        await updateModule.mutateAsync({ id: editingModule, data: submitData });
      } else {
        await createModule.mutateAsync(submitData);
      }
      reset();
      setIsDialogOpen(false);
      setEditingModule(null);
    } catch (error) {
      console.error("Failed to save module:", error);
    }
  };

  const handleEdit = (module: { id: string; name: string; slug: string; description?: string; icon?: string; order: number }) => {
    setEditingModule(module.id);
    reset({
      name: module.name,
      description: module.description,
      icon: module.icon,
      order: module.order,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this module?")) {
      await deleteModule.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              reset();
              setEditingModule(null);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingModule ? "Edit Module" : "Create Module"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} />
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
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input id="icon" {...register("icon")} placeholder="e.g., 📊 or icon-name" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createModule.isPending || updateModule.isPending}>
                  {editingModule ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules?.map((module) => (
                <TableRow key={module.id}>
                  <TableCell className="font-medium">{module.name}</TableCell>
                  <TableCell>{module.slug}</TableCell>
                  <TableCell>{module.description || "-"}</TableCell>
                  <TableCell>{module.icon || "-"}</TableCell>
                  <TableCell>{module.order}</TableCell>
                  <TableCell>
                    {module.slug !== 'system-management' && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(module)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(module.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
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

