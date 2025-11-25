import prisma from '../config/database';

/**
 * User Profile Service
 * Manages user context, preferences, and personalization
 */

export interface UserProfileData {
  userType?: string;
  industry?: string;
  goals?: string[];
  focusAreas?: string[];
  workingHours?: {
    start: string;
    end: string;
    daysPerWeek: number;
  };
  timezone?: string;
  customMetrics?: Array<{
    name: string;
    type: string;
    unit?: string;
  }>;
  preferences?: {
    theme?: string;
    notifications?: boolean;
    weeklyReportDay?: string;
  };
}

/**
 * Get or create user profile
 */
export const getUserProfile = async (userId: string) => {
  let profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    profile = await prisma.userProfile.create({
      data: { userId },
    });
  }

  return profile;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId: string, data: Partial<UserProfileData>) => {
  const profile = await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      userType: data.userType,
      industry: data.industry,
      goals: data.goals,
      focusAreas: data.focusAreas,
      workingHours: data.workingHours,
      timezone: data.timezone,
      customMetrics: data.customMetrics,
      preferences: data.preferences,
    },
    update: {
      userType: data.userType,
      industry: data.industry,
      goals: data.goals,
      focusAreas: data.focusAreas,
      workingHours: data.workingHours,
      timezone: data.timezone,
      customMetrics: data.customMetrics,
      preferences: data.preferences,
    },
  });

  return profile;
};

/**
 * Get user context for AI insights
 */
export const getUserContext = async (userId: string): Promise<string> => {
  const profile = await getUserProfile(userId);

  if (!profile.userType && !profile.industry) {
    return 'General user with personal development goals';
  }

  const contextParts: string[] = [];

  if (profile.userType) {
    contextParts.push(`User type: ${profile.userType}`);
  }

  if (profile.industry) {
    contextParts.push(`Industry: ${profile.industry}`);
  }

  if (profile.goals && Array.isArray(profile.goals)) {
    const goals = profile.goals as string[];
    if (goals.length > 0) {
      contextParts.push(`Primary goals: ${goals.join(', ')}`);
    }
  }

  if (profile.focusAreas && Array.isArray(profile.focusAreas)) {
    const areas = profile.focusAreas as string[];
    if (areas.length > 0) {
      contextParts.push(`Focus areas: ${areas.join(', ')}`);
    }
  }

  return contextParts.join('. ');
};

/**
 * Suggest relevant metrics based on user profile
 */
export const suggestMetrics = async (userId: string): Promise<string[]> => {
  const profile = await getUserProfile(userId);

  const metricSuggestions: { [key: string]: string[] } = {
    student: [
      'Courses completed',
      'Assignment grades',
      'Study hours',
      'Projects completed',
      'Skills learned',
    ],
    professional: [
      'Projects completed',
      'Tasks completed',
      'Meeting hours',
      'Skills developed',
      'Team collaborations',
    ],
    entrepreneur: [
      'Revenue (MRR/ARR)',
      'Customers',
      'Product launches',
      'User growth',
      'Revenue growth rate',
    ],
    creator: [
      'Content pieces published',
      'Followers/Subscribers',
      'Views/Impressions',
      'Engagement rate',
      'Revenue',
    ],
    developer: [
      'Commits',
      'Pull requests',
      'Code reviews',
      'Projects deployed',
      'GitHub stars',
    ],
  };

  const userType = profile.userType?.toLowerCase();
  if (userType && metricSuggestions[userType]) {
    return metricSuggestions[userType];
  }

  return [
    'Tasks completed',
    'Goals achieved',
    'Time invested',
    'Skills developed',
    'Progress made',
  ];
};
