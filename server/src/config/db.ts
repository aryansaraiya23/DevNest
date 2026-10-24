import mongoose from 'mongoose';
import { ensureUsableDnsResolvers } from './dns';

/**
 * Safely masks credentials in MongoDB connection string for logging.
 */
export function sanitizeMongoUri(uri: string): string {
  if (!uri) return '[empty]';
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
}

/**
 * Ensures the target database name (default: devnest) is included in the connection URI.
 */
export function formatMongoUri(uri: string, defaultDb = 'devnest'): string {
  if (!uri) return uri;

  const queryIndex = uri.indexOf('?');
  const base = queryIndex !== -1 ? uri.substring(0, queryIndex) : uri;
  const query = queryIndex !== -1 ? uri.substring(queryIndex) : '';

  // Check if base has database path: mongodb(+srv)://host[:port]/db
  const lastSlashIndex = base.lastIndexOf('/');
  const protocolEndIndex = base.indexOf('://') + 3;

  if (lastSlashIndex < protocolEndIndex || lastSlashIndex === base.length - 1) {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}/${defaultDb}${query}`;
  }

  return uri;
}

let isConnected = false;

export async function connectDatabase(uri: string): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // Must run before mongodb+srv SRV resolution (c-ares).
  ensureUsableDnsResolvers();

  const targetUri = formatMongoUri(uri, 'devnest');
  const masked = sanitizeMongoUri(targetUri);

  try {
    console.log(`[Database] Connecting to MongoDB Atlas cluster at ${masked}...`);
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });

    isConnected = true;
    console.log(`[Database] Successfully connected to MongoDB database: "${conn.connection.name}"`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.error(`[Database Error] Failed to connect to MongoDB Atlas (${masked})`);
    if (error instanceof Error) {
      console.error(`[Database Error Details] ${error.message}`);
    }
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (isConnected || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] Disconnected from MongoDB');
  }
}

// Graceful process shutdown handling
export function setupDatabaseGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Closing database connection...`);
    try {
      await disconnectDatabase();
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
