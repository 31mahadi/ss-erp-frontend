import { z } from "zod";

export const createModuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(), // Auto-generated from name
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(), // Auto-calculated
});

export const createSubmoduleSchema = z.object({
  moduleId: z.string().uuid("Invalid module ID"),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(), // Auto-generated from name
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(), // Auto-calculated
});

export const createFeatureSchema = z.object({
  submoduleId: z.string().uuid("Invalid submodule ID"),
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(), // Auto-generated from name
  description: z.string().optional(),
  route: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(), // Auto-calculated
});

export const createOperationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(), // Auto-generated from name
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(), // Auto-calculated
});

export const createRoleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateSubmoduleInput = z.infer<typeof createSubmoduleSchema>;
export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type CreateOperationInput = z.infer<typeof createOperationSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

