import prisma from '../config/database';
import { ApiError } from '../middleware/errorHandler';

/**
 * Category Mapper Service layer
 * Handles business logic for mapping user categories to OKR categories
 */

export interface CreateCategoryMappingInput {
  categoryName: string;
  okrCategory: string;
  defaultObjectiveId?: string;
  hexColor?: string;
  isActive?: boolean;
}

export interface UpdateCategoryMappingInput {
  categoryName?: string;
  okrCategory?: string;
  defaultObjectiveId?: string;
  hexColor?: string;
  isActive?: boolean;
}

/**
 * OKR Category types
 */
export const OKR_CATEGORIES = [
  'Relationship',
  'Career',
  'Leadership',
  'Academic',
  'Personal',
] as const;

export type OkrCategory = typeof OKR_CATEGORIES[number];

/**
 * Get all category mappings for a user
 */
export const getUserCategoryMappings = async (
  userId: string,
  activeOnly: boolean = false
) => {
  console.log('🗂️ Fetching category mappings for user:', userId);

  const mappings = await prisma.categoryMapping.findMany({
    where: {
      userId,
      ...(activeOnly && { isActive: true }),
    },
    orderBy: { categoryName: 'asc' },
  });

  console.log(`✅ Found ${mappings.length} category mappings`);
  return mappings;
};

/**
 * Get a single category mapping by ID
 */
export const getCategoryMappingById = async (
  mappingId: string,
  userId: string
) => {
  console.log('🔍 Fetching category mapping:', mappingId);

  const mapping = await prisma.categoryMapping.findFirst({
    where: {
      id: mappingId,
      userId,
    },
  });

  if (!mapping) {
    throw new ApiError(404, 'Category mapping not found');
  }

  console.log('✅ Mapping found:', mapping.categoryName);
  return mapping;
};

/**
 * Get category mapping by category name
 */
export const getCategoryMappingByName = async (
  userId: string,
  categoryName: string
) => {
  console.log('🔍 Fetching mapping for category:', categoryName);

  const mapping = await prisma.categoryMapping.findFirst({
    where: {
      userId,
      categoryName,
      isActive: true,
    },
  });

  return mapping;
};

/**
 * Create a new category mapping
 */
export const createCategoryMapping = async (
  userId: string,
  input: CreateCategoryMappingInput
) => {
  console.log('➕ Creating category mapping:', input.categoryName);

  // Validate OKR category
  if (!OKR_CATEGORIES.includes(input.okrCategory as OkrCategory)) {
    throw new ApiError(
      400,
      `Invalid OKR category. Must be one of: ${OKR_CATEGORIES.join(', ')}`
    );
  }

  // Validate default objective if provided
  if (input.defaultObjectiveId) {
    const objective = await prisma.objective.findFirst({
      where: {
        id: input.defaultObjectiveId,
        userId,
      },
    });

    if (!objective) {
      throw new ApiError(404, 'Default objective not found');
    }
  }

  // Check if mapping already exists
  const existingMapping = await prisma.categoryMapping.findFirst({
    where: {
      userId,
      categoryName: input.categoryName,
    },
  });

  if (existingMapping) {
    throw new ApiError(
      400,
      'A mapping with this category name already exists'
    );
  }

  const mapping = await prisma.categoryMapping.create({
    data: {
      userId,
      categoryName: input.categoryName,
      okrCategory: input.okrCategory,
      defaultObjectiveId: input.defaultObjectiveId,
      hexColor: input.hexColor || '#2C50CF',
      isActive: input.isActive ?? true,
    },
  });

  console.log('✅ Category mapping created:', mapping.id);
  return mapping;
};

/**
 * Update a category mapping
 */
export const updateCategoryMapping = async (
  mappingId: string,
  userId: string,
  input: UpdateCategoryMappingInput
) => {
  console.log('✏️ Updating category mapping:', mappingId);

  // Check if mapping exists and belongs to user
  const existing = await prisma.categoryMapping.findFirst({
    where: { id: mappingId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Category mapping not found');
  }

  // Validate OKR category if provided
  if (input.okrCategory && !OKR_CATEGORIES.includes(input.okrCategory as OkrCategory)) {
    throw new ApiError(
      400,
      `Invalid OKR category. Must be one of: ${OKR_CATEGORIES.join(', ')}`
    );
  }

  // Validate default objective if provided
  if (input.defaultObjectiveId) {
    const objective = await prisma.objective.findFirst({
      where: {
        id: input.defaultObjectiveId,
        userId,
      },
    });

    if (!objective) {
      throw new ApiError(404, 'Default objective not found');
    }
  }

  // Check for duplicate category name if updating
  if (input.categoryName && input.categoryName !== existing.categoryName) {
    const duplicate = await prisma.categoryMapping.findFirst({
      where: {
        userId,
        categoryName: input.categoryName,
        id: { not: mappingId },
      },
    });

    if (duplicate) {
      throw new ApiError(400, 'A mapping with this category name already exists');
    }
  }

  const mapping = await prisma.categoryMapping.update({
    where: { id: mappingId },
    data: {
      ...(input.categoryName && { categoryName: input.categoryName }),
      ...(input.okrCategory && { okrCategory: input.okrCategory }),
      ...(input.defaultObjectiveId !== undefined && {
        defaultObjectiveId: input.defaultObjectiveId,
      }),
      ...(input.hexColor && { hexColor: input.hexColor }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });

  console.log('✅ Category mapping updated:', mapping.id);
  return mapping;
};

/**
 * Delete a category mapping
 */
export const deleteCategoryMapping = async (
  mappingId: string,
  userId: string
) => {
  console.log('🗑️ Deleting category mapping:', mappingId);

  // Check if mapping exists and belongs to user
  const existing = await prisma.categoryMapping.findFirst({
    where: { id: mappingId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Category mapping not found');
  }

  await prisma.categoryMapping.delete({
    where: { id: mappingId },
  });

  console.log('✅ Category mapping deleted:', mappingId);
};

/**
 * Map a category name to OKR category
 * Returns the OKR category and default objective if mapping exists
 */
export const mapCategoryToOkr = async (
  userId: string,
  categoryName: string
) => {
  console.log('🗺️ Mapping category to OKR:', categoryName);

  const mapping = await getCategoryMappingByName(userId, categoryName);

  if (!mapping) {
    console.log('⚠️ No mapping found for category:', categoryName);
    return null;
  }

  console.log(`✅ Mapped to OKR category: ${mapping.okrCategory}`);
  return {
    okrCategory: mapping.okrCategory,
    defaultObjectiveId: mapping.defaultObjectiveId,
    hexColor: mapping.hexColor,
  };
};

/**
 * Get category mappings by OKR category
 */
export const getMappingsByOkrCategory = async (
  userId: string,
  okrCategory: string
) => {
  console.log('🔍 Fetching mappings for OKR category:', okrCategory);

  const mappings = await prisma.categoryMapping.findMany({
    where: {
      userId,
      okrCategory,
      isActive: true,
    },
    orderBy: { categoryName: 'asc' },
  });

  console.log(`✅ Found ${mappings.length} mappings`);
  return mappings;
};
