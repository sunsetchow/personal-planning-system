import prisma from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import {
  CreateObjectiveInput,
  UpdateObjectiveInput,
} from '../utils/okrValidation';

/**
 * Objective service layer
 * Handles business logic for objectives
 */

/**
 * Get all objectives for a user
 */
export const getUserObjectives = async (userId: string) => {
  console.log('📋 Fetching objectives for user:', userId);

  const objectives = await prisma.objective.findMany({
    where: { userId },
    include: {
      keyResults: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`✅ Found ${objectives.length} objectives`);
  return objectives;
};

/**
 * Get a single objective by ID
 */
export const getObjectiveById = async (objectiveId: string, userId: string) => {
  console.log('🔍 Fetching objective:', objectiveId);

  const objective = await prisma.objective.findFirst({
    where: {
      id: objectiveId,
      userId,
    },
    include: {
      keyResults: {
        include: {
          okrUpdates: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!objective) {
    throw new ApiError(404, 'Objective not found');
  }

  console.log('✅ Objective found:', objective.title);
  return objective;
};

/**
 * Create a new objective
 */
export const createObjective = async (userId: string, input: CreateObjectiveInput) => {
  console.log('➕ Creating objective:', input.title);

  const objective = await prisma.objective.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      periodType: input.periodType,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      status: 'ACTIVE',
    },
    include: {
      keyResults: true,
    },
  });

  console.log('✅ Objective created:', objective.id);
  return objective;
};

/**
 * Update an objective
 */
export const updateObjective = async (
  objectiveId: string,
  userId: string,
  input: UpdateObjectiveInput
) => {
  console.log('✏️ Updating objective:', objectiveId);

  // Check if objective exists and belongs to user
  const existing = await prisma.objective.findFirst({
    where: { id: objectiveId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Objective not found');
  }

  // Validate that end date stays after start date when updating
  const nextStartDate = input.startDate ? new Date(input.startDate) : existing.startDate;
  const nextEndDate = input.endDate ? new Date(input.endDate) : existing.endDate;

  if (nextEndDate <= nextStartDate) {
    throw new ApiError(400, 'End date must be after start date');
  }

  const objective = await prisma.objective.update({
    where: { id: objectiveId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.periodType && { periodType: input.periodType }),
      ...(input.startDate && { startDate: new Date(input.startDate) }),
      ...(input.endDate && { endDate: new Date(input.endDate) }),
      ...(input.status && { status: input.status }),
    },
    include: {
      keyResults: true,
    },
  });

  console.log('✅ Objective updated:', objective.id);
  return objective;
};

/**
 * Delete an objective
 */
export const deleteObjective = async (objectiveId: string, userId: string) => {
  console.log('🗑️ Deleting objective:', objectiveId);

  // Check if objective exists and belongs to user
  const existing = await prisma.objective.findFirst({
    where: { id: objectiveId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Objective not found');
  }

  // Delete objective (cascade will delete key results and updates)
  await prisma.objective.delete({
    where: { id: objectiveId },
  });

  console.log('✅ Objective deleted:', objectiveId);
};

/**
 * Calculate overall progress for an objective based on its key results
 */
export const calculateObjectiveProgress = async (objectiveId: string) => {
  const keyResults = await prisma.keyResult.findMany({
    where: { objectiveId },
  });

  if (keyResults.length === 0) {
    return 0;
  }

  const totalProgress = keyResults.reduce((sum, kr) => {
    const progress = (Number(kr.currentValue) / Number(kr.targetValue)) * 100;
    return sum + Math.min(progress, 100);
  }, 0);

  return Math.round(totalProgress / keyResults.length);
};
