/**
 * Type definitions for the Personal Planning System
 */

// Enums
export enum PeriodType {
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  ANNUAL = 'ANNUAL',
}

export enum ObjectiveStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum KeyResultStatus {
  ON_TRACK = 'ON_TRACK',
  AT_RISK = 'AT_RISK',
  BEHIND = 'BEHIND',
  COMPLETED = 'COMPLETED',
}

export enum UpdateType {
  MANUAL = 'MANUAL',
  JOURNAL_SUGGESTED = 'JOURNAL_SUGGESTED',
  JOURNAL_AUTO = 'JOURNAL_AUTO',
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// OKR types
export interface Objective {
  id: string;
  userId: string;
  title: string;
  description?: string;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  status: ObjectiveStatus;
  keyResults?: KeyResult[];
  createdAt: string;
  updatedAt: string;
}

export interface KeyResult {
  id: string;
  objectiveId: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: KeyResultStatus;
  objective?: Objective;
  createdAt: string;
  updatedAt: string;
}

export interface OkrUpdate {
  id: string;
  keyResultId: string;
  journalEntryId?: string;
  previousValue: number;
  newValue: number;
  updateType: UpdateType;
  notes?: string;
  createdAt: string;
}

// Journal types
export interface JournalTemplate {
  id: string;
  userId: string;
  name: string;
  questions: QuestionItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionItem {
  id: string;
  question: string;
  type: 'text' | 'number' | 'scale' | 'multiline';
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

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
}
