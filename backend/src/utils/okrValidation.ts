import { z } from 'zod';

/**
 * Validation schemas for OKR (Objectives and Key Results)
 */

// Enums
export const PeriodTypeSchema = z.enum(['QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']);
export const ObjectiveStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']);
export const KeyResultStatusSchema = z.enum(['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED']);

// Objective schemas
export const createObjectiveSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(1000).optional(),
  periodType: PeriodTypeSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);

export const updateObjectiveSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(1000).optional(),
  periodType: PeriodTypeSchema.optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: ObjectiveStatusSchema.optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  { message: 'End date must be after start date', path: ['endDate'] }
);

// Key Result schemas
export const createKeyResultSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(1000).optional(),
  targetValue: z.number().positive('Target value must be positive'),
  currentValue: z.number().min(0, 'Current value cannot be negative').default(0),
  unit: z.string().min(1, 'Unit is required').max(50),
});

export const updateKeyResultSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(1000).optional(),
  targetValue: z.number().positive().optional(),
  currentValue: z.number().min(0).optional(),
  unit: z.string().min(1).max(50).optional(),
  status: KeyResultStatusSchema.optional(),
});

export const updateProgressSchema = z.object({
  currentValue: z.number().min(0, 'Current value cannot be negative'),
  notes: z.string().max(500).optional(),
});

// Type exports
export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>;
export type CreateKeyResultInput = z.infer<typeof createKeyResultSchema>;
export type UpdateKeyResultInput = z.infer<typeof updateKeyResultSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
