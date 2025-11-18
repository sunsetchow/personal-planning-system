import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/**
 * JWT utility functions for authentication
 */

export interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * Generate JWT token for a user
 */
export const generateToken = (payload: JwtPayload): string => {
  // Type cast to bypass Zod/jsonwebtoken type incompatibility
  return (jwt.sign as any)(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    return (jwt.verify as any)(token, env.JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};
