import { apiClient } from './api';

/**
 * Journal API functions
 */

// Types
export interface Question {
  id: string;
  question: string;
  type: 'text' | 'number' | 'scale' | 'multiline';
}

export interface JournalTemplate {
  id: string;
  userId: string;
  name: string;
  questions: Question[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  templateId: string;
  entryDate: string;
  responses: Record<string, unknown>;
  moodScore?: number;
  energyScore?: number;
  aiFeedback?: string;
  template?: JournalTemplate;
  createdAt: string;
  updatedAt: string;
}

// Template API functions
export const getTemplates = async (): Promise<JournalTemplate[]> => {
  const response = await apiClient.get<{ success: boolean; data: { templates: JournalTemplate[] } }>(
    '/journal-templates'
  );
  return response.data.templates;
};

export const getActiveTemplate = async (): Promise<JournalTemplate | null> => {
  const response = await apiClient.get<{ success: boolean; data: { template: JournalTemplate | null } }>(
    '/journal-templates/active'
  );
  return response.data.template;
};

export const getTemplate = async (id: string): Promise<JournalTemplate> => {
  const response = await apiClient.get<{ success: boolean; data: { template: JournalTemplate } }>(
    `/journal-templates/${id}`
  );
  return response.data.template;
};

export const createTemplate = async (data: {
  name: string;
  questions: Question[];
  isActive?: boolean;
}): Promise<JournalTemplate> => {
  const response = await apiClient.post<{ success: boolean; data: { template: JournalTemplate } }>(
    '/journal-templates',
    data
  );
  return response.data.template;
};

export const updateTemplate = async (
  id: string,
  data: Partial<{
    name: string;
    questions: Question[];
    isActive: boolean;
  }>
): Promise<JournalTemplate> => {
  const response = await apiClient.put<{ success: boolean; data: { template: JournalTemplate } }>(
    `/journal-templates/${id}`,
    data
  );
  return response.data.template;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await apiClient.delete(`/journal-templates/${id}`);
};

// Entry API functions
export const getEntries = async (params?: {
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<JournalEntry[]> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const url = `/journal-entries${queryParams.toString() ? `?${queryParams}` : ''}`;
  const response = await apiClient.get<{ success: boolean; data: { entries: JournalEntry[] } }>(url);
  return response.data.entries;
};

export const getEntryByDate = async (date: string): Promise<JournalEntry | null> => {
  const response = await apiClient.get<{ success: boolean; data: { entry: JournalEntry | null } }>(
    `/journal-entries/date/${date}`
  );
  return response.data.entry;
};

export const getEntry = async (id: string): Promise<JournalEntry> => {
  const response = await apiClient.get<{ success: boolean; data: { entry: JournalEntry } }>(
    `/journal-entries/${id}`
  );
  return response.data.entry;
};

export const getEntryStats = async (): Promise<{
  totalEntries: number;
  averageMoodScore: number;
  averageEnergyScore: number;
}> => {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      stats: {
        totalEntries: number;
        averageMoodScore: number;
        averageEnergyScore: number;
      };
    };
  }>('/journal-entries/stats');
  return response.data.stats;
};

export const createEntry = async (data: {
  templateId: string;
  entryDate: string;
  responses: Record<string, unknown>;
  moodScore?: number;
  energyScore?: number;
}): Promise<JournalEntry> => {
  const response = await apiClient.post<{ success: boolean; data: { entry: JournalEntry } }>(
    '/journal-entries',
    data
  );
  return response.data.entry;
};

export const updateEntry = async (
  id: string,
  data: Partial<{
    responses: Record<string, unknown>;
    moodScore: number;
    energyScore: number;
  }>
): Promise<JournalEntry> => {
  const response = await apiClient.put<{ success: boolean; data: { entry: JournalEntry } }>(
    `/journal-entries/${id}`,
    data
  );
  return response.data.entry;
};

export const deleteEntry = async (id: string): Promise<void> => {
  await apiClient.delete(`/journal-entries/${id}`);
};
