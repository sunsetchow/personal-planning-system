import prisma from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import {
  CreateKeyResultInput,
  UpdateKeyResultInput,
  UpdateProgressInput,
} from '../utils/okrValidation';

/**
 * Key Result service layer
 * Handles business logic for key results
 */

/**
 * Get all key results for an objective
 */
export const getObjectiveKeyResults = async (objectiveId: string, userId: string) => {
  console.log('📊 Fetching key results for objective:', objectiveId);

  // Verify objective belongs to user
  const objective = await prisma.objective.findFirst({
    where: { id: objectiveId, userId },
  });

  if (!objective) {
    throw new ApiError(404, 'Objective not found');
  }

  const keyResults = await prisma.keyResult.findMany({
    where: { objectiveId },
    include: {
      okrUpdates: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`✅ Found ${keyResults.length} key results`);
  return keyResults;
};

/**
 * Get a single key result by ID
 */
export const getKeyResultById = async (keyResultId: string, userId: string) => {
  console.log('🔍 Fetching key result:', keyResultId);

  const keyResult = await prisma.keyResult.findFirst({
    where: {
      id: keyResultId,
      objective: { userId },
    },
    include: {
      objective: true,
      okrUpdates: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!keyResult) {
    throw new ApiError(404, 'Key result not found');
  }

  console.log('✅ Key result found:', keyResult.title);
  return keyResult;
};

/**
 * Create a new key result for an objective
 */
export const createKeyResult = async (
  objectiveId: string,
  userId: string,
  input: CreateKeyResultInput
) => {
  console.log('➕ Creating key result:', input.title);

  // Verify objective belongs to user
  const objective = await prisma.objective.findFirst({
    where: { id: objectiveId, userId },
  });

  if (!objective) {
    throw new ApiError(404, 'Objective not found');
  }

  const keyResult = await prisma.keyResult.create({
    data: {
      objectiveId,
      title: input.title,
      description: input.description,
      targetValue: input.targetValue,
      currentValue: input.currentValue,
      unit: input.unit,
      status: 'ON_TRACK',
    },
    include: {
      objective: true,
    },
  });

  console.log('✅ Key result created:', keyResult.id);
  return keyResult;
};

/**
 * Update a key result
 */
export const updateKeyResult = async (
  keyResultId: string,
  userId: string,
  input: UpdateKeyResultInput
) => {
  console.log('✏️ Updating key result:', keyResultId);

  // Check if key result exists and belongs to user
  const existing = await prisma.keyResult.findFirst({
    where: {
      id: keyResultId,
      objective: { userId },
    },
  });

  if (!existing) {
    throw new ApiError(404, 'Key result not found');
  }

  const keyResult = await prisma.keyResult.update({
    where: { id: keyResultId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.targetValue !== undefined && { targetValue: input.targetValue }),
      ...(input.currentValue !== undefined && { currentValue: input.currentValue }),
      ...(input.unit && { unit: input.unit }),
      ...(input.status && { status: input.status }),
    },
    include: {
      objective: true,
    },
  });

  console.log('✅ Key result updated:', keyResult.id);
  return keyResult;
};

/**
 * Update progress for a key result
 */
export const updateKeyResultProgress = async (
  keyResultId: string,
  userId: string,
  input: UpdateProgressInput,
  updateType: 'MANUAL' | 'JOURNAL_SUGGESTED' | 'JOURNAL_AUTO' = 'MANUAL',
  journalEntryId?: string
) => {
  console.log('📈 Updating progress for key result:', keyResultId);

  // Get existing key result
  const keyResult = await prisma.keyResult.findFirst({
    where: {
      id: keyResultId,
      objective: { userId },
    },
  });

  if (!keyResult) {
    throw new ApiError(404, 'Key result not found');
  }

  const previousValue = keyResult.currentValue;
  const newValue = input.currentValue;

  // Calculate new status based on progress
  const progress = (Number(newValue) / Number(keyResult.targetValue)) * 100;
  let newStatus = keyResult.status;

  if (progress >= 100) {
    newStatus = 'COMPLETED';
  } else if (progress >= 70) {
    newStatus = 'ON_TRACK';
  } else if (progress >= 40) {
    newStatus = 'AT_RISK';
  } else {
    newStatus = 'BEHIND';
  }

  // Update key result and create audit trail
  const [updated] = await prisma.$transaction([
    prisma.keyResult.update({
      where: { id: keyResultId },
      data: {
        currentValue: newValue,
        status: newStatus,
      },
      include: {
        objective: true,
      },
    }),
    prisma.okrUpdate.create({
      data: {
        keyResultId,
        journalEntryId,
        previousValue,
        newValue,
        updateType,
        notes: input.notes,
      },
    }),
  ]);

  console.log('✅ Progress updated:', {
    from: Number(previousValue),
    to: Number(newValue),
    status: newStatus,
  });

  return updated;
};

/**
 * Delete a key result
 */
export const deleteKeyResult = async (keyResultId: string, userId: string) => {
  console.log('🗑️ Deleting key result:', keyResultId);

  // Check if key result exists and belongs to user
  const existing = await prisma.keyResult.findFirst({
    where: {
      id: keyResultId,
      objective: { userId },
    },
  });

  if (!existing) {
    throw new ApiError(404, 'Key result not found');
  }

  // Delete key result (cascade will delete updates)
  await prisma.keyResult.delete({
    where: { id: keyResultId },
  });

  console.log('✅ Key result deleted:', keyResultId);
};

/**
 * Calculate progress percentage for a key result
 */
export const calculateProgress = (currentValue: number, targetValue: number): number => {
  if (targetValue === 0) return 0;
  return Math.min(Math.round((currentValue / targetValue) * 100), 100);
};
