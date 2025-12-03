"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, FolderTree, ChevronDown, ChevronRight } from "lucide-react";
import * as React from "react";
import { useHierarchicalPermissionTree } from "../../hooks/use-system-management";
import { PermissionTree } from "../components/permission-tree";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateModule, useUpdateModule, useDeleteModule, useModule } from "../../hooks/use-system-management";
import { useCreateSubmodule, useUpdateSubmodule, useDeleteSubmodule, useSubmodules } from "../../hooks/use-system-management";
import { useCreateFeature, useUpdateFeature, useDeleteFeature, useFeatures } from "../../hooks/use-system-management";
import { useCreateOperation, useUpdateOperation, useDeleteOperation, useOperations, useAddOperationToFeature } from "../../hooks/use-system-management";
import { useToast, useLocalStorageSet, createStorageKey } from "@/lib/hooks";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconPicker, IconDisplay } from "@/components/ui/icon-picker";

const moduleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().optional(),
});

const submoduleSchema = z.object({
  moduleId: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
});

const featureSchema = z.object({
  submoduleId: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  route: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
});

const operationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
});

const operationWithFeatureSchema = z.object({
  featureId: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
  isDefault: z.boolean().optional(),
});

type ModuleFormData = z.infer<typeof moduleSchema>;
type SubmoduleFormData = z.infer<typeof submoduleSchema>;
type FeatureFormData = z.infer<typeof featureSchema>;
type OperationFormData = z.infer<typeof operationSchema>;

