import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter
 * In production, consider using Redis for distributed rate limiting
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up old entries periodically
    setInterval(() => this.cleanup(), this.windowMs);
  }

  /**
   * Check if request should be allowed
   */
  public isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Filter out requests outside the current window
    const validRequests = userRequests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  /**
   * Clean up old entries from memory
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [identifier, timestamps] of this.requests.entries()) {
      const validRequests = timestamps.filter(
        (timestamp) => now - timestamp < this.windowMs
      );
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

const limiter = new RateLimiter();

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const identifier = req.ip || req.socket.remoteAddress || 'unknown';

  if (!limiter.isAllowed(identifier)) {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
    });
    return;
  }

  next();
};
