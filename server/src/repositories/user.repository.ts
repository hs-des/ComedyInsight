/**
 * User Repository - Database operations for users
 */

import { Pool } from 'pg';
import { UserRecord, UserResponse } from '../types/auth.types';

export class UserRepository {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Find user by phone
   */
  async findByPhone(phone: string): Promise<UserRecord | null> {
    const result = await this.db.query<UserRecord>(
      `
      SELECT *
      FROM users
      WHERE phone = $1 AND deleted_at IS NULL
      LIMIT 1
      `,
      [phone]
    );

    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserRecord | null> {
    const result = await this.db.query<UserRecord>(
      `
      SELECT *
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
      LIMIT 1
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Create new user
   */
  async create(userData: {
    phone: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<UserRecord> {
    const result = await this.db.query<UserRecord>(
      `
      INSERT INTO users (phone, email, first_name, last_name, is_verified)
      VALUES ($1, $2, $3, $4, false)
      RETURNING *
      `,
      [userData.phone, userData.email, userData.first_name, userData.last_name]
    );

    return result.rows[0];
  }

  /**
   * Update user last login
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.db.query(
      `
      UPDATE users
      SET last_login = NOW()
      WHERE id = $1
      `,
      [userId]
    );
  }

  /**
   * Convert database user to response format
   */
  toUserResponse(user: UserRecord): UserResponse {
    return {
      id: user.id,
      username: user.username || undefined,
      email: user.email || undefined,
      phone: user.phone || undefined,
      first_name: user.first_name || undefined,
      last_name: user.last_name || undefined,
      profile_picture_url: user.profile_picture_url || undefined,
      is_verified: user.is_verified,
    };
  }
}

