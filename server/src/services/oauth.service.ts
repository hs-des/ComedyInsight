/**
 * OAuth Service - Provider token verification and user mapping
 */

import axios from 'axios';
import { Pool } from 'pg';
import {
  OAuthProvider,
  OAuthProviderInfo,
  OAuthRequest,
  AuthError,
} from '../types/auth.types';

export class OAuthService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Verify OAuth token with provider
   */
  async verifyProviderToken(
    provider: OAuthProvider,
    accessToken: string,
    idToken?: string
  ): Promise<OAuthProviderInfo> {
    switch (provider) {
      case OAuthProvider.GOOGLE:
        return this.verifyGoogleToken(accessToken);
      case OAuthProvider.APPLE:
        return this.verifyAppleToken(accessToken, idToken);
      case OAuthProvider.FACEBOOK:
        return this.verifyFacebookToken(accessToken);
      default:
        throw new AuthError('Unsupported OAuth provider', 'UNSUPPORTED_PROVIDER', 400);
    }
  }

  /**
   * Verify Google OAuth token
   */
  private async verifyGoogleToken(accessToken: string): Promise<OAuthProviderInfo> {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
      );

      const { user_id, email, verified_email } = response.data;

      if (!user_id) {
        throw new AuthError('Invalid Google token', 'INVALID_TOKEN', 401);
      }

      return {
        provider_user_id: user_id,
        email,
        verified: verified_email === 'true',
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new AuthError('Invalid or expired Google token', 'INVALID_TOKEN', 401);
      }
      throw new AuthError('Failed to verify Google token', 'VERIFICATION_FAILED', 500);
    }
  }

  /**
   * Verify Apple OAuth token
   * Note: This is a stub implementation
   * In production, use proper JWT verification with Apple's public keys
   */
  private async verifyAppleToken(
    accessToken: string,
    idToken?: string
  ): Promise<OAuthProviderInfo> {
    // Stub implementation - in production:
    // 1. Decode id_token JWT
    // 2. Verify signature with Apple's public keys
    // 3. Verify audience and issuer
    // 4. Extract user info

    if (!idToken) {
      throw new AuthError('Apple id_token required', 'MISSING_ID_TOKEN', 400);
    }

    try {
      // For development/testing, we'll decode without verification
      // In production, use proper JWT verification
      const decoded = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());

      return {
        provider_user_id: decoded.sub || accessToken, // Fallback to access token
        email: decoded.email,
        verified: decoded.email_verified === true,
      };
    } catch (error) {
      throw new AuthError('Invalid Apple token', 'INVALID_TOKEN', 401);
    }
  }

  /**
   * Verify Facebook OAuth token
   */
  private async verifyFacebookToken(accessToken: string): Promise<OAuthProviderInfo> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`
      );

      const { id, email, name, picture } = response.data;

      if (!id) {
        throw new AuthError('Invalid Facebook token', 'INVALID_TOKEN', 401);
      }

      return {
        provider_user_id: id,
        email,
        name,
        picture: picture?.data?.url,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new AuthError('Invalid or expired Facebook token', 'INVALID_TOKEN', 401);
      }
      throw new AuthError('Failed to verify Facebook token', 'VERIFICATION_FAILED', 500);
    }
  }

  /**
   * Find or create OAuth account and link to user
   */
  async findOrCreateOAuthAccount(
    provider: OAuthProvider,
    providerInfo: OAuthProviderInfo,
    accessToken: string,
    refreshToken?: string
  ): Promise<string> {
    // Find existing OAuth account
    const existing = await this.db.query<{ id: string; user_id: string }>(
      `
      SELECT id, user_id
      FROM oauth_accounts
      WHERE provider = $1 AND provider_user_id = $2
      LIMIT 1
      `,
      [provider, providerInfo.provider_user_id]
    );

    if (existing.rows[0]) {
      // Update tokens
      await this.db.query(
        `
        UPDATE oauth_accounts
        SET access_token = $1, refresh_token = $2, updated_at = NOW()
        WHERE id = $3
        `,
        [accessToken, refreshToken, existing.rows[0].id]
      );

      return existing.rows[0].user_id;
    }

    // Find or create user by email if available
    let userId: string | undefined;

    if (providerInfo.email) {
      const user = await this.db.query<{ id: string }>(
        `
        SELECT id FROM users WHERE email = $1 LIMIT 1
        `,
        [providerInfo.email]
      );

      userId = user.rows[0]?.id;
    }

    // Create user if doesn't exist
    if (!userId) {
      const newUser = await this.db.query<{ id: string }>(
        `
        INSERT INTO users (
          email, 
          profile_picture_url, 
          is_verified,
          metadata
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [
          providerInfo.email,
          providerInfo.picture,
          providerInfo.verified || false,
          JSON.stringify({ oauth_provider: provider, name: providerInfo.name }),
        ]
      );

      userId = newUser.rows[0].id;
    }

    // Create OAuth account link
    await this.db.query(
      `
      INSERT INTO oauth_accounts (
        user_id, 
        provider, 
        provider_user_id, 
        access_token, 
        refresh_token,
        provider_metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        userId,
        provider,
        providerInfo.provider_user_id,
        accessToken,
        refreshToken,
        JSON.stringify(providerInfo),
      ]
    );

    return userId;
  }
}

