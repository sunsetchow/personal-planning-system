import request from 'supertest';
import { createApp } from '../../app';
import { generateToken } from '../../utils/jwt';
import * as dashboardService from '../../services/dashboardService';

// Mock the dashboard service
jest.mock('../../services/dashboardService');

describe('Dashboard API Integration Tests', () => {
  const app = createApp();
  const mockUserId = 'test-user-id';
  const mockToken = generateToken({ userId: mockUserId, email: 'test@example.com' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return dashboard statistics for authenticated user', async () => {
      const mockStats = {
        okrStats: {
          totalObjectives: 5,
          activeObjectives: 3,
          completedObjectives: 2,
          averageProgress: 65,
          totalKeyResults: 15,
          completedKeyResults: 8,
        },
        journalStats: {
          totalEntries: 30,
          currentStreak: 7,
          longestStreak: 14,
          averageMood: 7.5,
          averageEnergy: 6.8,
          entriesThisWeek: 5,
          entriesThisMonth: 22,
        },
        recentActivity: {
          lastJournalEntry: new Date(),
          lastOKRUpdate: new Date(),
          recentAchievements: [
            {
              type: 'journal_streak' as const,
              title: '7 day journal streak!',
              date: new Date(),
            },
          ],
        },
      };

      (dashboardService.getDashboardStats as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('okrStats');
      expect(response.body).toHaveProperty('journalStats');
      expect(response.body).toHaveProperty('recentActivity');
      expect(response.body.okrStats.totalObjectives).toBe(5);
      expect(response.body.journalStats.currentStreak).toBe(7);
      expect(dashboardService.getDashboardStats).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(dashboardService.getDashboardStats).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      (dashboardService.getDashboardStats as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/dashboard/trends/mood-energy', () => {
    it('should return mood and energy trends', async () => {
      const mockTrends = [
        { date: '2024-01-01', mood: 8, energy: 7 },
        { date: '2024-01-02', mood: 7, energy: 6 },
        { date: '2024-01-03', mood: 9, energy: 8 },
      ];

      (dashboardService.getMoodEnergyTrends as jest.Mock).mockResolvedValue(mockTrends);

      const response = await request(app)
        .get('/api/dashboard/trends/mood-energy?days=7')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('trends');
      expect(response.body.trends).toHaveLength(3);
      expect(response.body.trends[0]).toHaveProperty('date');
      expect(response.body.trends[0]).toHaveProperty('mood');
      expect(response.body.trends[0]).toHaveProperty('energy');
      expect(dashboardService.getMoodEnergyTrends).toHaveBeenCalledWith(mockUserId, 7);
    });

    it('should use default days parameter if not provided', async () => {
      const mockTrends: any[] = [];
      (dashboardService.getMoodEnergyTrends as jest.Mock).mockResolvedValue(mockTrends);

      await request(app)
        .get('/api/dashboard/trends/mood-energy')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(dashboardService.getMoodEnergyTrends).toHaveBeenCalledWith(mockUserId, 30);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/dashboard/trends/mood-energy')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/dashboard/trends/okr-progress', () => {
    it('should return OKR progress trends', async () => {
      const mockProgressTrends = [
        {
          objectiveId: 'obj-1',
          objectiveTitle: 'Test Objective 1',
          currentProgress: 65,
          recentUpdates: 5,
        },
        {
          objectiveId: 'obj-2',
          objectiveTitle: 'Test Objective 2',
          currentProgress: 80,
          recentUpdates: 3,
        },
      ];

      (dashboardService.getOKRProgressTrends as jest.Mock).mockResolvedValue(mockProgressTrends);

      const response = await request(app)
        .get('/api/dashboard/trends/okr-progress')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('trends');
      expect(response.body.trends).toHaveLength(2);
      expect(response.body.trends[0]).toHaveProperty('objectiveId');
      expect(response.body.trends[0]).toHaveProperty('objectiveTitle');
      expect(response.body.trends[0]).toHaveProperty('currentProgress');
      expect(dashboardService.getOKRProgressTrends).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/dashboard/trends/okr-progress')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return empty array if no objectives', async () => {
      (dashboardService.getOKRProgressTrends as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/dashboard/trends/okr-progress')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.trends).toHaveLength(0);
    });
  });
});
