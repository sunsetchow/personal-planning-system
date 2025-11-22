import { generateToken, verifyToken, extractTokenFromHeader } from '../../utils/jwt';

describe('JWT Utils', () => {
  const mockPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken(mockPayload);
      const token2 = generateToken({
        userId: 'different-user-id',
        email: 'different@example.com',
      });

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';

      expect(() => verifyToken(malformedToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for empty token', () => {
      expect(() => verifyToken('')).toThrow('Invalid or expired token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'valid.jwt.token';
      const header = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    it('should return null for undefined header', () => {
      const extracted = extractTokenFromHeader(undefined);

      expect(extracted).toBeNull();
    });

    it('should return null for header without Bearer prefix', () => {
      const header = 'valid.jwt.token';

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBeNull();
    });

    it('should return null for header with wrong prefix', () => {
      const header = 'Basic valid.jwt.token';

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBeNull();
    });

    it('should return null for malformed Bearer header', () => {
      const header = 'Bearer';

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBeNull();
    });

    it('should return null for Bearer header with extra parts', () => {
      const header = 'Bearer token extra parts';

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBeNull();
    });

    it('should handle empty string header', () => {
      const extracted = extractTokenFromHeader('');

      expect(extracted).toBeNull();
    });
  });
});
