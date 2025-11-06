/**
 * Database Configuration
 * 
 * Centralized database connection configuration that supports both
 * DATABASE_URL (for Docker) and individual DB_* environment variables
 */

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Parse DATABASE_URL or construct from individual variables
 * Supports Docker internal hostnames (e.g., db:5432)
 */
function getDatabaseConfig(): PoolConfig {
  // If DATABASE_URL is provided, use it (Docker-friendly)
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      // Connection pool settings
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '2000', 10),
    };
  }

  // Otherwise, use individual environment variables
  return {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost', // Use 'db' in Docker, 'localhost' locally
    database: process.env.DB_NAME || 'comedyinsight',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '2000', 10),
  };
}

/**
 * Create and export database connection pool
 */
export const dbConfig = getDatabaseConfig();

/**
 * Create database pool instance
 * This should be called once at application startup
 */
export function createDatabasePool(): Pool {
  const pool = new Pool(dbConfig);

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
  });

  return pool;
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(pool: Pool): Promise<boolean> {
  try {
    await pool.query('SELECT NOW()');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

