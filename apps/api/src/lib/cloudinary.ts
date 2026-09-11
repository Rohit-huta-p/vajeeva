import { v2 as cloudinary } from 'cloudinary';

// Configured from the CLOUDINARY_URL env var automatically when set. If absent,
// real uploads/destroys fail — but the mock-tested endpoints are code-complete.
cloudinary.config();

export { cloudinary };

/** Stream a Buffer into Cloudinary under `folder` and resolve with the result. */
export function uploadToCloudinary(
  buffer: Buffer,
  folder = 'vajeeva',
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('No result from Cloudinary'));
        resolve(result as { secure_url: string; public_id: string });
      },
    );
    stream.end(buffer);
  });
}

/** Permanently delete a stored asset by its public id. */
export function destroyFromCloudinary(publicId: string): Promise<{ result: string }> {
  return cloudinary.uploader.destroy(publicId) as Promise<{ result: string }>;
}
