"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  permissionTemplateService,
  type PermissionTemplate,
  type CreateTemplateDto,
  type UpdateTemplateDto,
} from "../application/permission-template.service";
import { useToast } from "@/lib/hooks/use-toast";

const QUERY_KEY = "permission-templates";

/**
 * Hook to fetch all permission templates
 */
export function usePermissionTemplates(options?: { category?: string; activeOnly?: boolean }) {
  return useQuery({
    queryKey: [QUERY_KEY, options],
    queryFn: () => permissionTemplateService.getAll(options),
  });
}

/**
 * Hook to fetch a single permission template by ID
 */
export function usePermissionTemplate(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => (id ? permissionTemplateService.getById(id) : null),
    enabled: !!id,
  });
}

/**
 * Hook to fetch all template categories
 */
export function useTemplateCategories() {
  return useQuery({
    queryKey: [QUERY_KEY, "categories"],
    queryFn: () => permissionTemplateService.getCategories(),
  });
}

/**
 * Hook to create a new permission template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreateTemplateDto) => permissionTemplateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Template created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
}

/**
 * Hook to update a permission template
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateDto }) =>
      permissionTemplateService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Template updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a permission template
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => permissionTemplateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Template deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
}

/**
 * Hook to apply a template to a role
 */
export function useApplyTemplateToRole() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ templateId, roleId }: { templateId: string; roleId: string }) =>
      permissionTemplateService.applyToRole(templateId, roleId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      const applied = result.applied?.length || 0;
      const skipped = result.skipped.length;
      const errors = result.errors.length;
      toast.success(`Template applied: ${applied} permissions added, ${skipped} skipped, ${errors} errors`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to apply template: ${error.message}`);
    },
  });
}

/**
 * Hook to apply a template to a user
 */
export function useApplyTemplateToUser() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ templateId, userId }: { templateId: string; userId: string }) =>
      permissionTemplateService.applyToUser(templateId, userId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["permissions-v2", "users"] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      const added = result.added?.length || 0;
      const skipped = result.skipped.length;
      const errors = result.errors.length;
      toast.success(`Template applied: ${added} permissions added, ${skipped} skipped, ${errors} errors`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to apply template: ${error.message}`);
    },
  });
}

/**
 * Hook to create a template from an existing role
 */
export function useCreateTemplateFromRole() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      roleId,
      data,
    }: {
      roleId: string;
      data: { name: string; description?: string; category?: string; tags?: string[] };
    }) => permissionTemplateService.createFromRole(roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Template created from role successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create template from role: ${error.message}`);
    },
  });
}

/**
 * Hook to create a template from an existing user's permissions
 */
export function useCreateTemplateFromUser() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: { name: string; description?: string; category?: string; tags?: string[] };
    }) => permissionTemplateService.createFromUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Template created from user permissions successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create template from user: ${error.message}`);
    },
  });
}

/**
 * Hook to clone a template
 */
export function useCloneTemplate() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ templateId, newName }: { templateId: string; newName: string }) =>
      permissionTemplateService.clone(templateId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Template cloned successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to clone template: ${error.message}`);
    },
  });
}

/**
 * Hook to compare two templates
 */
export function useCompareTemplates(templateId1?: string, templateId2?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, "compare", templateId1, templateId2],
    queryFn: () =>
      templateId1 && templateId2
        ? permissionTemplateService.compare(templateId1, templateId2)
        : null,
    enabled: !!templateId1 && !!templateId2,
  });
}

