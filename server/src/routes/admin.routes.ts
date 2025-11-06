/**
 * Admin Routes - Admin dashboard endpoints
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth.middleware';
import { jwtService } from '../services/jwt.service';

export const createAdminRoutes = (db: Pool): Router => {
  const router = Router();

  /**
   * GET /api/admin/debug/db-test
   * Debug endpoint to test database connection and table existence
   */
  router.get('/debug/db-test', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      // Test basic connection
      const connectionTest = await db.query('SELECT NOW() as current_time');
      
      // Check if users table exists
      const usersTableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        ) as exists;
      `);

      // Check if subscriptions table exists
      const subscriptionsTableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'subscriptions'
        ) as exists;
      `);

      // Try to query users table structure
      let usersColumns = null;
      try {
        const columnsResult = await db.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
          ORDER BY ordinal_position;
        `);
        usersColumns = columnsResult.rows;
      } catch (err: any) {
        usersColumns = { error: err.message };
      }

      res.status(200).json({
        success: true,
        database: {
          connected: true,
          currentTime: connectionTest.rows[0]?.current_time,
        },
        tables: {
          users: {
            exists: usersTableCheck.rows[0]?.exists || false,
            columns: usersColumns,
          },
          subscriptions: {
            exists: subscriptionsTableCheck.rows[0]?.exists || false,
          },
        },
      });
    } catch (error: any) {
      console.error('Debug DB test error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error?.message,
          code: error?.code,
          detail: error?.detail,
          stack: error?.stack,
        },
      });
    }
  });

  /**
   * POST /api/admin/login
   * Admin login endpoint
   */
  router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Username and password are required',
        });
        return;
      }

      // Get admin credentials from environment
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

      // Debug logging (remove in production)
      console.log('Admin login attempt:', {
        providedUsername: username,
        expectedUsername: adminUsername,
        providedPasswordLength: password?.length,
        expectedPasswordLength: adminPassword?.length,
        usernameMatch: username === adminUsername,
        passwordMatch: password === adminPassword,
        providedPassword: `"${password}"`,
        expectedPassword: `"${adminPassword}"`,
      });

      if (username !== adminUsername || password !== adminPassword) {
        console.log('Admin login failed: Invalid credentials', {
          usernameMatch: username === adminUsername,
          passwordMatch: password === adminPassword,
          providedPassword: `"${password}"`,
          expectedPassword: `"${adminPassword}"`,
        });
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid credentials',
        });
        return;
      }

      // Generate JWT token for admin
      const token = jwtService.generateAccessToken({
        userId: 'admin',
        phone: '',
        email: username,
      });

      res.status(200).json({
        token,
        user: {
          username,
          role: 'admin',
        },
      });
    } catch (error: any) {
      console.error('Admin login error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process login',
      });
    }
  });

  /**
   * GET /api/admin/stats
   * Get dashboard statistics
   */
  router.get('/stats', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      let totalVideos = 0;
      let totalUsers = 0;
      let totalViews = 0;
      let revenue = 0;

      // Get total videos (handle table not existing)
      try {
        const videosResult = await db.query('SELECT COUNT(*) as count FROM videos');
        totalVideos = parseInt(videosResult.rows[0]?.count || '0', 10);
      } catch (error) {
        console.warn('videos table not found, using default 0');
      }

      // Get total users (handle table not existing)
      try {
        const usersResult = await db.query('SELECT COUNT(*) as count FROM users');
        totalUsers = parseInt(usersResult.rows[0]?.count || '0', 10);
      } catch (error) {
        console.warn('users table not found, using default 0');
      }

      // Get total views (sum of view_count from videos)
      try {
        const viewsResult = await db.query(
          'SELECT COALESCE(SUM(view_count), 0) as total FROM videos'
        );
        totalViews = parseInt(viewsResult.rows[0]?.total || '0', 10);
      } catch (error) {
        console.warn('Could not fetch views, using default 0');
      }

      // Get revenue (sum of amount from subscriptions)
      try {
        const revenueResult = await db.query(
          `
          SELECT COALESCE(SUM(amount), 0) as total 
          FROM subscriptions 
          WHERE status = 'active'
          `
        );
        revenue = parseFloat(revenueResult.rows[0]?.total || '0');
      } catch (error) {
        console.warn('subscriptions table not found, using default 0');
      }

      res.status(200).json({
        totalVideos,
        totalUsers,
        totalViews,
        revenue,
      });
    } catch (error: any) {
      console.error('Stats error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch statistics',
      });
    }
  });

  /**
   * GET /api/admin/artists
   * Get all artists
   */
  router.get('/artists', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Fetching artists from database...');
      
      const result = await db.query(`
        SELECT 
          id,
          name,
          slug,
          bio,
          profile_image_url,
          is_active,
          is_featured,
          created_at
        FROM artists
        ORDER BY name ASC
      `);

      console.log(`Found ${result.rows.length} artists in database`);

      const artists = result.rows.map(row => ({
        id: row.id,
        name: row.name || 'Untitled',
        slug: row.slug || '',
        bio: row.bio || '',
        profile_image_url: row.profile_image_url || '',
        is_active: row.is_active || false,
        is_featured: row.is_featured || false,
        created_at: row.created_at,
      }));

      console.log(`Returning ${artists.length} artists to client`);
      res.status(200).json(artists);
    } catch (error: any) {
      console.error('Artists list error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch artists',
        details: error?.message,
      });
    }
  });

  /**
   * POST /api/admin/artists
   * Create a new artist
   */
  router.post('/artists', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, slug, bio, profile_image_url, is_active, is_featured } = req.body;

      if (!name) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Name is required',
        });
        return;
      }

      const artistSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const result = await db.query(
        `INSERT INTO artists (name, slug, bio, profile_image_url, is_active, is_featured)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, slug, bio, profile_image_url, is_active, is_featured, created_at`,
        [
          name,
          artistSlug,
          bio || null,
          profile_image_url || null,
          is_active !== undefined ? is_active : true,
          is_featured !== undefined ? is_featured : false,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create artist error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create artist',
        details: error?.message,
      });
    }
  });

  /**
   * PUT /api/admin/artists/:id
   * Update an artist
   */
  router.put('/artists/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, slug, bio, profile_image_url, is_active, is_featured } = req.body;

      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(name);
      }

      if (slug !== undefined) {
        updateFields.push(`slug = $${paramIndex++}`);
        updateValues.push(slug);
      } else if (name !== undefined) {
        // Auto-generate slug if name changed but slug not provided
        const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        updateFields.push(`slug = $${paramIndex++}`);
        updateValues.push(newSlug);
      }

      if (bio !== undefined) {
        updateFields.push(`bio = $${paramIndex++}`);
        updateValues.push(bio || null);
      }

      if (profile_image_url !== undefined) {
        updateFields.push(`profile_image_url = $${paramIndex++}`);
        updateValues.push(profile_image_url || null);
      }

      if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        updateValues.push(is_active);
      }

      if (is_featured !== undefined) {
        updateFields.push(`is_featured = $${paramIndex++}`);
        updateValues.push(is_featured);
      }

      if (updateFields.length === 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'No fields to update',
        });
        return;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);

      const result = await db.query(
        `UPDATE artists SET ${updateFields.join(', ')} WHERE id = $${paramIndex}
         RETURNING id, name, slug, bio, profile_image_url, is_active, is_featured, created_at, updated_at`,
        updateValues
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Artist not found',
        });
        return;
      }

      res.status(200).json(result.rows[0]);
    } catch (error: any) {
      console.error('Update artist error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update artist',
        details: error?.message,
      });
    }
  });

  /**
   * GET /api/admin/artists/:id
   * Get a single artist by ID
   */
  router.get('/artists/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT id, name, slug, bio, profile_image_url, is_active, is_featured, created_at, updated_at
         FROM artists WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Artist not found',
        });
        return;
      }

      res.status(200).json(result.rows[0]);
    } catch (error: any) {
      console.error('Get artist error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch artist',
        details: error?.message,
      });
    }
  });

  /**
   * GET /api/admin/categories
   * Get all categories
   */
  router.get('/categories', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Fetching categories from database...');
      
      const result = await db.query(`
        SELECT 
          id,
          name,
          slug,
          description,
          parent_id,
          display_order,
          is_active,
          created_at
        FROM categories
        ORDER BY display_order ASC, name ASC
      `);

      console.log(`Found ${result.rows.length} categories in database`);

      const categories = result.rows.map(row => ({
        id: row.id,
        name: row.name || 'Untitled',
        slug: row.slug || '',
        description: row.description || '',
        parent_id: row.parent_id || null,
        display_order: row.display_order || 0,
        is_active: row.is_active || false,
        created_at: row.created_at,
      }));

      console.log(`Returning ${categories.length} categories to client`);
      res.status(200).json(categories);
    } catch (error: any) {
      console.error('Categories list error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch categories',
        details: error?.message,
      });
    }
  });

  /**
   * POST /api/admin/categories
   * Create a new category
   */
  router.post('/categories', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, slug, description, parent_id, display_order, is_active } = req.body;

      if (!name) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Name is required',
        });
        return;
      }

      const categorySlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Get max display_order if not provided
      let order = display_order;
      if (order === undefined) {
        const maxOrderResult = await db.query('SELECT COALESCE(MAX(display_order), 0) as max_order FROM categories');
        order = (maxOrderResult.rows[0]?.max_order || 0) + 1;
      }

      const result = await db.query(
        `INSERT INTO categories (name, slug, description, parent_id, display_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, slug, description, parent_id, display_order, is_active, created_at`,
        [
          name,
          categorySlug,
          description || null,
          parent_id || null,
          order,
          is_active !== undefined ? is_active : true,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create category error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create category',
        details: error?.message,
      });
    }
  });

  /**
   * PUT /api/admin/categories/:id
   * Update a category
   */
  router.put('/categories/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, slug, description, parent_id, display_order, is_active } = req.body;

      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(name);
      }

      if (slug !== undefined) {
        updateFields.push(`slug = $${paramIndex++}`);
        updateValues.push(slug);
      } else if (name !== undefined) {
        // Auto-generate slug if name changed but slug not provided
        const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        updateFields.push(`slug = $${paramIndex++}`);
        updateValues.push(newSlug);
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        updateValues.push(description || null);
      }

      if (parent_id !== undefined) {
        updateFields.push(`parent_id = $${paramIndex++}`);
        updateValues.push(parent_id || null);
      }

      if (display_order !== undefined) {
        updateFields.push(`display_order = $${paramIndex++}`);
        updateValues.push(display_order);
      }

      if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        updateValues.push(is_active);
      }

      if (updateFields.length === 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'No fields to update',
        });
        return;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);

      const result = await db.query(
        `UPDATE categories SET ${updateFields.join(', ')} WHERE id = $${paramIndex}
         RETURNING id, name, slug, description, parent_id, display_order, is_active, created_at, updated_at`,
        updateValues
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Category not found',
        });
        return;
      }

      res.status(200).json(result.rows[0]);
    } catch (error: any) {
      console.error('Update category error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update category',
        details: error?.message,
      });
    }
  });

  /**
   * GET /api/admin/categories/:id
   * Get a single category by ID
   */
  router.get('/categories/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT id, name, slug, description, parent_id, display_order, is_active, created_at, updated_at
         FROM categories WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Category not found',
        });
        return;
      }

      res.status(200).json(result.rows[0]);
    } catch (error: any) {
      console.error('Get category error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch category',
        details: error?.message,
      });
    }
  });

  /**
   * GET /api/admin/fake-views
   * Get all fake views campaigns
   */
  router.get('/fake-views', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await db.query(`
        SELECT 
          fvl.id,
          fvl.video_id,
          v.title as video_title,
          fvl.request_type,
          fvl.fake_views_count,
          fvl.notes,
          fvl.created_at,
          u.username as created_by_username
        FROM fake_views_logs fvl
        LEFT JOIN videos v ON fvl.video_id = v.id
        LEFT JOIN users u ON fvl.created_by = u.id
        ORDER BY fvl.created_at DESC
        LIMIT 100
      `);

      const campaigns = result.rows.map(row => ({
        id: row.id,
        video_id: row.video_id,
        video_title: row.video_title || 'Unknown Video',
        request_type: row.request_type,
        fake_views_count: parseInt(row.fake_views_count || '0', 10),
        notes: row.notes || '',
        created_at: row.created_at,
        created_by: row.created_by_username || 'Unknown',
      }));

      res.status(200).json(campaigns);
    } catch (error: any) {
      console.error('Fake views list error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch fake views campaigns',
        details: error?.message,
      });
    }
  });

  /**
   * POST /api/admin/users
   * Create a new user
   */
  router.post('/users', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, phone, first_name, last_name, is_active, is_email_verified } = req.body;

      if (!username && !email && !phone) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'At least one of username, email, or phone is required',
        });
        return;
      }

      // Note: password_hash is required but we'll generate a random one for admin-created users
      // In production, you should require a password or use a different auth method
      // Users created this way will need to reset their password or use OAuth/OTP login
      const password_hash = crypto.randomBytes(32).toString('hex');
      
      const result = await db.query(
        `INSERT INTO users (username, email, phone, first_name, last_name, is_active, is_verified, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, username, email, phone, first_name, last_name, is_active, is_verified, created_at`,
        [
          username || null,
          email || null,
          phone || null,
          first_name || null,
          last_name || null,
          is_active !== undefined ? is_active : true,
          is_email_verified !== undefined ? is_email_verified : false, // Map to is_verified
          password_hash,
        ]
      );

      // Map is_verified to is_email_verified for frontend compatibility
      const user = result.rows[0];
      res.status(201).json({
        ...user,
        is_email_verified: user.is_verified,
      });
    } catch (error: any) {
      console.error('Create user error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create user',
        details: error?.message,
      });
    }
  });

  /**
   * GET /api/admin/users
   * Get all users
   */
  router.get('/users', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    console.log('[GET /api/admin/users] Request received');
    try {
      console.log('[GET /api/admin/users] Attempting database query...');
      
      // Try with deleted_at first, fallback to simple query if column doesn't exist
      let result;
      try {
        console.log('[GET /api/admin/users] Trying query with deleted_at filter...');
        result = await db.query(`
          SELECT 
            id,
            username,
            email,
            phone,
            first_name,
            last_name,
            is_active,
            is_verified,
            created_at
          FROM users
          WHERE deleted_at IS NULL
          ORDER BY created_at DESC
          LIMIT 100
        `);
        console.log(`[GET /api/admin/users] Query successful, found ${result.rows.length} users`);
      } catch (err: any) {
        console.log(`[GET /api/admin/users] First query failed: ${err.message}, code: ${err.code}`);
        // If deleted_at column doesn't exist, try without it
        if (err.code === '42703' || err.message?.includes('deleted_at') || err.message?.includes('column')) {
          console.log('[GET /api/admin/users] Retrying query without deleted_at filter...');
          result = await db.query(`
            SELECT 
              id,
              username,
              email,
              phone,
              first_name,
              last_name,
              is_active,
              is_verified,
              created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 100
          `);
          console.log(`[GET /api/admin/users] Retry successful, found ${result.rows.length} users`);
        } else {
          console.error('[GET /api/admin/users] Query error that cannot be retried:', err);
          throw err;
        }
      }

      const users = result.rows.map(row => ({
        id: row.id,
        username: row.username || '',
        email: row.email || '',
        phone: row.phone || '',
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        is_active: row.is_active !== false,
        is_email_verified: row.is_verified || false, // Map is_verified to is_email_verified for frontend compatibility
        created_at: row.created_at,
      }));

      console.log(`[GET /api/admin/users] Returning ${users.length} users`);
      res.status(200).json(users);
    } catch (error: any) {
      console.error('[GET /api/admin/users] FATAL ERROR:', error);
      console.error('[GET /api/admin/users] Error details:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        hint: error?.hint,
        position: error?.position,
        stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
      });
      // Always return 200 with empty array to prevent frontend crashes
      console.log('[GET /api/admin/users] Returning empty array due to error');
      res.status(200).json([]);
    }
  });

  /**
   * GET /api/admin/subscriptions
   * Get all subscriptions
   */
  router.get('/subscriptions', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    console.log('[GET /api/admin/subscriptions] Request received');
    try {
      console.log('[GET /api/admin/subscriptions] Attempting database query...');
      
      const result = await db.query(`
        SELECT 
          s.id,
          s.user_id,
          u.username,
          u.email,
          s.subscription_type,
          s.status,
          s.start_date,
          s.end_date,
          s.price,
          s.currency,
          s.created_at
        FROM subscriptions s
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
        LIMIT 100
      `);

      console.log(`[GET /api/admin/subscriptions] Query successful, found ${result.rows.length} subscriptions`);

      const subscriptions = result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        username: row.username || '',
        email: row.email || '',
        type: row.subscription_type || '', // Map subscription_type to type for frontend compatibility
        status: row.status || '',
        start_date: row.start_date,
        end_date: row.end_date,
        amount: parseFloat(row.price || '0'), // Map price to amount for frontend compatibility
        currency: row.currency || 'USD',
        created_at: row.created_at,
      }));

      console.log(`[GET /api/admin/subscriptions] Returning ${subscriptions.length} subscriptions`);
      res.status(200).json(subscriptions);
    } catch (error: any) {
      console.error('[GET /api/admin/subscriptions] FATAL ERROR:', error);
      console.error('[GET /api/admin/subscriptions] Error details:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        hint: error?.hint,
        position: error?.position,
        stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
      });
      // Always return 200 with empty array to prevent frontend crashes
      console.log('[GET /api/admin/subscriptions] Returning empty array due to error');
      res.status(200).json([]);
    }
  });

  /**
   * GET /api/admin/ads
   * Get all ads
   */
  router.get('/ads', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if ads table exists
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ads'
        );
      `);

      if (!tableCheck.rows[0]?.exists) {
        console.warn('ads table does not exist');
        res.status(200).json([]);
        return;
      }

      const result = await db.query(`
        SELECT 
          id,
          title,
          ad_type,
          position,
          ad_url,
          image_url,
          video_url,
          click_url,
          start_date,
          end_date,
          is_active,
          max_impressions,
          current_impressions,
          max_clicks,
          current_clicks,
          created_at
        FROM ads
        ORDER BY created_at DESC
      `);

      const ads = result.rows.map(row => ({
        id: row.id,
        title: row.title || '',
        ad_type: row.ad_type || '',
        position: row.position || '',
        ad_url: row.ad_url || '',
        image_url: row.image_url || '',
        video_url: row.video_url || '',
        click_url: row.click_url || '',
        start_date: row.start_date,
        end_date: row.end_date,
        is_active: row.is_active || false,
        max_impressions: parseInt(row.max_impressions || '0', 10),
        current_impressions: parseInt(row.current_impressions || '0', 10),
        max_clicks: parseInt(row.max_clicks || '0', 10),
        current_clicks: parseInt(row.current_clicks || '0', 10),
        created_at: row.created_at,
      }));

      res.status(200).json(ads);
    } catch (error: any) {
      console.error('Ads list error:', error);
      res.status(200).json([]);
    }
  });

  /**
   * POST /api/admin/ads
   * Create a new ad
   */
  router.post('/ads', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        title,
        ad_type,
        position,
        ad_url,
        image_url,
        video_url,
        click_url,
        start_date,
        end_date,
        is_active,
        max_impressions,
        max_clicks,
      } = req.body;

      if (!title || !ad_type || !position) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Title, ad_type, and position are required',
        });
        return;
      }

      const result = await db.query(
        `INSERT INTO ads (
          title, ad_type, position, ad_url, image_url, video_url, click_url,
          start_date, end_date, is_active, max_impressions, max_clicks,
          current_impressions, current_clicks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, 0)
        RETURNING id, title, ad_type, position, ad_url, image_url, video_url, click_url,
          start_date, end_date, is_active, max_impressions, current_impressions,
          max_clicks, current_clicks, created_at`,
        [
          title,
          ad_type,
          position,
          ad_url || null,
          image_url || null,
          video_url || null,
          click_url || null,
          start_date ? new Date(start_date) : null,
          end_date ? new Date(end_date) : null,
          is_active !== undefined ? is_active : true,
          max_impressions ? parseInt(max_impressions, 10) : null,
          max_clicks ? parseInt(max_clicks, 10) : null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create ad error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create ad',
        details: error?.message,
      });
    }
  });

  /**
   * PUT /api/admin/ads/:id
   * Update an ad
   */
  router.put('/ads/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        title,
        ad_type,
        position,
        ad_url,
        image_url,
        video_url,
        click_url,
        start_date,
        end_date,
        is_active,
        max_impressions,
        max_clicks,
      } = req.body;

      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updateFields.push(`title = $${paramIndex++}`);
        updateValues.push(title);
      }
      if (ad_type !== undefined) {
        updateFields.push(`ad_type = $${paramIndex++}`);
        updateValues.push(ad_type);
      }
      if (position !== undefined) {
        updateFields.push(`position = $${paramIndex++}`);
        updateValues.push(position);
      }
      if (ad_url !== undefined) {
        updateFields.push(`ad_url = $${paramIndex++}`);
        updateValues.push(ad_url || null);
      }
      if (image_url !== undefined) {
        updateFields.push(`image_url = $${paramIndex++}`);
        updateValues.push(image_url || null);
      }
      if (video_url !== undefined) {
        updateFields.push(`video_url = $${paramIndex++}`);
        updateValues.push(video_url || null);
      }
      if (click_url !== undefined) {
        updateFields.push(`click_url = $${paramIndex++}`);
        updateValues.push(click_url || null);
      }
      if (start_date !== undefined) {
        updateFields.push(`start_date = $${paramIndex++}`);
        updateValues.push(start_date ? new Date(start_date) : null);
      }
      if (end_date !== undefined) {
        updateFields.push(`end_date = $${paramIndex++}`);
        updateValues.push(end_date ? new Date(end_date) : null);
      }
      if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        updateValues.push(is_active);
      }
      if (max_impressions !== undefined) {
        updateFields.push(`max_impressions = $${paramIndex++}`);
        updateValues.push(max_impressions ? parseInt(max_impressions, 10) : null);
      }
      if (max_clicks !== undefined) {
        updateFields.push(`max_clicks = $${paramIndex++}`);
        updateValues.push(max_clicks ? parseInt(max_clicks, 10) : null);
      }

      if (updateFields.length === 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'No fields to update',
        });
        return;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);

      const result = await db.query(
        `UPDATE ads SET ${updateFields.join(', ')} WHERE id = $${paramIndex}
         RETURNING id, title, ad_type, position, ad_url, image_url, video_url, click_url,
           start_date, end_date, is_active, max_impressions, current_impressions,
           max_clicks, current_clicks, created_at, updated_at`,
        updateValues
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Ad not found',
        });
        return;
      }

      res.status(200).json(result.rows[0]);
    } catch (error: any) {
      console.error('Update ad error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update ad',
        details: error?.message,
      });
    }
  });

  /**
   * GET /api/admin/ads/:id
   * Get a single ad by ID
   */
  router.get('/ads/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT id, title, ad_type, position, ad_url, image_url, video_url, click_url,
         start_date, end_date, is_active, max_impressions, current_impressions,
         max_clicks, current_clicks, created_at, updated_at
         FROM ads WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Ad not found',
        });
        return;
      }

      res.status(200).json(result.rows[0]);
    } catch (error: any) {
      console.error('Get ad error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch ad',
        details: error?.message,
      });
    }
  });

  /**
   * GET /api/admin/notifications
   * Get all notifications
   */
  router.get('/notifications', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await db.query(`
        SELECT 
          n.id,
          n.user_id,
          u.username,
          u.email,
          n.title,
          n.body,
          n.notification_type,
          n.is_read,
          n.created_at
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        ORDER BY n.created_at DESC
        LIMIT 100
      `);

      const notifications = result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        username: row.username || '',
        email: row.email || '',
        title: row.title || '',
        body: row.body || '',
        notification_type: row.notification_type || 'general',
        is_read: row.is_read || false,
        created_at: row.created_at,
      }));

      res.status(200).json(notifications);
    } catch (error: any) {
      console.error('Notifications list error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch notifications',
        details: error?.message,
      });
    }
  });

  /**
   * POST /api/admin/notifications
   * Send notification to users
   */
  router.post('/notifications', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, title, body, notification_type } = req.body;

      if (!title || !body) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Title and body are required',
        });
        return;
      }

      // If user_id is provided, send to specific user, otherwise send to all users
      if (user_id) {
        const result = await db.query(
          `INSERT INTO notifications (user_id, title, body, notification_type) 
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [user_id, title, body, notification_type || 'general']
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Notification sent' });
      } else {
        // Send to all active users
        const usersResult = await db.query('SELECT id FROM users WHERE is_active = TRUE');
        const userIds = usersResult.rows.map(row => row.id);
        
        if (userIds.length === 0) {
          res.status(400).json({
            error: 'Bad Request',
            message: 'No active users found',
          });
          return;
        }

        // Insert notification for each user
        const values = userIds.map((uid, idx) => `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4})`).join(', ');
        const params: any[] = [];
        userIds.forEach(uid => {
          params.push(uid, title, body, notification_type || 'general');
        });

        await db.query(
          `INSERT INTO notifications (user_id, title, body, notification_type) VALUES ${values}`,
          params
        );

        res.status(201).json({ 
          message: `Notification sent to ${userIds.length} users`,
          users_count: userIds.length,
        });
      }
    } catch (error: any) {
      console.error('Send notification error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to send notification',
        details: error?.message,
      });
    }
  });

  /**
   * GET /api/admin/audit-logs
   * Get audit logs
   */
  router.get('/audit-logs', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await db.query(`
        SELECT 
          al.id,
          al.user_id,
          u.username,
          u.email,
          al.action,
          al.resource_type,
          al.resource_id,
          al.old_values,
          al.new_values,
          al.ip_address,
          al.user_agent,
          al.created_at
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 100
      `);

      const logs = result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        username: row.username || 'System',
        email: row.email || '',
        action: row.action || '',
        resource_type: row.resource_type || '',
        resource_id: row.resource_id,
        old_values: row.old_values || {},
        new_values: row.new_values || {},
        ip_address: row.ip_address || '',
        user_agent: row.user_agent || '',
        created_at: row.created_at,
      }));

      res.status(200).json(logs);
    } catch (error: any) {
      console.error('Audit logs list error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch audit logs',
        details: error?.message,
      });
    }
  });

  return router;
};
