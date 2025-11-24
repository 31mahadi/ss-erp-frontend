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
import { createSubmoduleSchema, type CreateSubmoduleInput } from "../../domain/schema";
import {
  useCreateSubmodule,
  useDeleteSubmodule,
  useModules,
  useSubmodules,
  useUpdateSubmodule,
} from "../../hooks/use-system-management";

export function SubmodulesTab() {
  const { data: modules } = useModules();
  const { data: submodules, isLoading } = useSubmodules();
  const createSubmodule = useCreateSubmodule();
  const updateSubmodule = useUpdateSubmodule();
  const deleteSubmodule = useDeleteSubmodule();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingSubmodule, setEditingSubmodule] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateSubmoduleInput>({
    resolver: zodResolver(createSubmoduleSchema),
  });

  const nameValue = watch("name");
  const moduleIdValue = watch("moduleId");

  const onSubmit = async (data: CreateSubmoduleInput) => {
    try {
      // Auto-generate slug from name (only for new items, preserve existing for edits)
      const slug = editingSubmodule
        ? submodules?.find((s) => s.id === editingSubmodule)?.slug || generateSlug(data.name)
        : generateSlug(data.name);
      
      // Auto-calculate sortOrder for new items (max sortOrder + 1 for the selected module)
      let sortOrder = data.sortOrder;
      if (!editingSubmodule && moduleIdValue) {
        const moduleSubmodules = submodules?.filter((s) => s.moduleId === moduleIdValue) ?? [];
        const maxSortOrder = moduleSubmodules.reduce((max, s) => Math.max(max, s.sortOrder || 0), -1);
        sortOrder = maxSortOrder + 1;
      }

      const submitData = {
        ...data,
        slug,
        sortOrder,
      };

      if (editingSubmodule) {
        await updateSubmodule.mutateAsync({ id: editingSubmodule, data: submitData });
      } else {
        await createSubmodule.mutateAsync(submitData);
      }
      reset();
      setIsDialogOpen(false);
      setEditingSubmodule(null);
    } catch (error) {
      console.error("Failed to save submodule:", error);
    }
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
                setEditingSubmodule(null);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Submodule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubmodule ? "Edit Submodule" : "Create Submodule"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="moduleId">Module</Label>
                <select id="moduleId" {...register("moduleId")} className="w-full p-2 border rounded">
                  <option value="">Select a module</option>
                  {modules?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {errors.moduleId && <p className="text-sm text-destructive">{errors.moduleId.message}</p>}
              </div>
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
                <Input id="icon" {...register("icon")} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSubmodule.isPending || updateSubmodule.isPending}>
                  {editingSubmodule ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Submodules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submodules?.map((submodule) => (
                <TableRow key={submodule.id}>
                  <TableCell>{modules?.find((m) => m.id === submodule.moduleId)?.name || "-"}</TableCell>
                  <TableCell className="font-medium">{submodule.name}</TableCell>
                  <TableCell>{submodule.slug}</TableCell>
                  <TableCell>{submodule.description || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSubmodule(submodule.id);
                          reset({
                            moduleId: submodule.moduleId,
                            name: submodule.name,
                            description: submodule.description,
                            icon: submodule.icon,
                            sortOrder: submodule.sortOrder,
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteSubmodule.mutate(submodule.id)}>
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

