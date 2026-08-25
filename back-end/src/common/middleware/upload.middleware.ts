import { diskStorage, Options } from 'multer';
import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';

/** Absolute path to the profile-pictures storage directory */
export const PROFILE_UPLOAD_DIR = join(
  process.cwd(),
  'uploads',
  'profile',
);

/** Ensure the upload directory exists on first use */
export function ensureUploadDir(): void {
  if (!existsSync(PROFILE_UPLOAD_DIR)) {
    mkdirSync(PROFILE_UPLOAD_DIR, { recursive: true });
  }
}

/** Allowed MIME types for profile pictures */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

/**
 * Multer options for the profile-picture upload endpoint.
 *
 * Security properties:
 * - Original filename is NEVER used as a filesystem path
 * - Server generates: <customerId>-<timestamp>-<4-byte random hex>.<ext>
 * - fileFilter rejects anything that is not JPEG / PNG
 * - limits.fileSize enforces 5 MB maximum
 */
export const profileUploadOptions: Options = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      ensureUploadDir();
      cb(null, PROFILE_UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      // Safe generated name — never derived from original filename
      const customerId = String(req.params?.id ?? 'unknown').replace(/[^a-zA-Z0-9_-]/g, '');
      const ts = Date.now();
      const rand = randomBytes(4).toString('hex');
      const ext = extname(file.originalname).toLowerCase();
      // ext is .jpg or .png (validated by fileFilter before we reach here)
      const safeExt = ext === '.jpeg' ? '.jpg' : ext || '.jpg';
      cb(null, `${customerId}-${ts}-${rand}${safeExt}`);
    },
  }),

  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new BadRequestException(
          `Unsupported file type "${file.mimetype}". Allowed: image/jpeg, image/png`,
        ),
      );
    }
    cb(null, true);
  },

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,                   // single file only
  },
};
