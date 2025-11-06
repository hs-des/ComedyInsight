/**
 * Download Service - Handle encrypted video downloads
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { apiService } from './api.service';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';

const DOWNLOADS_DIR = FileSystem.documentDirectory + 'downloads/';
const ENCRYPTED_DIR = FileSystem.documentDirectory + 'downloads/encrypted/';

export interface DownloadMetadata {
  id: string;
  video_id: string;
  video_title: string;
  thumbnail_url: string;
  file_path: string;
  encrypted_file_path: string;
  decryption_token: string;
  device_id: string;
  quality: string;
  file_size?: number;
  expiry_date: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'expired' | 'revoked';
  created_at: string;
}

/**
 * Get unique device ID
 */
async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await SecureStore.getItemAsync('device_id');
    if (!deviceId) {
      deviceId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${Device.modelId}-${Device.osInternalBuildId}`,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      await SecureStore.setItemAsync('device_id', deviceId);
    }
    return deviceId;
  } catch (error) {
    return 'device-' + Date.now();
  }
}

class DownloadService {
  private downloads: Map<string, DownloadMetadata> = new Map();

  /**
   * Request download URL and encryption token from server
   */
  async requestDownload(
    videoId: string,
    quality: string = '720p'
  ): Promise<{ presignedUrl: string; decryptionToken: string }> {
    try {
      const deviceId = await getDeviceId();
      
      const response = await fetch('http://localhost:3000/api/downloads/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          video_id: videoId,
          quality,
          device_id: deviceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to request download');
      }

      const data = await response.json();
      return {
        presignedUrl: data.presigned_url,
        decryptionToken: data.decryption_token,
      };
    } catch (error) {
      console.error('Download request error:', error);
      throw error;
    }
  }

  /**
   * Download and save video
   */
  async downloadVideo(
    videoId: string,
    videoTitle: string,
    thumbnailUrl: string,
    quality: string = '720p',
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Ensure directories exist
      await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
      await FileSystem.makeDirectoryAsync(ENCRYPTED_DIR, { intermediates: true });

      // Request download
      const { presignedUrl, decryptionToken } = await this.requestDownload(videoId, quality);
      const deviceId = await getDeviceId();

      // Create metadata
      const downloadId = Date.now().toString();
      const encryptedPath = ENCRYPTED_DIR + `${videoId}_${quality}.enc`;
      const decryptedPath = DOWNLOADS_DIR + `${videoId}_${quality}.mp4`;
      
      const metadata: DownloadMetadata = {
        id: downloadId,
        video_id: videoId,
        video_title: videoTitle,
        thumbnail_url: thumbnailUrl,
        file_path: decryptedPath,
        encrypted_file_path: encryptedPath,
        decryption_token: decryptionToken,
        device_id: deviceId,
        quality,
        progress: 0,
        status: 'downloading',
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      this.downloads.set(videoId, metadata);
      await this.saveDownloadMetadata(metadata);

      // Download file
      const downloadResumable = FileSystem.createDownloadResumable(
        presignedUrl,
        encryptedPath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / (downloadProgress.totalBytesExpectedToWrite || 1);
          metadata.progress = progress;
          onProgress?.(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (!result) {
        throw new Error('Download failed');
      }

      // Note: In production, decrypt file immediately or on first play
      // For now, store encrypted file
      metadata.status = 'completed';
      metadata.file_size = result.uri ? await this.getFileSize(encryptedPath) : 0;
      await this.saveDownloadMetadata(metadata);

      return encryptedPath;
    } catch (error) {
      console.error('Download error:', error);
      const metadata = this.downloads.get(videoId);
      if (metadata) {
        metadata.status = 'failed';
        await this.saveDownloadMetadata(metadata);
      }
      throw error;
    }
  }

  /**
   * Verify download token (check for remote wipe)
   */
  async verifyToken(videoId: string): Promise<boolean> {
    try {
      const metadata = await this.getDownloadMetadata(videoId);
      if (!metadata) return false;

      const deviceId = await getDeviceId();

      const response = await fetch('http://localhost:3000/api/downloads/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          device_id: deviceId,
          token: metadata.decryption_token,
        }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  /**
   * Play downloaded video (with token check)
   */
  async playDownloadedVideo(videoId: string): Promise<string> {
    const metadata = await this.getDownloadMetadata(videoId);
    if (!metadata) {
      throw new Error('Video not downloaded');
    }

    // Check expiry
    if (new Date(metadata.expiry_date) < new Date()) {
      metadata.status = 'expired';
      await this.saveDownloadMetadata(metadata);
      throw new Error('Download expired');
    }

    // Verify token (remote wipe check)
    const isValid = await this.verifyToken(videoId);
    if (!isValid) {
      metadata.status = 'revoked';
      await this.saveDownloadMetadata(metadata);
      await this.deleteDownload(videoId);
      throw new Error('Download revoked');
    }

    // Return file path for playback
    return metadata.file_path;
  }

  /**
   * Get all downloads
   */
  async getAllDownloads(): Promise<DownloadMetadata[]> {
    const keys = await AsyncStorage.getAllKeys();
    const downloadKeys = keys.filter((key) => key.startsWith('download_'));
    
    const downloads = await Promise.all(
      downloadKeys.map(async (key) => {
        const value = await AsyncStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      })
    );

    return downloads.filter((d) => d !== null);
  }

  /**
   * Delete download
   */
  async deleteDownload(videoId: string): Promise<void> {
    const metadata = await this.getDownloadMetadata(videoId);
    if (!metadata) return;

    try {
      await FileSystem.deleteAsync(metadata.encrypted_file_path, { idempotent: true });
      await FileSystem.deleteAsync(metadata.file_path, { idempotent: true });
      await AsyncStorage.removeItem(`download_${videoId}`);
      this.downloads.delete(videoId);
    } catch (error) {
      console.error('Delete download error:', error);
    }
  }

  /**
   * Get file size
   */
  private async getFileSize(filePath: string): Promise<number> {
    try {
      const info = await FileSystem.getInfoAsync(filePath);
      return info.exists ? (info.size || 0) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get download metadata
   */
  async getDownloadMetadata(videoId: string): Promise<DownloadMetadata | null> {
    const stored = await AsyncStorage.getItem(`download_${videoId}`);
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Save download metadata
   */
  private async saveDownloadMetadata(metadata: DownloadMetadata): Promise<void> {
    await AsyncStorage.setItem(`download_${metadata.video_id}`, JSON.stringify(metadata));
  }
}

export const downloadService = new DownloadService();
