/**
 * Audit Middleware - Log admin and auth actions
 */

import { Pool } from 'pg';

class AuditLogger {
  private db: Pool;

  constructor(db?: Pool) {
    this.db = db || (global as any).dbPool;
  }

  async logAuthAction(action: string, details: any): Promise<void> {
    try {
      if (!this.db) {
        console.log(`[AUDIT] ${action}:`, details);
        return;
      }

      await this.db.query(
        `
        INSERT INTO audit_logs (action, resource_type, new_values, created_at)
        VALUES ($1, 'auth', $2, NOW())
        `,
        [action, JSON.stringify(details)]
      );
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  async logAdminAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    try {
      if (!this.db) {
        console.log(`[AUDIT] ${action}:`, { userId, resourceType, resourceId });
        return;
      }

      await this.db.query(
        `
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `,
        [
          userId,
          action,
          resourceType,
          resourceId,
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
        ]
      );
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

/**
 * Convenience function for logging
 */
export const auditLog = (action: string, details: any, userId?: string): void => {
  if (userId) {
    auditLogger.logAdminAction(userId, action, 'system', '', {}, details);
  } else {
    auditLogger.logAuthAction(action, details);
  }
};