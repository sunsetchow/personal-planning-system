import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
  };
};

export interface WeeklyReportData {
  dateRange: {
    start: string;
    end: string;
    weekNumber: number;
    year: number;
  };
  journalSummary: {
    totalEntries: number;
    averageMood: number;
    averageEnergy: number;
    moodTrend: 'improving' | 'declining' | 'stable';
    energyTrend: 'improving' | 'declining' | 'stable';
    topEmotions: string[];
    highlights: Array<{
      date: string;
      content: string;
      moodScore?: number;
    }>;
  };
  okrProgress: {
    objectivesWorkedOn: number;
    totalProgress: number;
    completedKeyResults: number;
    updatesThisWeek: number;
    topObjectives: Array<{
      id: string;
      title: string;
      progress: number;
      change: number;
    }>;
  };
  achievements: Array<{
    type: 'objective_completed' | 'key_result_completed' | 'journal_streak' | 'mood_improvement';
    title: string;
    description: string;
    date: string;
  }>;
  insights: {
    aiSummary: string;
    patterns: string[];
    recommendations: string[];
  };
  weekOverWeekComparison: {
    entriesChange: number;
    moodChange: number;
    energyChange: number;
    progressChange: number;
  };
}

export interface AvailableWeek {
  week: number;
  year: number;
  start: string;
  end: string;
}

/**
 * Get weekly report
 * @param weekOffset 0 = current week, -1 = last week, etc.
 */
export const getWeeklyReport = async (weekOffset: number = 0): Promise<WeeklyReportData> => {
  const response = await axios.get(`${API_URL}/api/reports/weekly`, {
    params: { weekOffset },
    headers: getAuthHeaders(),
  });
  return response.data.data;
};

/**
 * Get available weeks for reports
 */
export const getAvailableWeeks = async (): Promise<AvailableWeek[]> => {
  const response = await axios.get(`${API_URL}/api/reports/available-weeks`, {
    headers: getAuthHeaders(),
  });
  return response.data.data;
};
