import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

// Cloudinary is configured from CLOUDINARY_URL env var automatically when set.
// If absent, real uploads will fail — but mock-tested endpoint is code-complete.
cloudinary.config();

export const uploadsRouter = Router();
uploadsRouter.use(requireAuth, requireAdmin);

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/** Multer: memory storage, 8 MB cap, image/* only. */
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

/** Stream a Buffer into cloudinary and resolve with the result. */
function uploadToCloudinary(
  buffer: Buffer,
  mimetype: string
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'vajeeva', resource_type: 'image' },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('No result from Cloudinary'));
        resolve(result as { secure_url: string; public_id: string });
      }
    );
    stream.end(buffer);
  });
}

uploadsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
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

  // If response already sent (error path above), bail out.
  if (res.headersSent) return;

  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    next(err);
  }
});
