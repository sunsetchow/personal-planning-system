import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../utils/validation';
import { registerUser, loginUser, getUserById } from '../services/authService';
import { AuthRequest } from '../middleware/auth';

/**
 * Authentication controller
 * Handles HTTP requests for authentication endpoints
 */

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('📝 Registration request received:', {
      email: req.body.email,
      name: req.body.name,
      hasPassword: !!req.body.password,
    });

    // Validate request body
    const validatedData = registerSchema.parse(req.body);
    console.log('✅ Validation passed');

    // Register user
    const result = await registerUser(validatedData);
    console.log('✅ User registered successfully:', { email: result.user.email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    next(error);
  }
};

/**
 * Login an existing user
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Login user
    const result = await loginUser(validatedData);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    // Get user details
    const user = await getUserById(req.user.userId);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 */
export const logout = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Logout is handled client-side by removing the JWT token
    // This endpoint exists for consistency and future server-side logout logic
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};
