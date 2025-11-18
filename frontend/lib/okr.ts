import { apiClient } from './api';
import { Objective, KeyResult} from './types';

/**
 * OKR API functions
 */

// Objective API functions
export const getObjectives = async (): Promise<Objective[]> => {
  const response = await apiClient.get<{ success: boolean; data: { objectives: Objective[] } }>(
    '/objectives'
  );
  return response.data.objectives;
};

export const getObjective = async (id: string): Promise<Objective> => {
  const response = await apiClient.get<{ success: boolean; data: { objective: Objective } }>(
    `/objectives/${id}`
  );
  return response.data.objective;
};

export const createObjective = async (data: {
  title: string;
  description?: string;
  periodType: string;
  startDate: string;
  endDate: string;
}): Promise<Objective> => {
  const response = await apiClient.post<{ success: boolean; data: { objective: Objective } }>(
    '/objectives',
    data
  );
  return response.data.objective;
};

export const updateObjective = async (
  id: string,
  data: Partial<{
    title: string;
    description: string;
    periodType: string;
    startDate: string;
    endDate: string;
    status: string;
  }>
): Promise<Objective> => {
  const response = await apiClient.put<{ success: boolean; data: { objective: Objective } }>(
    `/objectives/${id}`,
    data
  );
  return response.data.objective;
};

export const deleteObjective = async (id: string): Promise<void> => {
  await apiClient.delete(`/objectives/${id}`);
};

// Key Result API functions
export const getKeyResults = async (objectiveId: string): Promise<KeyResult[]> => {
  const response = await apiClient.get<{ success: boolean; data: { keyResults: KeyResult[] } }>(
    `/objectives/${objectiveId}/key-results`
  );
  return response.data.keyResults;
};

export const getKeyResult = async (id: string): Promise<KeyResult> => {
  const response = await apiClient.get<{ success: boolean; data: { keyResult: KeyResult } }>(
    `/key-results/${id}`
  );
  return response.data.keyResult;
};

export const createKeyResult = async (
  objectiveId: string,
  data: {
    title: string;
    description?: string;
    targetValue: number;
    currentValue?: number;
    unit: string;
  }
): Promise<KeyResult> => {
  const response = await apiClient.post<{ success: boolean; data: { keyResult: KeyResult } }>(
    `/objectives/${objectiveId}/key-results`,
    data
  );
  return response.data.keyResult;
};

export const updateKeyResult = async (
  id: string,
  data: Partial<{
    title: string;
    description: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    status: string;
  }>
): Promise<KeyResult> => {
  const response = await apiClient.put<{ success: boolean; data: { keyResult: KeyResult } }>(
    `/key-results/${id}`,
    data
  );
  return response.data.keyResult;
};

export const updateKeyResultProgress = async (
  id: string,
  currentValue: number,
  notes?: string
): Promise<KeyResult> => {
  const response = await apiClient.patch<{ success: boolean; data: { keyResult: KeyResult } }>(
    `/key-results/${id}/progress`,
    { currentValue, notes }
  );
  return response.data.keyResult;
};

export const deleteKeyResult = async (id: string): Promise<void> => {
  await apiClient.delete(`/key-results/${id}`);
};
