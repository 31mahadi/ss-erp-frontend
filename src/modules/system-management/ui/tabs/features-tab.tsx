"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Settings } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { generateSlug } from "@/lib/utils/slug";
import { createFeatureSchema, type CreateFeatureInput } from "../../domain/schema";
import {
  useCreateFeature,
  useDeleteFeature,
  useFeatures,
  useSubmodules,
  useUpdateFeature,
  useFeatureOperations,
  useAddOperationToFeature,
  useRemoveOperationFromFeature,
  useOperations,
} from "../../hooks/use-system-management";

export function FeaturesTab() {
  const { data: submodules } = useSubmodules();
  const { data: features, isLoading } = useFeatures();
  const { data: operations } = useOperations();
  const createFeature = useCreateFeature();
  const updateFeature = useUpdateFeature();
  const deleteFeature = useDeleteFeature();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingFeature, setEditingFeature] = React.useState<string | null>(null);
  const [selectedFeatureForOps, setSelectedFeatureForOps] = React.useState<string | null>(null);
  const [isOperationsDialogOpen, setIsOperationsDialogOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateFeatureInput>({
    resolver: zodResolver(createFeatureSchema),
  });

  const nameValue = watch("name");
  const submoduleIdValue = watch("submoduleId");

  const { data: featureOperations } = useFeatureOperations(selectedFeatureForOps || "");
  const addOperationToFeature = useAddOperationToFeature();
  const removeOperationFromFeature = useRemoveOperationFromFeature();

  const onSubmit = async (data: CreateFeatureInput) => {
    try {
      // Auto-generate slug from name (only for new items, preserve existing for edits)
      const slug = editingFeature
        ? features?.find((f) => f.id === editingFeature)?.slug || generateSlug(data.name)
        : generateSlug(data.name);

      // Auto-calculate sortOrder for new items (max sortOrder + 1 for the selected submodule)
      let sortOrder = data.sortOrder;
      if (!editingFeature && submoduleIdValue) {
        const submoduleFeatures = features?.filter((f) => f.submoduleId === submoduleIdValue) ?? [];
        const maxSortOrder = submoduleFeatures.reduce((max, f) => Math.max(max, f.sortOrder || 0), -1);
        sortOrder = maxSortOrder + 1;
      }

      const submitData = {
        ...data,
        slug,
        sortOrder,
      };

      if (editingFeature) {
        await updateFeature.mutateAsync({ id: editingFeature, data: submitData });
      } else {
        await createFeature.mutateAsync(submitData);
      }
      reset();
      setIsDialogOpen(false);
      setEditingFeature(null);
    } catch (error) {
      console.error("Failed to save feature:", error);
    }
  };

  const handleEdit = (feature: {
    id: string;
    name: string;
    slug: string;
    submoduleId: string;
    description?: string;
    route?: string;
    icon?: string;
    sortOrder: number;
  }) => {
    setEditingFeature(feature.id);
    reset({
      submoduleId: feature.submoduleId,
      name: feature.name,
      description: feature.description,
      route: feature.route,
      icon: feature.icon,
      sortOrder: feature.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const handleManageOperations = (featureId: string) => {
    setSelectedFeatureForOps(featureId);
    setIsOperationsDialogOpen(true);
  };

  const handleAddOperation = async (operationId: string) => {
    if (!selectedFeatureForOps) return;
    try {
      await addOperationToFeature.mutateAsync({
        featureId: selectedFeatureForOps,
        operationId,
        isDefault: false,
      });
    } catch (error) {
      console.error("Failed to add operation:", error);
    }
  };

  const handleRemoveOperation = async (operationId: string) => {
    if (!selectedFeatureForOps) return;
    try {
      await removeOperationFromFeature.mutateAsync({
        featureId: selectedFeatureForOps,
        operationId,
      });
    } catch (error) {
      console.error("Failed to remove operation:", error);
    }
  };

  const selectedFeature = features?.find((f) => f.id === selectedFeatureForOps);
  const assignedOperationIds = featureOperations?.map((fo) => fo.operationId) ?? [];
  const availableOperations = operations?.filter((op) => !assignedOperationIds.includes(op.id)) ?? [];

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Features</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                reset();
                setEditingFeature(null);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Feature
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFeature ? "Edit Feature" : "Create Feature"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="submoduleId">Submodule</Label>
                <select id="submoduleId" {...register("submoduleId")} className="w-full p-2 border rounded">
                  <option value="">Select a submodule</option>
                  {submodules?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.submoduleId && <p className="text-sm text-destructive">{errors.submoduleId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                {nameValue && (
                  <p className="text-xs text-muted-foreground">Slug: {generateSlug(nameValue)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="route">Route</Label>
                <Input id="route" {...register("route")} placeholder="/path/to/feature" />
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
                <Button type="submit" disabled={createFeature.isPending || updateFeature.isPending}>
                  {editingFeature ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Features</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submodule</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Operations</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features?.map((feature) => {
                const featureOps = feature.featureOperations || [];
                return (
                  <TableRow key={feature.id}>
                    <TableCell>{submodules?.find((s) => s.id === feature.submoduleId)?.name || "-"}</TableCell>
                    <TableCell className="font-medium">{feature.name}</TableCell>
                    <TableCell>{feature.slug}</TableCell>
                    <TableCell>{feature.route || "-"}</TableCell>
                    <TableCell>
                      {featureOps.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {featureOps.map((fo) => (
                            <span
                              key={fo.id}
                              className="px-2 py-1 text-xs bg-muted rounded"
                              title={fo.operation?.name}
                            >
                              {fo.operation?.slug || fo.operationId}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No operations</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(feature)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleManageOperations(feature.id)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteFeature.mutate(feature.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Operations Management Dialog */}
      <Dialog open={isOperationsDialogOpen} onOpenChange={setIsOperationsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Operations - {selectedFeature?.name || "Feature"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Assigned Operations</h3>
              {featureOperations && featureOperations.length > 0 ? (
                <div className="space-y-2">
                  {featureOperations.map((fo) => {
                    const operation = operations?.find((op) => op.id === fo.operationId);
                    return (
                      <div key={fo.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{operation?.name || fo.operationId}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({operation?.slug || "unknown"})
                          </span>
                          {fo.isDefault && (
                            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveOperation(fo.operationId)}
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No operations assigned</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Available Operations</h3>
              {availableOperations.length > 0 ? (
                <div className="space-y-2">
                  {availableOperations.map((operation) => (
                    <div key={operation.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{operation.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">({operation.slug})</span>
                      </div>
                      <Button size="sm" onClick={() => handleAddOperation(operation.id)}>
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">All operations are assigned</p>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsOperationsDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
