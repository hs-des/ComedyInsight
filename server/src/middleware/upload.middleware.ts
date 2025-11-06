/**
 * Upload Middleware - File upload handling
 */

import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// Configure storage
const storage = multer.memoryStorage();

// File filter for subtitles
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.srt', '.vtt'];

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Middleware for subtitle uploads
export const uploadSubtitle = upload.single('subtitle_file');

