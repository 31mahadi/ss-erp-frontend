import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  phone: z.string().optional(),
  avatar: z.string().url("Invalid URL").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
