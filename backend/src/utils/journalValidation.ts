import { z } from 'zod';

/**
 * Validation schemas for Journal Templates and Entries
 */

// Question types for journal templates
export const QuestionTypeSchema = z.enum(['text', 'number', 'scale', 'multiline']);

// Question schema
export const QuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(3, 'Question must be at least 3 characters').max(500),
  type: QuestionTypeSchema,
});

// Journal Template schemas
export const createTemplateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  questions: z.array(QuestionSchema).min(1, 'At least one question is required'),
  isActive: z.boolean().default(true),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  questions: z.array(QuestionSchema).min(1).optional(),
  isActive: z.boolean().optional(),
});

// Journal Entry schemas
export const createEntrySchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  responses: z.record(z.unknown()), // Question ID -> answer mapping
  moodScore: z.number().int().min(1).max(10).optional(),
  energyScore: z.number().int().min(1).max(10).optional(),
});

export const updateEntrySchema = z.object({
  responses: z.record(z.unknown()).optional(),
  moodScore: z.number().int().min(1).max(10).optional(),
  energyScore: z.number().int().min(1).max(10).optional(),
});

// Type exports
export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
