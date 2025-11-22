import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { ApiError } from '../middleware/errorHandler';
import { CreateEntryInput, UpdateEntryInput } from '../utils/journalValidation';

/**
 * Journal Entry service layer
 * Handles business logic for journal entries
 */

/**
 * Get all entries for a user
 */
export const getUserEntries = async (userId: string, limit?: number) => {
  console.log('📖 Fetching journal entries for user:', userId);

  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          questions: true,
        },
      },
    },
    orderBy: { entryDate: 'desc' },
    ...(limit && { take: limit }),
  });

  console.log(`✅ Found ${entries.length} entries`);
  return entries;
};

/**
 * Get entries for a specific date range
 */
export const getEntriesByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  console.log('📅 Fetching entries between:', startDate, 'and', endDate);

  const entries = await prisma.journalEntry.findMany({
    where: {
      userId,
      entryDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { entryDate: 'desc' },
  });

  console.log(`✅ Found ${entries.length} entries in range`);
  return entries;
};

/**
 * Get a single entry by ID
 */
export const getEntryById = async (entryId: string, userId: string) => {
  console.log('🔍 Fetching entry:', entryId);

  const entry = await prisma.journalEntry.findFirst({
    where: {
      id: entryId,
      userId,
    },
    include: {
      template: true,
    },
  });

  if (!entry) {
    throw new ApiError(404, 'Journal entry not found');
  }

  console.log('✅ Entry found for date:', entry.entryDate);
  return entry;
};

/**
 * Get entry by date
 */
export const getEntryByDate = async (userId: string, date: Date) => {
  console.log('🔍 Fetching entry for date:', date);

  const entry = await prisma.journalEntry.findFirst({
    where: {
      userId,
      entryDate: date,
    },
    include: {
      template: true,
    },
  });

  return entry;
};

/**
 * Create a new entry
 */
export const createEntry = async (userId: string, input: CreateEntryInput) => {
  console.log('➕ Creating journal entry for date:', input.entryDate);

  // Check if template exists and belongs to user
  const template = await prisma.journalTemplate.findFirst({
    where: {
      id: input.templateId,
      userId,
    },
  });

  if (!template) {
    throw new ApiError(404, 'Template not found');
  }

  // Check if entry already exists for this date
  const existingEntry = await prisma.journalEntry.findFirst({
    where: {
      userId,
      entryDate: new Date(input.entryDate),
    },
  });

  if (existingEntry) {
    throw new ApiError(400, 'An entry already exists for this date');
  }

  const entry = await prisma.journalEntry.create({
    data: {
      userId,
      templateId: input.templateId,
      entryDate: new Date(input.entryDate),
      responses: input.responses as Prisma.InputJsonValue,
    },
    include: {
      template: true,
    },
  });

  console.log('✅ Entry created:', entry.id);
  return entry;
};

/**
 * Update an entry
 */
export const updateEntry = async (
  entryId: string,
  userId: string,
  input: UpdateEntryInput
) => {
  console.log('✏️ Updating entry:', entryId);

  // Check if entry exists and belongs to user
  const existing = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Journal entry not found');
  }

  const entry = await prisma.journalEntry.update({
    where: { id: entryId },
    data: {
      ...(input.responses && { responses: input.responses as Prisma.InputJsonValue }),
    },
    include: {
      template: true,
    },
  });

  console.log('✅ Entry updated:', entry.id);
  return entry;
};

/**
 * Delete an entry
 */
export const deleteEntry = async (entryId: string, userId: string) => {
  console.log('🗑️ Deleting entry:', entryId);

  // Check if entry exists and belongs to user
  const existing = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Journal entry not found');
  }

  await prisma.journalEntry.delete({
    where: { id: entryId },
  });

  console.log('✅ Entry deleted:', entryId);
};

/**
 * Get statistics for user's journal entries
 */
export const getEntryStats = async (userId: string) => {
  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    select: {
      moodScore: true,
      energyScore: true,
      entryDate: true,
    },
  });

  const totalEntries = entries.length;
  const avgMood =
    entries.filter((e) => e.moodScore).reduce((sum, e) => sum + (e.moodScore || 0), 0) /
      entries.filter((e) => e.moodScore).length || 0;
  const avgEnergy =
    entries.filter((e) => e.energyScore).reduce((sum, e) => sum + (e.energyScore || 0), 0) /
      entries.filter((e) => e.energyScore).length || 0;

  return {
    totalEntries,
    averageMoodScore: Math.round(avgMood * 10) / 10,
    averageEnergyScore: Math.round(avgEnergy * 10) / 10,
  };
};