export function StructureManagementTab() {
  const { data: tree, isLoading } = useHierarchicalPermissionTree();
  const toast = useToast();
  const [editingItem, setEditingItem] = React.useState<{
    type: "module" | "submodule" | "feature" | "operation";
    id: string;
    parentId?: string;
  } | null>(null);
  const [creatingItem, setCreatingItem] = React.useState<{
    type: "module" | "submodule" | "feature" | "operation";
    parentId?: string;
  } | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<{
    type: "module" | "submodule" | "feature" | "operation";
    id: string;
  } | null>(null);

  const deleteModule = useDeleteModule();
  const deleteSubmodule = useDeleteSubmodule();
  const deleteFeature = useDeleteFeature();
  const deleteOperation = useDeleteOperation();

  // Build selected sets (all items are "selected" in structure view - we're just viewing/editing)
  const selectedModules = React.useMemo(() => {
    const set = new Set<string>();
    if (tree) {
      tree.forEach((module) => set.add(module.id));
    }
    return set;
  }, [tree]);

  const selectedSubmodules = React.useMemo(() => {
    const set = new Set<string>();
    if (tree) {
      tree.forEach((module) => {
        module.submodules.forEach((submodule) => set.add(submodule.id));
      });
    }
    return set;
  }, [tree]);

  const selectedFeatures = React.useMemo(() => {
    const set = new Set<string>();
    if (tree) {
      tree.forEach((module) => {
        module.submodules.forEach((submodule) => {
          submodule.features.forEach((feature) => set.add(feature.id));
        });
      });
    }
    return set;
  }, [tree]);

  const selectedOperations = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (tree) {
      tree.forEach((module) => {
        module.submodules.forEach((submodule) => {
          submodule.features.forEach((feature) => {
            const ops = new Set<string>();
            feature.operations.forEach((operation) => ops.add(operation.id));
            if (ops.size > 0) {
              map.set(feature.id, ops);
            }
          });
        });
      });
    }
    return map;
  }, [tree]);

  const handleModuleToggle = React.useCallback(() => {
    // No-op in structure view - we're just viewing
  }, []);

  const handleSubmoduleToggle = React.useCallback(() => {
    // No-op in structure view
  }, []);

  const handleFeatureToggle = React.useCallback(() => {
    // No-op in structure view
  }, []);

  const handleOperationToggle = React.useCallback(() => {
    // No-op in structure view
  }, []);

  const treeModules = React.useMemo(() => {
    if (!tree) return [];
    return tree.map((module) => ({
      ...module,
      hasAccess: true, // All items visible in structure view
      submodules: module.submodules.map((submodule) => ({
        ...submodule,
        hasAccess: true,
        features: submodule.features.map((feature) => ({
          ...feature,
          hasAccess: true,
          operations: feature.operations.map((operation) => ({
            ...operation,
            hasAccess: true,
          })),
        })),
      })),
    }));
  }, [tree]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading structure...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Structure</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Create and manage modules, submodules, features, and operations in a hierarchical structure.
              </p>
            </div>
            <Dialog open={creatingItem?.type === "module"} onOpenChange={(open) => !open && setCreatingItem(null)}>
              <DialogTrigger asChild>
                <Button onClick={() => setCreatingItem({ type: "module" })}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Module
                </Button>
              </DialogTrigger>
              <DialogContent>
                <CreateModuleForm
                  onSuccess={() => {
                    setCreatingItem(null);
                    toast.success("Module created successfully");
                  }}
                  onCancel={() => setCreatingItem(null)}
                />
              </DialogContent>
            </Dialog>

      {/* Create Dialogs */}
      {creatingItem?.type === "submodule" && (
        <Dialog open={true} onOpenChange={(open) => !open && setCreatingItem(null)}>
          <DialogContent>
            <CreateSubmoduleForm
              moduleId={creatingItem.parentId!}
              onSuccess={() => {
                setCreatingItem(null);
                toast.success("Submodule created successfully");
              }}
              onCancel={() => setCreatingItem(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {creatingItem?.type === "feature" && (
        <Dialog open={true} onOpenChange={(open) => !open && setCreatingItem(null)}>
          <DialogContent>
            <CreateFeatureForm
              submoduleId={creatingItem.parentId!}
              onSuccess={() => {
                setCreatingItem(null);
                toast.success("Feature created successfully");
              }}
              onCancel={() => setCreatingItem(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {creatingItem?.type === "operation" && (
        <Dialog open={true} onOpenChange={(open) => !open && setCreatingItem(null)}>
          <DialogContent>
            <CreateOperationForm
              featureId={creatingItem.parentId!}
              onSuccess={() => {
                setCreatingItem(null);
                toast.success("Operation created successfully");
              }}
              onCancel={() => setCreatingItem(null)}
            />
          </DialogContent>
        </Dialog>
      )}
          </div>
        </CardHeader>
        <CardContent>
          {treeModules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No structure defined. Create your first module to get started.</p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
              <StructureTree
                modules={treeModules}
                onEdit={(type, id, parentId) => setEditingItem({ type, id, parentId })}
                onDelete={(type, id) => setDeletingItem({ type, id })}
                onCreate={(type, parentId) => setCreatingItem({ type, parentId })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialogs */}
      {editingItem && (
        <EditDialog
          type={editingItem.type}
          id={editingItem.id}
          parentId={editingItem.parentId}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingItem && (
        <ConfirmDialog
          open={!!deletingItem}
          onOpenChange={(open) => !open && setDeletingItem(null)}
          onConfirm={async () => {
            try {
              if (deletingItem.type === "module") {
                await deleteModule.mutateAsync(deletingItem.id);
                toast.success("Module deleted successfully");
              } else if (deletingItem.type === "submodule") {
                await deleteSubmodule.mutateAsync(deletingItem.id);
                toast.success("Submodule deleted successfully");
              } else if (deletingItem.type === "feature") {
                await deleteFeature.mutateAsync(deletingItem.id);
                toast.success("Feature deleted successfully");
              } else if (deletingItem.type === "operation") {
                await deleteOperation.mutateAsync(deletingItem.id);
                toast.success("Operation deleted successfully");
              }
              setDeletingItem(null);
            } catch (error: any) {
              toast.error(error?.message || `Failed to delete ${deletingItem.type}`);
            }
          }}
          title={`Delete ${deletingItem.type}?`}
          description={`Are you sure you want to delete this ${deletingItem.type}? This action cannot be undone.`}
          variant="destructive"
          confirmText="Delete"
        />
      )}
    </div>
  );
}

function CreateModuleForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const createModule = useCreateModule();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
  });

  const onSubmit = async (data: ModuleFormData) => {
    try {
      await createModule.mutateAsync(data);
      toast.success("Module created successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create module");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create Module</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...register("name")} placeholder="e.g., Human Resources" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} placeholder="Optional description" />
        </div>
        <div className="space-y-2">
          <Label>Icon</Label>
          <Controller
            name="icon"
            control={control}
            render={({ field }) => (
              <IconPicker
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Select an icon"
              />
            )}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createModule.isPending}>
          {createModule.isPending ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}

function StructureTree({
  modules,
  onEdit,
  onDelete,
  onCreate,
}: {
  modules: any[];
  onEdit: (type: "module" | "submodule" | "feature" | "operation", id: string, parentId?: string) => void;
  onDelete: (type: "module" | "submodule" | "feature" | "operation", id: string) => void;
  onCreate: (type: "submodule" | "feature" | "operation", parentId: string) => void;
}) {
  // Persist expanded states in localStorage (survives refresh)
  const [expandedModules, setExpandedModules] = useLocalStorageSet<string>(
    createStorageKey("system-management", "structure", "expanded-modules")
  );
  const [expandedSubmodules, setExpandedSubmodules] = useLocalStorageSet<string>(
    createStorageKey("system-management", "structure", "expanded-submodules")
  );
  const [expandedFeatures, setExpandedFeatures] = useLocalStorageSet<string>(
    createStorageKey("system-management", "structure", "expanded-features")
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const toggleSubmodule = (submoduleId: string) => {
    setExpandedSubmodules((prev) => {
      const next = new Set(prev);
      if (next.has(submoduleId)) {
        next.delete(submoduleId);
      } else {
        next.add(submoduleId);
      }
      return next;
    });
  };

  const toggleFeature = (featureId: string) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(featureId)) {
        next.delete(featureId);
      } else {
        next.add(featureId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-1 border rounded-lg p-4 bg-card shadow-sm">
      {modules.map((module) => {
        const isExpanded = expandedModules.has(module.id);
        return (
          <div key={module.id} className="space-y-1">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-all duration-150 group">
              <div className="flex items-center gap-2.5 flex-1">
                {module.submodules.length > 0 ? (
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="flex items-center justify-center w-6 h-6 hover:bg-accent rounded-md transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ) : (
                  <div className="w-6" />
                )}
                <div className="flex items-center gap-2.5 flex-1">
                  {module.icon && <IconDisplay icon={module.icon} size={20} className="flex-shrink-0" />}
                  <span className="font-semibold text-base">{module.name}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Module</span>
                  {module.description && (
                    <span className="text-xs text-muted-foreground font-normal">({module.description})</span>
                  )}
                  <span className="text-xs text-muted-foreground font-mono">• {module.slug}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {module.slug !== 'system-management' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCreate("submodule", module.id)}
                      className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                      title="Add Submodule"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit("module", module.id)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete("module", module.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            {isExpanded && (
              <div className="ml-8 space-y-1 mt-1 border-l-2 border-border/50 pl-4">
                {module.submodules.map((submodule: any) => {
                  const isSubExpanded = expandedSubmodules.has(submodule.id);
                  return (
                    <div key={submodule.id} className="space-y-1">
                      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-accent/40 transition-all duration-150 group">
                        <div className="flex items-center gap-2.5 flex-1">
                          {submodule.features.length > 0 ? (
                            <button
                              onClick={() => toggleSubmodule(submodule.id)}
                              className="flex items-center justify-center w-6 h-6 hover:bg-accent rounded-md transition-colors"
                            >
                              {isSubExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          ) : (
                            <div className="w-6" />
                          )}
                          <div className="flex items-center gap-2.5 flex-1">
                            {submodule.icon && <IconDisplay icon={submodule.icon} size={18} className="flex-shrink-0" />}
                            <span className="font-medium text-sm">{submodule.name}</span>
                            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">Submodule</span>
                            {submodule.description && (
                              <span className="text-xs text-muted-foreground font-normal">({submodule.description})</span>
                            )}
                            <span className="text-xs text-muted-foreground font-mono">• {submodule.slug}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCreate("feature", submodule.id)}
                            className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                            title="Add Feature"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit("submodule", submodule.id, module.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete("submodule", submodule.id)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {isSubExpanded && (
                        <div className="ml-8 space-y-1 mt-1 border-l-2 border-border/50 pl-4">
                          {submodule.features.map((feature: any) => {
                            const isFeatExpanded = expandedFeatures.has(feature.id);
                            return (
                              <div key={feature.id} className="space-y-1">
                                <div className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-accent/30 transition-all duration-150 group">
                                  <div className="flex items-center gap-2.5 flex-1">
                                    {feature.operations.length > 0 ? (
                                      <button
                                        onClick={() => toggleFeature(feature.id)}
                                        className="flex items-center justify-center w-6 h-6 hover:bg-accent rounded-md transition-colors"
                                      >
                                        {isFeatExpanded ? (
                                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </button>
                                    ) : (
                                      <div className="w-6" />
                                    )}
                                    <div className="flex items-center gap-2.5 flex-1">
                                      {feature.icon && <IconDisplay icon={feature.icon} size={16} className="flex-shrink-0" />}
                                      <span className="text-sm font-medium">{feature.name}</span>
                                      <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-medium">Feature</span>
                                      {feature.description && (
                                        <span className="text-xs text-muted-foreground font-normal">({feature.description})</span>
                                      )}
                                      <span className="text-xs text-muted-foreground font-mono">• {feature.slug}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onCreate("operation", feature.id)}
                                      className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                                      title="Add Operation"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onEdit("feature", feature.id, submodule.id)}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onDelete("feature", feature.id)}
                                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                {isFeatExpanded && (
                                  <div className="ml-8 space-y-1 mt-1 border-l-2 border-border/50 pl-4">
                                    {feature.operations.map((operation: any) => (
                                      <div
                                        key={operation.id}
                                        className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-accent/30 transition-all duration-150 group"
                                      >
                                        <div className="flex items-center gap-2.5 flex-1">
                                          {/* Dot indicator for operations */}
                                          <div className="w-6 flex items-center justify-center flex-shrink-0">
                                            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                          </div>
                                          <div className="flex items-center gap-2.5 flex-1">
                                            <span className="text-sm font-medium">{operation.name}</span>
                                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Operation</span>
                                            {operation.isDefault && (
                                              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                                                Default
                                              </span>
                                            )}
                                            {operation.description && (
                                              <span className="text-xs text-muted-foreground font-normal">({operation.description})</span>
                                            )}
                                            <span className="text-xs text-muted-foreground font-mono">• {operation.slug}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit("operation", operation.id, feature.id)}
                                            className="h-7 w-7 p-0"
                                          >
                                            <Edit className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete("operation", operation.id)}
                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Tree node type colors for consistency
const nodeTypeColors = {
  module: "bg-primary/10 text-primary",
  submodule: "bg-secondary text-secondary-foreground",
  feature: "bg-accent text-accent-foreground",
  operation: "bg-muted text-muted-foreground",
} as const;

function EditDialog({
  type,
  id,
  parentId,
  onClose,
  onSuccess,
}: {
  type: "module" | "submodule" | "feature" | "operation";
  id: string;
  parentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const { data: module } = useModule(type === "module" ? id : "");
  const { data: submodules } = useSubmodules(type === "submodule" ? parentId : undefined);
  const { data: features } = useFeatures(type === "feature" ? parentId : undefined);
  const { data: operations } = useOperations();
  
  const submodule = submodules?.find((s) => s.id === id);
  const feature = features?.find((f) => f.id === id);
  const operation = operations?.find((o) => o.id === id);

  const updateModule = useUpdateModule();
  const updateSubmodule = useUpdateSubmodule();
  const updateFeature = useUpdateFeature();
  const updateOperation = useUpdateOperation();

  const moduleForm = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    values: module ? { name: module.name, slug: module.slug, description: module.description, icon: module.icon, order: module.order } : undefined,
  });

  const submoduleForm = useForm<SubmoduleFormData>({
    resolver: zodResolver(submoduleSchema),
    values: submodule
      ? {
          moduleId: submodule.moduleId,
          name: submodule.name,
          slug: submodule.slug,
          description: submodule.description,
          icon: submodule.icon,
          sortOrder: submodule.sortOrder,
        }
      : undefined,
  });

  const featureForm = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
    values: feature
      ? {
          submoduleId: feature.submoduleId,
          name: feature.name,
          slug: feature.slug,
          description: feature.description,
          route: feature.route,
          icon: feature.icon,
          sortOrder: feature.sortOrder,
        }
      : undefined,
  });

  const operationForm = useForm<OperationFormData>({
    resolver: zodResolver(operationSchema),
    values: operation
      ? {
          name: operation.name,
          slug: operation.slug,
          description: operation.description,
          sortOrder: operation.sortOrder,
        }
      : undefined,
  });

  // Watch icon values for controlled IconPicker
  const moduleIcon = moduleForm.watch("icon");
  const submoduleIcon = submoduleForm.watch("icon");
  const featureIcon = featureForm.watch("icon");

  const handleSubmit = async (data: any) => {
    try {
      if (type === "module") {
        await updateModule.mutateAsync({ id, data });
        toast.success("Module updated successfully");
      } else if (type === "submodule") {
        await updateSubmodule.mutateAsync({ id, data });
        toast.success("Submodule updated successfully");
      } else if (type === "feature") {
        await updateFeature.mutateAsync({ id, data });
        toast.success("Feature updated successfully");
      } else if (type === "operation") {
        await updateOperation.mutateAsync({ id, data });
        toast.success("Operation updated successfully");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || `Failed to update ${type}`);
    }
  };

  if (type === "module" && !module) return null;
  if (type === "submodule" && !submodule) return null;
  if (type === "feature" && !feature) return null;
  if (type === "operation" && !operation) return null;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
        </DialogHeader>
        {type === "module" && (
          <form onSubmit={moduleForm.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input id="edit-name" {...moduleForm.register("name")} />
              {moduleForm.formState.errors.name && (
                <p className="text-sm text-destructive">{moduleForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input id="edit-slug" {...moduleForm.register("slug")} />
              {moduleForm.formState.errors.slug && (
                <p className="text-sm text-destructive">{moduleForm.formState.errors.slug.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" {...moduleForm.register("description")} />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker
                value={moduleIcon || ""}
                onChange={(value) => moduleForm.setValue("icon", value)}
                placeholder="Select an icon"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-order">Order</Label>
              <Input
                id="edit-order"
                type="number"
                {...moduleForm.register("order", { valueAsNumber: true })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateModule.isPending}>
                {updateModule.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        )}
        {type === "submodule" && (
          <form onSubmit={submoduleForm.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input id="edit-name" {...submoduleForm.register("name")} />
              {submoduleForm.formState.errors.name && (
                <p className="text-sm text-destructive">{submoduleForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input id="edit-slug" {...submoduleForm.register("slug")} />
              {submoduleForm.formState.errors.slug && (
                <p className="text-sm text-destructive">{submoduleForm.formState.errors.slug.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" {...submoduleForm.register("description")} />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker
                value={submoduleIcon || ""}
                onChange={(value) => submoduleForm.setValue("icon", value)}
                placeholder="Select an icon"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sortOrder">Sort Order</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                {...submoduleForm.register("sortOrder", { valueAsNumber: true })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateSubmodule.isPending}>
                {updateSubmodule.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        )}
        {type === "feature" && (
          <form onSubmit={featureForm.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input id="edit-name" {...featureForm.register("name")} />
              {featureForm.formState.errors.name && (
                <p className="text-sm text-destructive">{featureForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input id="edit-slug" {...featureForm.register("slug")} />
              {featureForm.formState.errors.slug && (
                <p className="text-sm text-destructive">{featureForm.formState.errors.slug.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" {...featureForm.register("description")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-route">Route</Label>
              <Input id="edit-route" {...featureForm.register("route")} />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker
                value={featureIcon || ""}
                onChange={(value) => featureForm.setValue("icon", value)}
                placeholder="Select an icon"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sortOrder">Sort Order</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                {...featureForm.register("sortOrder", { valueAsNumber: true })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateFeature.isPending}>
                {updateFeature.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        )}
        {type === "operation" && (
          <form onSubmit={operationForm.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input id="edit-name" {...operationForm.register("name")} />
              {operationForm.formState.errors.name && (
                <p className="text-sm text-destructive">{operationForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input id="edit-slug" {...operationForm.register("slug")} />
              {operationForm.formState.errors.slug && (
                <p className="text-sm text-destructive">{operationForm.formState.errors.slug.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" {...operationForm.register("description")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sortOrder">Sort Order</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                {...operationForm.register("sortOrder", { valueAsNumber: true })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateOperation.isPending}>
                {updateOperation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateSubmoduleForm({
  moduleId,
  onSuccess,
  onCancel,
}: {
  moduleId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const createSubmodule = useCreateSubmodule();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SubmoduleFormData>({
    resolver: zodResolver(submoduleSchema),
    defaultValues: {
      moduleId,
    },
  });

  const onSubmit = async (data: SubmoduleFormData) => {
    try {
      await createSubmodule.mutateAsync(data);
      toast.success("Submodule created successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create submodule");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create Submodule</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...register("name")} placeholder="e.g., Employee Management" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} placeholder="Optional description" />
        </div>
        <div className="space-y-2">
          <Label>Icon</Label>
          <Controller
            name="icon"
            control={control}
            render={({ field }) => (
              <IconPicker
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Select an icon"
              />
            )}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createSubmodule.isPending}>
          {createSubmodule.isPending ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}

function CreateFeatureForm({
  submoduleId,
  onSuccess,
  onCancel,
}: {
  submoduleId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const createFeature = useCreateFeature();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      submoduleId,
    },
  });

  const onSubmit = async (data: FeatureFormData) => {
    try {
      await createFeature.mutateAsync(data);
      toast.success("Feature created successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create feature");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create Feature</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...register("name")} placeholder="e.g., User Profile" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} placeholder="Optional description" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="route">Route</Label>
          <Input id="route" {...register("route")} placeholder="e.g., /users/profile" />
        </div>
        <div className="space-y-2">
          <Label>Icon</Label>
          <Controller
            name="icon"
            control={control}
            render={({ field }) => (
              <IconPicker
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Select an icon"
              />
            )}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createFeature.isPending}>
          {createFeature.isPending ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}

function CreateOperationForm({
  featureId,
  onSuccess,
  onCancel,
}: {
  featureId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const createOperation = useCreateOperation();
  const addOperationToFeature = useAddOperationToFeature();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OperationFormData>({
    resolver: zodResolver(operationSchema),
  });

  const onSubmit = async (data: OperationFormData) => {
    try {
      // First create the operation
      const operation = await createOperation.mutateAsync(data);
      // Then link it to the feature
      await addOperationToFeature.mutateAsync({
        featureId,
        operationId: operation.id,
        isDefault: false,
      });
      toast.success("Operation created and linked to feature successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create operation");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create Operation</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...register("name")} placeholder="e.g., Export" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} placeholder="Optional description" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createOperation.isPending || addOperationToFeature.isPending}>
          {createOperation.isPending || addOperationToFeature.isPending ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}

