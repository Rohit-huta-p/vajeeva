import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { uploadToCloudinary } from '../lib/cloudinary';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/** Multer: memory storage, 8 MB cap, image/* only. Shared by both routes. */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('NOT_IMAGE'));
    }
  },
});

/**
 * A single-file → Cloudinary POST handler. `getFolder` derives the destination
 * folder per request (admin recipe images vs. per-user prepared-dish photos).
 */
function uploadHandler(getFolder: (req: Request) => string): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run multer as a promise so we can handle its errors cleanly.
    await new Promise<void>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (upload.single('file') as any)(req, res, (err: unknown) => {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File too large (max 8MB)' });
          return resolve();
        }
        if (err instanceof Error && err.message === 'NOT_IMAGE') {
          res.status(400).json({ error: 'Only image files allowed' });
          return resolve();
        }
        if (err) { next(err); return resolve(); }
        resolve();
      });
    });

    // If a response was already sent (error path above), bail out.
    if (res.headersSent) return;

    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      const result = await uploadToCloudinary(req.file.buffer, getFolder(req));
      res.json({ url: result.secure_url, publicId: result.public_id });
    } catch (err) {
      next(err);
    }
  };
}

// Admin — recipe images. Unchanged surface: mounted at /api/admin/uploads.
export const uploadsRouter = Router();
uploadsRouter.use(requireAuth, requireAdmin);
uploadsRouter.post('/', uploadHandler(() => 'vajeeva'));

// Patient — prepared-dish photos, one folder per user. Mounted at /api/uploads.
// EXIF/GPS is stripped client-side by the Phase 2 re-encode (expo-image-manipulator)
// before the bytes ever leave the device, so stored originals are already clean.
export const patientUploadsRouter = Router();
patientUploadsRouter.use(requireAuth);
patientUploadsRouter.post(
  '/',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadHandler((req) => `vajeeva/prepared/${(req as any).user.userId}`),
);
