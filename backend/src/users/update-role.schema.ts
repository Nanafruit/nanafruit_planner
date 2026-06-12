import { z } from 'zod';

export const UpdateRoleSchema = z.object({
  role: z.enum(['admin', 'staff']),
});

export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
