/**
 * Video Upload Middleware - File upload handling for videos
 */

import multer from 'multer';
import { Request } from 'express';
import path from 'path';

// Configure storage
const storage = multer.memoryStorage();

// File filter for videos
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
  }
};

// Configure multer for video uploads (larger size limit)
export const uploadVideo = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB max for videos
  },
});

// Middleware for single video upload
export const uploadSingleVideo = uploadVideo.single('video_file');

// Middleware for thumbnail upload
export const uploadThumbnail = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid thumbnail type. Allowed: ${allowedExtensions.join(', ')}`));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for thumbnails
  },
}).single('thumbnail_file');
