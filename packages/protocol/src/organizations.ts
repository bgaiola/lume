import { z } from 'zod';

import { cuidSchema, isoDateStringSchema, planSchema, slugSchema } from './common';

export const organizationSchema = z.object({
  id: cuidSchema,
  name: z.string().min(1).max(120),
  slug: slugSchema,
  plan: planSchema,
  createdAt: isoDateStringSchema,
});
export type Organization = z.infer<typeof organizationSchema>;

export const createOrganizationRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema.optional(),
});
export type CreateOrganizationRequest = z.infer<typeof createOrganizationRequestSchema>;

export const updateOrganizationRequestSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: slugSchema.optional(),
});
export type UpdateOrganizationRequest = z.infer<typeof updateOrganizationRequestSchema>;
