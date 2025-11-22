import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface DashboardStats {
  okrStats: {
    totalObjectives: number;
    activeObjectives: number;
    completedObjectives: number;
    averageProgress: number;
    totalKeyResults: number;
    completedKeyResults: number;
  };
  journalStats: {
    totalEntries: number;
    currentStreak: number;
    longestStreak: number;
    averageMood: number;
    averageEnergy: number;
    entriesThisWeek: number;
    entriesThisMonth: number;
  };
  recentActivity: {
    lastJournalEntry?: string;
    lastOKRUpdate?: string;
    recentAchievements: Array<{
      type: 'objective_completed' | 'key_result_completed' | 'journal_streak';
      title: string;
      date: string;
    }>;
  };
}

export interface MoodEnergyTrend {
  date: string;
  mood: number | null;
  energy: number | null;
}

export interface OKRProgressTrend {
  objectiveId: string;
  objectiveTitle: string;
  currentProgress: number;
  recentUpdates: number;
}

/**
 * Get comprehensive dashboard statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error: any) {
    console.error('Failed to load dashboard stats:', error);
    throw error;
  }
};

/**
 * Get mood and energy trends
 */
export const getMoodEnergyTrends = async (days: number = 30): Promise<MoodEnergyTrend[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/dashboard/trends/mood-energy?days=${days}`, {
      headers: getAuthHeaders(),
    });
    return response.data.trends;
  } catch (error: any) {
    console.error('Failed to load mood/energy trends:', error);
    return [];
  }
};

/**
 * Get OKR progress trends
 */
export const getOKRProgressTrends = async (): Promise<OKRProgressTrend[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/dashboard/trends/okr-progress`, {
      headers: getAuthHeaders(),
    });
    return response.data.trends;
  } catch (error: any) {
    console.error('Failed to load OKR progress trends:', error);
    return [];
  }
};
