import bcrypt from 'bcrypt';

/**
 * Password hashing and verification utilities
 */

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password with a hashed password
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Validate password strength
 * Minimum 8 characters, at least one letter and one number
 */
export const validatePasswordStrength = (password: string): boolean => {
  const minLength = 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  return password.length >= minLength && hasLetter && hasNumber;
};
