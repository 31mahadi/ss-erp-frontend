import { z } from "zod";

export const createDepartmentSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  headOfDepartment: z.string().optional(),
  sortOrder: z.number().min(0).optional(),
});

export const updateDepartmentSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  headOfDepartment: z.string().optional(),
  sortOrder: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  headOfDepartment?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentListResponse {
  data: Department[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

