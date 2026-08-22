/**
 * uploads.test.ts — BE-IMAGES item 5
 * Tests POST /api/admin/uploads with Cloudinary mocked.
 * Real uploads require CLOUDINARY_URL in .env (not yet provided).
 */
import './env';
import request from 'supertest';
import path from 'path';
import { createApp } from '../app';
import { User } from '../models/User';

// ── Mock cloudinary BEFORE importing app (so the module is replaced) ──────────
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((_opts: unknown, cb: (err: Error | null, result: unknown) => void) => {
        // Return a writable-like object; call cb with mock result
        const stream = {
          end: (buf: Buffer) => {
            cb(null, {
              secure_url: 'https://res.cloudinary.com/demo/image/upload/vajeeva/mock123.jpg',
              public_id: 'vajeeva/mock123',
            });
            return stream;
          },
          on: () => stream,
          write: (chunk: Buffer) => { stream.end(chunk); return true; },
        };
        return stream;
      }),
    },
  },
}));

const app = createApp();
let adminToken: string;

beforeAll(async () => {
  await User.deleteMany({});
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin-upload@test.com', password: 'password123' });
  await User.findByIdAndUpdate(
    reg.body.userId ?? (await User.findOne())!._id,
    { role: 'admin' }
  );
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-upload@test.com', password: 'password123' });
  adminToken = login.body.accessToken;
});

describe('POST /api/admin/uploads', () => {
  it('returns { url, publicId } on valid image upload', async () => {
    const res = await request(app)
      .post('/api/admin/uploads')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from('fake-image-data'), {
        filename: 'test.jpg',
        contentType: 'image/jpeg',
      });
    expect(res.status).toBe(200);
    expect(res.body.url).toContain('cloudinary.com');
    expect(res.body.publicId).toBeDefined();
  });

  it('returns 400 when no file is attached', async () => {
    const res = await request(app)
      .post('/api/admin/uploads')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no file/i);
  });

  it('returns 400 when file is not an image', async () => {
    const res = await request(app)
      .post('/api/admin/uploads')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from('not an image'), {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/image/i);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/admin/uploads')
      .attach('file', Buffer.from('fake'), {
        filename: 'test.jpg',
        contentType: 'image/jpeg',
      });
    expect(res.status).toBe(401);
  });
});
