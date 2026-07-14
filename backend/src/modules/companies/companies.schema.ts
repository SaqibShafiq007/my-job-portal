import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(2).max(100),
  website: z.string().url().optional(),
  description: z.string().max(2000).optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;