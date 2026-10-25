import multer from 'multer';

// Memory storage keeps file buffer in memory for direct streaming to Amazon S3
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB max per image

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error(
        `Invalid file type "${file.mimetype}". Only JPEG, PNG, and WebP fashion photography are supported.`
      );
      err.status = 400;
      cb(err, false);
    }
  }
});
