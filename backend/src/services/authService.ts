import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../utils/validation';
import { ApiError } from '../middleware/errorHandler';

/**
 * Authentication service layer
 * Handles business logic for user authentication
 */

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

/**
 * Register a new user
 */
export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  console.log('🔍 Checking if user exists:', { email: input.email });

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    console.log('⚠️ User already exists:', { email: input.email });
    throw new ApiError(400, 'User with this email already exists');
  }

  console.log('🔒 Hashing password');
  // Hash password
  const passwordHash = await hashPassword(input.password);

  console.log('💾 Creating user in database');
  // Create user
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
  });

  console.log('🔑 Generating JWT token');
  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    token,
  };
};

/**
 * Login an existing user
 */
export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await comparePassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    token,
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
};
