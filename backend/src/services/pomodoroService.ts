import prisma from '../config/database';
import { Prisma, FocusQuality } from '@prisma/client';
import { ApiError } from '../middleware/errorHandler';

/**
 * Pomodoro Service layer
 * Handles business logic for time tracking sessions
 */

export interface CreateSessionInput {
  title: string;
  category?: string;
  okrCategory?: string;
  objectiveId?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  pauseDuration?: number;
  focusQuality: FocusQuality;
  tags?: string[];
  notes?: string;
  isCompleted?: boolean;
}

export interface UpdateSessionInput {
  title?: string;
  category?: string;
  okrCategory?: string;
  objectiveId?: string;
  endTime?: Date;
  duration?: number;
  pauseDuration?: number;
  focusQuality?: FocusQuality;
  tags?: string[];
  notes?: string;
  isCompleted?: boolean;
}

export interface SessionFilters {
  startDate?: Date;
  endDate?: Date;
  okrCategory?: string;
  objectiveId?: string;
  focusQuality?: FocusQuality;
}

/**
 * Get all time sessions for a user
 */
export const getUserSessions = async (
  userId: string,
  filters?: SessionFilters,
  limit?: number
) => {
  console.log('⏱️ Fetching time sessions for user:', userId);

  const where: Prisma.TimeSessionWhereInput = {
    userId,
    ...(filters?.startDate && {
      startTime: {
        gte: filters.startDate,
      },
    }),
    ...(filters?.endDate && {
      endTime: {
        lte: filters.endDate,
      },
    }),
    ...(filters?.okrCategory && { okrCategory: filters.okrCategory }),
    ...(filters?.objectiveId && { objectiveId: filters.objectiveId }),
    ...(filters?.focusQuality && { focusQuality: filters.focusQuality }),
  };

  const sessions = await prisma.timeSession.findMany({
    where,
    include: {
      objective: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { startTime: 'desc' },
    ...(limit && { take: limit }),
  });

  console.log(`✅ Found ${sessions.length} sessions`);
  return sessions;
};

/**
 * Get sessions for a specific date range
 */
export const getSessionsByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  console.log('📅 Fetching sessions between:', startDate, 'and', endDate);

  const sessions = await prisma.timeSession.findMany({
    where: {
      userId,
      startTime: {
        gte: startDate,
      },
      endTime: {
        lte: endDate,
      },
    },
    include: {
      objective: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { startTime: 'desc' },
  });

  console.log(`✅ Found ${sessions.length} sessions in range`);
  return sessions;
};

/**
 * Get a single session by ID
 */
export const getSessionById = async (sessionId: string, userId: string) => {
  console.log('🔍 Fetching session:', sessionId);

  const session = await prisma.timeSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      objective: true,
    },
  });

  if (!session) {
    throw new ApiError(404, 'Time session not found');
  }

  console.log('✅ Session found:', session.title);
  return session;
};

/**
 * Create a new time session
 */
export const createSession = async (
  userId: string,
  input: CreateSessionInput
) => {
  console.log('➕ Creating time session:', input.title);

  // Validate objectiveId if provided
  if (input.objectiveId) {
    const objective = await prisma.objective.findFirst({
      where: {
        id: input.objectiveId,
        userId,
      },
    });

    if (!objective) {
      throw new ApiError(404, 'Objective not found');
    }
  }

  // Validate time logic
  if (input.endTime <= input.startTime) {
    throw new ApiError(400, 'End time must be after start time');
  }

  const session = await prisma.timeSession.create({
    data: {
      userId,
      title: input.title,
      category: input.category,
      okrCategory: input.okrCategory,
      objectiveId: input.objectiveId,
      startTime: input.startTime,
      endTime: input.endTime,
      duration: input.duration,
      pauseDuration: input.pauseDuration || 0,
      focusQuality: input.focusQuality,
      tags: input.tags ? (input.tags as Prisma.InputJsonValue) : undefined,
      notes: input.notes,
      isCompleted: input.isCompleted ?? true,
    },
    include: {
      objective: true,
    },
  });

  console.log('✅ Session created:', session.id);
  return session;
};

/**
 * Update a time session
 */
export const updateSession = async (
  sessionId: string,
  userId: string,
  input: UpdateSessionInput
) => {
  console.log('✏️ Updating session:', sessionId);

  // Check if session exists and belongs to user
  const existing = await prisma.timeSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Time session not found');
  }

  // Validate objectiveId if provided
  if (input.objectiveId) {
    const objective = await prisma.objective.findFirst({
      where: {
        id: input.objectiveId,
        userId,
      },
    });

    if (!objective) {
      throw new ApiError(404, 'Objective not found');
    }
  }

  const session = await prisma.timeSession.update({
    where: { id: sessionId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.okrCategory !== undefined && { okrCategory: input.okrCategory }),
      ...(input.objectiveId !== undefined && { objectiveId: input.objectiveId }),
      ...(input.endTime && { endTime: input.endTime }),
      ...(input.duration !== undefined && { duration: input.duration }),
      ...(input.pauseDuration !== undefined && { pauseDuration: input.pauseDuration }),
      ...(input.focusQuality && { focusQuality: input.focusQuality }),
      ...(input.tags !== undefined && {
        tags: input.tags ? (input.tags as Prisma.InputJsonValue) : null,
      }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.isCompleted !== undefined && { isCompleted: input.isCompleted }),
    },
    include: {
      objective: true,
    },
  });

  console.log('✅ Session updated:', session.id);
  return session;
};

/**
 * Delete a time session
 */
export const deleteSession = async (sessionId: string, userId: string) => {
  console.log('🗑️ Deleting session:', sessionId);

  // Check if session exists and belongs to user
  const existing = await prisma.timeSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Time session not found');
  }

  await prisma.timeSession.delete({
    where: { id: sessionId },
  });

  console.log('✅ Session deleted:', sessionId);
};

/**
 * Get session statistics for a user
 */
export const getSessionStats = async (
  userId: string,
  startDate?: Date,
  endDate?: Date
) => {
  console.log('📊 Calculating session statistics for user:', userId);

  const where: Prisma.TimeSessionWhereInput = {
    userId,
    isCompleted: true,
    ...(startDate && {
      startTime: {
        gte: startDate,
      },
    }),
    ...(endDate && {
      endTime: {
        lte: endDate,
      },
    }),
  };

  const sessions = await prisma.timeSession.findMany({
    where,
    select: {
      duration: true,
      pauseDuration: true,
      focusQuality: true,
      okrCategory: true,
    },
  });

  const totalSessions = sessions.length;
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalPauseDuration = sessions.reduce((sum, s) => sum + s.pauseDuration, 0);
  const focusTime = totalDuration - totalPauseDuration;

  // Group by focus quality
  const focusQualityBreakdown = sessions.reduce((acc, s) => {
    acc[s.focusQuality] = (acc[s.focusQuality] || 0) + 1;
    return acc;
  }, {} as Record<FocusQuality, number>);

  // Group by OKR category
  const categoryBreakdown = sessions.reduce((acc, s) => {
    if (s.okrCategory) {
      acc[s.okrCategory] = (acc[s.okrCategory] || 0) + s.duration;
    }
    return acc;
  }, {} as Record<string, number>);

  const stats = {
    totalSessions,
    totalDuration,
    totalPauseDuration,
    focusTime,
    averageSessionDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
    focusQualityBreakdown,
    categoryBreakdown,
  };

  console.log('✅ Statistics calculated:', stats);
  return stats;
};
