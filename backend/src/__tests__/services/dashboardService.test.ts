import { getDashboardStats, getMoodEnergyTrends, getOKRProgressTrends } from '../../services/dashboardService';
import * as objectiveService from '../../services/objectiveService';
import * as journalEntryService from '../../services/journalEntryService';
import prisma from '../../config/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    okrUpdate: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    journalEntry: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../services/objectiveService');
jest.mock('../../services/journalEntryService');

describe('DashboardService', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should calculate correct OKR statistics', async () => {
      // Mock objectives with key results
      const mockObjectives = [
        {
          id: 'obj-1',
          userId: mockUserId,
          title: 'Test Objective 1',
          status: 'ACTIVE',
          updatedAt: new Date(),
          keyResults: [
            {
              id: 'kr-1',
              currentValue: 50,
              targetValue: 100,
              status: 'ON_TRACK',
              updatedAt: new Date(),
            },
            {
              id: 'kr-2',
              currentValue: 75,
              targetValue: 100,
              status: 'ON_TRACK',
              updatedAt: new Date(),
            },
          ],
        },
        {
          id: 'obj-2',
          userId: mockUserId,
          title: 'Test Objective 2',
          status: 'COMPLETED',
          updatedAt: new Date(),
          keyResults: [
            {
              id: 'kr-3',
              currentValue: 100,
              targetValue: 100,
              status: 'COMPLETED',
              updatedAt: new Date(),
            },
          ],
        },
      ];

      const mockJournalEntries = [
        {
          id: 'entry-1',
          entryDate: new Date(),
          moodScore: 8,
          energyScore: 7,
        },
      ];

      (objectiveService.getUserObjectives as jest.Mock).mockResolvedValue(mockObjectives);
      (journalEntryService.getUserEntries as jest.Mock).mockResolvedValue(mockJournalEntries);
      (prisma.okrUpdate.findFirst as jest.Mock).mockResolvedValue(null);

      const stats = await getDashboardStats(mockUserId);

      expect(stats.okrStats.totalObjectives).toBe(2);
      expect(stats.okrStats.activeObjectives).toBe(1);
      expect(stats.okrStats.completedObjectives).toBe(1);
      expect(stats.okrStats.totalKeyResults).toBe(3);
      expect(stats.okrStats.completedKeyResults).toBe(1);
      // Average progress: obj1 = (50+75)/2 = 62.5, obj2 = 100, total = (62.5+100)/2 = 81.25 -> rounded to 81
      expect(stats.okrStats.averageProgress).toBe(81);
    });

    it('should calculate journal statistics correctly', async () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const mockJournalEntries = [
        {
          id: 'entry-1',
          entryDate: now,
          moodScore: 8,
          energyScore: 7,
        },
        {
          id: 'entry-2',
          entryDate: twoDaysAgo,
          moodScore: 6,
          energyScore: 5,
        },
        {
          id: 'entry-3',
          entryDate: tenDaysAgo,
          moodScore: 7,
          energyScore: 6,
        },
      ];

      (objectiveService.getUserObjectives as jest.Mock).mockResolvedValue([]);
      (journalEntryService.getUserEntries as jest.Mock).mockResolvedValue(mockJournalEntries);
      (prisma.okrUpdate.findFirst as jest.Mock).mockResolvedValue(null);

      const stats = await getDashboardStats(mockUserId);

      expect(stats.journalStats.totalEntries).toBe(3);
      expect(stats.journalStats.averageMood).toBe(7); // (8+6+7)/3 = 7
      expect(stats.journalStats.averageEnergy).toBe(6); // (7+5+6)/3 = 6
      expect(stats.journalStats.entriesThisWeek).toBe(2); // now and 2 days ago
    });

    it('should calculate current streak correctly for consecutive days', async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const mockJournalEntries = [
        { id: 'e1', entryDate: now, moodScore: 8, energyScore: 7 },
        { id: 'e2', entryDate: yesterday, moodScore: 7, energyScore: 6 },
        { id: 'e3', entryDate: twoDaysAgo, moodScore: 6, energyScore: 5 },
      ];

      (objectiveService.getUserObjectives as jest.Mock).mockResolvedValue([]);
      (journalEntryService.getUserEntries as jest.Mock).mockResolvedValue(mockJournalEntries);
      (prisma.okrUpdate.findFirst as jest.Mock).mockResolvedValue(null);

      const stats = await getDashboardStats(mockUserId);

      expect(stats.journalStats.currentStreak).toBe(3);
      expect(stats.journalStats.longestStreak).toBe(3);
    });

    it('should handle zero streaks when no entries today', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const mockJournalEntries = [
        { id: 'e1', entryDate: twoDaysAgo, moodScore: 8, energyScore: 7 },
      ];

      (objectiveService.getUserObjectives as jest.Mock).mockResolvedValue([]);
      (journalEntryService.getUserEntries as jest.Mock).mockResolvedValue(mockJournalEntries);
      (prisma.okrUpdate.findFirst as jest.Mock).mockResolvedValue(null);

      const stats = await getDashboardStats(mockUserId);

      expect(stats.journalStats.currentStreak).toBe(0);
      expect(stats.journalStats.longestStreak).toBe(1);
    });

    it('should handle empty data gracefully', async () => {
      (objectiveService.getUserObjectives as jest.Mock).mockResolvedValue([]);
      (journalEntryService.getUserEntries as jest.Mock).mockResolvedValue([]);
      (prisma.okrUpdate.findFirst as jest.Mock).mockResolvedValue(null);

      const stats = await getDashboardStats(mockUserId);

      expect(stats.okrStats.totalObjectives).toBe(0);
      expect(stats.okrStats.averageProgress).toBe(0);
      expect(stats.journalStats.totalEntries).toBe(0);
      expect(stats.journalStats.currentStreak).toBe(0);
      expect(stats.journalStats.averageMood).toBe(0);
    });

    it('should include recent achievements', async () => {
      const now = new Date();
      const mockObjectives = [
        {
          id: 'obj-1',
          title: 'Complete Project',
          status: 'COMPLETED',
          updatedAt: now,
          keyResults: [],
        },
      ];

      const mockJournalEntries = [
        { id: 'e1', entryDate: now, moodScore: 8, energyScore: 7 },
        { id: 'e2', entryDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), moodScore: 7, energyScore: 6 },
        { id: 'e3', entryDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), moodScore: 6, energyScore: 5 },
        { id: 'e4', entryDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), moodScore: 7, energyScore: 6 },
        { id: 'e5', entryDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), moodScore: 8, energyScore: 7 },
        { id: 'e6', entryDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), moodScore: 7, energyScore: 6 },
        { id: 'e7', entryDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), moodScore: 6, energyScore: 5 },
      ];

      (objectiveService.getUserObjectives as jest.Mock).mockResolvedValue(mockObjectives);
      (journalEntryService.getUserEntries as jest.Mock).mockResolvedValue(mockJournalEntries);
      (prisma.okrUpdate.findFirst as jest.Mock).mockResolvedValue(null);

      const stats = await getDashboardStats(mockUserId);

      expect(stats.recentActivity.recentAchievements.length).toBeGreaterThan(0);
      // Should have objective completed and 7 day streak achievements
      const achievementTypes = stats.recentActivity.recentAchievements.map(a => a.type);
      expect(achievementTypes).toContain('objective_completed');
      expect(achievementTypes).toContain('journal_streak');
    });
  });

  describe('getMoodEnergyTrends', () => {
    it('should return mood and energy trends for specified days', async () => {
      const now = new Date();
      const mockEntries = [
        {
          entryDate: now,
          moodScore: 8,
          energyScore: 7,
        },
        {
          entryDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          moodScore: 6,
          energyScore: 5,
        },
      ];

      (prisma.journalEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const trends = await getMoodEnergyTrends(mockUserId, 7);

      expect(trends).toHaveLength(2);
      expect(trends[0]).toHaveProperty('date');
      expect(trends[0]).toHaveProperty('mood', 8);
      expect(trends[0]).toHaveProperty('energy', 7);
    });

    it('should format dates correctly', async () => {
      const testDate = new Date('2024-01-15T12:00:00Z');
      const mockEntries = [
        {
          entryDate: testDate,
          moodScore: 8,
          energyScore: 7,
        },
      ];

      (prisma.journalEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const trends = await getMoodEnergyTrends(mockUserId, 7);

      expect(trends[0].date).toBe('2024-01-15');
    });
  });

  describe('getOKRProgressTrends', () => {
    it('should return progress data for all objectives', async () => {
      const mockObjectives = [
        {
          id: 'obj-1',
          title: 'Test Objective',
          keyResults: [
            { id: 'kr-1', currentValue: 50, targetValue: 100 },
            { id: 'kr-2', currentValue: 80, targetValue: 100 },
          ],
        },
      ];

      (objectiveService.getUserObjectives as jest.Mock).mockResolvedValue(mockObjectives);
      (prisma.okrUpdate.findMany as jest.Mock).mockResolvedValue([
        { id: 'update-1', createdAt: new Date() },
      ]);

      const trends = await getOKRProgressTrends(mockUserId);

      expect(trends).toHaveLength(1);
      expect(trends[0].objectiveId).toBe('obj-1');
      expect(trends[0].objectiveTitle).toBe('Test Objective');
      expect(trends[0].currentProgress).toBe(65); // (50 + 80) / 2 = 65
      expect(trends[0].recentUpdates).toBe(1);
    });

    it('should handle objectives with no key results', async () => {
      const mockObjectives = [
        {
          id: 'obj-1',
          title: 'Empty Objective',
          keyResults: [],
        },
      ];

      (objectiveService.getUserObjectives as jest.Mock).mockResolvedValue(mockObjectives);
      (prisma.okrUpdate.findMany as jest.Mock).mockResolvedValue([]);

      const trends = await getOKRProgressTrends(mockUserId);

      expect(trends).toHaveLength(1);
      expect(trends[0].currentProgress).toBe(0);
      expect(trends[0].recentUpdates).toBe(0);
    });
  });
});
