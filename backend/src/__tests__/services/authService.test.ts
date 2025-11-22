import { registerUser, loginUser, getUserById } from '../../services/authService';
import prisma from '../../config/database';
import * as passwordUtils from '../../utils/password';
import * as jwtUtils from '../../utils/jwt';
import { ApiError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../../utils/password');
jest.mock('../../utils/jwt');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    const mockRegisterInput = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should successfully register a new user', async () => {
      const mockHashedPassword = 'hashed_password';
      const mockToken = 'jwt_token';
      const mockUser = {
        id: 'user-id',
        email: mockRegisterInput.email,
        name: mockRegisterInput.name,
        passwordHash: mockHashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue(mockHashedPassword);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (jwtUtils.generateToken as jest.Mock).mockReturnValue(mockToken);

      const result = await registerUser(mockRegisterInput);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockRegisterInput.email },
      });
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(mockRegisterInput.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: mockRegisterInput.email,
          passwordHash: mockHashedPassword,
          name: mockRegisterInput.name,
        },
      });
      expect(jwtUtils.generateToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
        token: mockToken,
      });
    });

    it('should throw error if user already exists', async () => {
      const existingUser = {
        id: 'existing-id',
        email: mockRegisterInput.email,
        name: 'Existing User',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      await expect(registerUser(mockRegisterInput)).rejects.toThrow(ApiError);
      await expect(registerUser(mockRegisterInput)).rejects.toThrow('User with this email already exists');

      expect(passwordUtils.hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');

      (prisma.user.findUnique as jest.Mock).mockRejectedValue(dbError);

      await expect(registerUser(mockRegisterInput)).rejects.toThrow(dbError);
    });
  });

  describe('loginUser', () => {
    const mockLoginInput = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-id',
      email: mockLoginInput.email,
      name: 'Test User',
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully login with valid credentials', async () => {
      const mockToken = 'jwt_token';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateToken as jest.Mock).mockReturnValue(mockToken);

      const result = await loginUser(mockLoginInput);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockLoginInput.email },
      });
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(
        mockLoginInput.password,
        mockUser.passwordHash
      );
      expect(jwtUtils.generateToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
        token: mockToken,
      });
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(loginUser(mockLoginInput)).rejects.toThrow(ApiError);
      await expect(loginUser(mockLoginInput)).rejects.toThrow('Invalid email or password');

      expect(passwordUtils.comparePassword).not.toHaveBeenCalled();
      expect(jwtUtils.generateToken).not.toHaveBeenCalled();
    });

    it('should throw error if password is invalid', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(loginUser(mockLoginInput)).rejects.toThrow(ApiError);
      await expect(loginUser(mockLoginInput)).rejects.toThrow('Invalid email or password');

      expect(jwtUtils.generateToken).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    const mockUserId = 'user-id';

    it('should return user if found', async () => {
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserById(mockUserId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getUserById(mockUserId)).rejects.toThrow(ApiError);
      await expect(getUserById(mockUserId)).rejects.toThrow('User not found');
    });
  });
});
