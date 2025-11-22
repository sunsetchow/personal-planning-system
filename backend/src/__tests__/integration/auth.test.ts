import request from 'supertest';
import { createApp } from '../../app';
import prisma from '../../config/database';
import { hashPassword } from '../../utils/password';

// Mock Prisma
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Auth API Integration Tests', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const mockCreatedUser = {
        id: 'new-user-id',
        email: newUser.email,
        name: newUser.name,
        passwordHash: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.user.name).toBe(newUser.name);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return 400 if user already exists', async () => {
      const existingUser = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      const mockExistingUser = {
        id: 'existing-id',
        email: existingUser.email,
        name: existingUser.name,
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 for invalid input', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: '123',
        name: '',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'password123',
      };

      const hashedPassword = await hashPassword(loginData.password);
      const mockUser = {
        id: 'user-id',
        email: loginData.email,
        name: 'Test User',
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should return 401 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 401 for wrong password', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'wrongpassword',
      };

      const correctPassword = await hashPassword('correctpassword');
      const mockUser = {
        id: 'user-id',
        email: loginData.email,
        name: 'Test User',
        passwordHash: correctPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid', password: '' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info for authenticated user', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // First login to get token
      const hashedPassword = await hashPassword('password123');
      const loginUser = { ...mockUser, passwordHash: hashedPassword };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(loginUser);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'password123' });

      const token = loginResponse.body.data.token;

      // Now test /me endpoint
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('email');
      expect(response.body.data.user).toHaveProperty('name');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });
  });
});
