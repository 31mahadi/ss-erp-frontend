import { z } from "zod";

export const createPositionSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  department: z.string().optional(),
  level: z.string().optional(),
  sortOrder: z.number().min(0).optional(),
});

export const updatePositionSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  department: z.string().optional(),
  level: z.string().optional(),
  sortOrder: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreatePositionInput = z.infer<typeof createPositionSchema>;
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;

export interface Position {
  id: string;
  code: string;
  name: string;
  description?: string;
  department?: string;
  level?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PositionListResponse {
  data: Position[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

