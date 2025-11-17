import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Ensure environment variables are loaded before creating Prisma client
dotenv.config();

/**
 * Singleton instance of PrismaClient for database operations
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://Richard@localhost:5432/personal_planning?schema=public',
    },
  },
});

/**
 * Connects to the database and handles connection errors
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

/**
 * Gracefully disconnects from the database
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
};

export default prisma;
