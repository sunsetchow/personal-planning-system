import prisma from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { CreateTemplateInput, UpdateTemplateInput } from '../utils/journalValidation';

/**
 * Journal Template service layer
 * Handles business logic for journal templates
 */

/**
 * Get all templates for a user
 */
export const getUserTemplates = async (userId: string) => {
  console.log('📋 Fetching journal templates for user:', userId);

  const templates = await prisma.journalTemplate.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`✅ Found ${templates.length} templates`);
  return templates;
};

/**
 * Get a single template by ID
 */
export const getTemplateById = async (templateId: string, userId: string) => {
  console.log('🔍 Fetching template:', templateId);

  const template = await prisma.journalTemplate.findFirst({
    where: {
      id: templateId,
      userId,
    },
  });

  if (!template) {
    throw new ApiError(404, 'Template not found');
  }

  console.log('✅ Template found:', template.name);
  return template;
};

/**
 * Get active template for a user
 */
export const getActiveTemplate = async (userId: string) => {
  console.log('🔍 Fetching active template for user:', userId);

  const template = await prisma.journalTemplate.findFirst({
    where: {
      userId,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return template;
};

/**
 * Create a new template
 */
export const createTemplate = async (userId: string, input: CreateTemplateInput) => {
  console.log('➕ Creating journal template:', input.name);

  // If this template is set as active, deactivate all other templates
  if (input.isActive) {
    await prisma.journalTemplate.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  const template = await prisma.journalTemplate.create({
    data: {
      userId,
      name: input.name,
      questions: input.questions,
      isActive: input.isActive,
    },
  });

  console.log('✅ Template created:', template.id);
  return template;
};

/**
 * Update a template
 */
export const updateTemplate = async (
  templateId: string,
  userId: string,
  input: UpdateTemplateInput
) => {
  console.log('✏️ Updating template:', templateId);

  // Check if template exists and belongs to user
  const existing = await prisma.journalTemplate.findFirst({
    where: { id: templateId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Template not found');
  }

  // If setting this template as active, deactivate all others
  if (input.isActive) {
    await prisma.journalTemplate.updateMany({
      where: { userId, isActive: true, id: { not: templateId } },
      data: { isActive: false },
    });
  }

  const template = await prisma.journalTemplate.update({
    where: { id: templateId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.questions && { questions: input.questions }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });

  console.log('✅ Template updated:', template.id);
  return template;
};

/**
 * Delete a template
 */
export const deleteTemplate = async (templateId: string, userId: string) => {
  console.log('🗑️ Deleting template:', templateId);

  // Check if template exists and belongs to user
  const existing = await prisma.journalTemplate.findFirst({
    where: { id: templateId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Template not found');
  }

  // Check if template has entries
  const entryCount = await prisma.journalEntry.count({
    where: { templateId },
  });

  if (entryCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete template with ${entryCount} journal entries. Archive it instead.`
    );
  }

  await prisma.journalTemplate.delete({
    where: { id: templateId },
  });

  console.log('✅ Template deleted:', templateId);
};
