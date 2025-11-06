/**
 * Downloads Controller
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';
import { DownloadService } from '../services/download.service';

export class DownloadsController {
  private downloadService: DownloadService;

  constructor(db: Pool) {
    this.downloadService = new DownloadService(db);
  }

  /**
   * Request download URL with encryption token
   */
  requestDownload = async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { video_id, quality, device_id } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const result = await this.downloadService.requestDownloadUrl({
        videoId: video_id,
        userId,
        deviceId: device_id || 'unknown',
        quality: quality || '720p',
      });

      res.json({
        success: true,
        presigned_url: result.presignedUrl,
        decryption_token: result.decryptionToken,
        expiry_date: result.expiryDate,
      });
    } catch (error: any) {
      console.error('Download request error:', error);
      res.status(400).json({ message: error.message });
    }
  };

  /**
   * Verify download token
   */
  verifyToken = async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { device_id, token } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const isValid = await this.downloadService.verifyDownloadToken(
        token,
        userId,
        device_id
      );

      res.json({
        valid: isValid,
      });
    } catch (error: any) {
      console.error('Token verification error:', error);
      res.status(400).json({ message: error.message });
    }
  };

  /**
   * Revoke downloads (remote wipe)
   */
  revokeDownloads = async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { device_id } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      await this.downloadService.revokeDownloads(userId, device_id);

      res.json({
        success: true,
        message: device_id ? 'Device downloads revoked' : 'All downloads revoked',
      });
    } catch (error: any) {
      console.error('Revoke error:', error);
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * Admin: Revoke user downloads
   */
  adminRevokeDownloads = async (req: Request, res: Response) => {
    const { user_id, device_id } = req.body;

    try {
      await this.downloadService.revokeDownloads(user_id, device_id);

      res.json({
        success: true,
        message: 'Downloads revoked',
      });
    } catch (error: any) {
      console.error('Admin revoke error:', error);
      res.status(500).json({ message: error.message });
    }
  };
}

