import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance with auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface OKRUpdateSuggestion {
  objectiveId: string;
  keyResultId: string;
  suggestedValue: number;
  reasoning: string;
}

/**
 * Analyze a journal entry and get AI feedback
 */
export const analyzeJournalEntry = async (
  content: string,
  moodScore?: number,
  energyScore?: number
): Promise<string> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/ai/analyze-entry`,
      { content, moodScore, energyScore },
      { headers: getAuthHeaders() }
    );
    return response.data.feedback;
  } catch (error: any) {
    console.error('Failed to analyze journal entry:', error);
    throw error;
  }
};

/**
 * Get OKR update suggestions based on journal content
 */
export const suggestOKRUpdates = async (
  journalContent: string
): Promise<OKRUpdateSuggestion[]> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/ai/suggest-okr-updates`,
      { journalContent },
      { headers: getAuthHeaders() }
    );
    return response.data.suggestions;
  } catch (error: any) {
    console.error('Failed to get OKR suggestions:', error);
    return [];
  }
};

/**
 * Get AI-generated insights based on journal entries and OKRs
 */
export const getAIInsights = async (): Promise<string> => {
  try {
    const response = await axios.get(`${API_URL}/api/ai/insights`, {
      headers: getAuthHeaders(),
    });
    return response.data.insights;
  } catch (error: any) {
    console.error('Failed to get AI insights:', error);
    return 'Unable to generate insights at this time.';
  }
};

/**
 * Get AI-suggested key results for an objective
 */
export const suggestKeyResults = async (objectiveTitle: string): Promise<string[]> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/ai/suggest-key-results`,
      { objectiveTitle },
      { headers: getAuthHeaders() }
    );
    return response.data.suggestions;
  } catch (error: any) {
    console.error('Failed to get key result suggestions:', error);
    return [];
  }
};
