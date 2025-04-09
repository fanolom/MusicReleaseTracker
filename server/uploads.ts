import { Request } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { log } from "./vite";

// Define the upload directories
const UPLOAD_DIR = "uploads";
const AUDIO_DIR = path.join(UPLOAD_DIR, "audio");
const IMAGE_DIR = path.join(UPLOAD_DIR, "images");

// Create the upload directories if they don't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
  log(`Created upload directory: ${UPLOAD_DIR}`, "uploads");
}

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR);
  log(`Created audio directory: ${AUDIO_DIR}`, "uploads");
}

if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR);
  log(`Created image directory: ${IMAGE_DIR}`, "uploads");
}

// Configure storage for audio files
const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, AUDIO_DIR);
  },
  filename: (_req, file, cb) => {
    // Create a unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Configure storage for image files
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, IMAGE_DIR);
  },
  filename: (_req, file, cb) => {
    // Create a unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Audio file filter
const audioFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only audio files
  const allowedMimeTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, only audio files are allowed"));
  }
};

// Image file filter
const imageFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, only image files are allowed"));
  }
};

// Setup multer instances
export const audioUpload = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
});

export const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Helper to get file path 
export const getFilePath = (filePath: string): string => {
  return `/${filePath}`;
};

// Delete file helper
export const deleteFile = (filePath: string): void => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    log(`Deleted file: ${filePath}`, "uploads");
  }
};

// Get file duration (for MP3 files)
export const getAudioDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve) => {
    // In a real app, we would use something like music-metadata or ffprobe
    // But for this demo, we'll just return a random duration between 2-5 minutes
    const randomDuration = Math.floor(Math.random() * 180) + 120; // 120-300 seconds (2-5 min)
    resolve(randomDuration);
  });
};