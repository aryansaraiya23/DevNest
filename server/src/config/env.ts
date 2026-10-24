import dotenv from 'dotenv';
import path from 'path';

// Ensure .env is loaded from server directory or current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Also fallback to root .env if not found
dotenv.config();

export interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  CLIENT_ORIGIN: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
}

export function validateEnvironment(): EnvironmentConfig {
  const missingVars: string[] = [];

  const NODE_ENV = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
  const PORT = parseInt(process.env.PORT || '5000', 10);
  const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const MONGODB_URI = process.env.MONGODB_URI?.trim() || '';
  const JWT_SECRET = process.env.JWT_SECRET?.trim() || '';

  if (NODE_ENV !== 'test') {
    if (!MONGODB_URI) {
      missingVars.push('MONGODB_URI');
    }
    if (!JWT_SECRET) {
      missingVars.push('JWT_SECRET');
    } else if (JWT_SECRET.length < 32) {
      throw new Error(
        '[Security Error] JWT_SECRET must be at least 32 characters long to ensure cryptographic integrity.'
      );
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `[Environment Error] Missing required environment variables in server/.env: ${missingVars.join(
        ', '
      )}. Please configure these before starting the server.`
    );
  }

  return {
    PORT,
    NODE_ENV,
    CLIENT_ORIGIN,
    MONGODB_URI,
    JWT_SECRET: JWT_SECRET || 'test_jwt_secret_key_minimum_32_characters_long_for_unit_tests',
  };
}

export const env = validateEnvironment();
