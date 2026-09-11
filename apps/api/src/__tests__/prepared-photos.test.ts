/**
 * prepared-photos.test.ts — Phase 1 of docs/specs/2026-09-09-prepared-photos.md.
 * Patient photo upload, photos attached to a CookLog make (upsert), the 5-photo
 * cap, and owner-scoped delete. Cloudinary is mocked.
 */
import './env';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { Recipe } from '../models/Recipe';
import { CookLog } from '../models/CookLog';

// ── Mock cloudinary BEFORE importing app (so the module is replaced) ──────────
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((_opts: unknown, cb: (err: Error | null, result: unknown) => void) => {
        const stream = {
          end: (_buf: Buffer) => {
            cb(null, {
              secure_url: 'https://res.cloudinary.com/demo/image/upload/vajeeva/prepared/u/dish.jpg',
              public_id: 'vajeeva/prepared/u/dish',
            });
            return stream;
          },
          on: () => stream,
        };
        return stream;
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockDestroy = require('cloudinary').v2.uploader.destroy as jest.Mock;

const app = createApp();

const RECIPE = {
  slug: 'photo-recipe', nameEn: 'Photo Recipe', nameTa: '', category: 'solid',
  description: 'Test', ingredients: [{ nameEn: 'A', quantityG: '1g', quantityCup: '1 tsp' }],
  steps: [{ order: 1, text: 'Do it', phase: 'P', heat: null, timerStr: null, stepIngredients: [], illColor: '#111111' }],
  healthFlags: [], sources: [], yieldStr: '1', shelfLife: '1 day', status: 'published',
};

const MADE_AT = '2026-09-09T10:00:00.000Z';
const photo = (id: string) => ({ url: `https://cdn/${id}.jpg`, publicId: `vajeeva/prepared/u/${id}` });

let token: string;

beforeEach(async () => {
  await Recipe.deleteMany({});
  await User.deleteMany({});
  await CookLog.deleteMany({});
  mockDestroy.mockClear();
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'photo@test.com', password: 'password123' });
  token = res.body.accessToken;
  await Recipe.create(RECIPE);
});

describe('POST /api/uploads (patient)', () => {
  it('returns { url, publicId } for a signed-in patient', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('fake-image-data'), { filename: 'dish.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(200);
    expect(res.body.url).toContain('cloudinary.com');
    expect(res.body.publicId).toBeDefined();
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .attach('file', Buffer.from('fake'), { filename: 'dish.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(401);
  });

  it('a non-admin patient still cannot hit /api/admin/uploads', async () => {
    const res = await request(app)
      .post('/api/admin/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('fake'), { filename: 'dish.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(403);
  });
});

describe('photos on a make', () => {
  it('persists photos sent with a make and returns them from GET /cooked', async () => {
    await request(app).post('/api/sync/cooked').set('Authorization', `Bearer ${token}`)
      .send({ makes: [{ recipe: 'photo-recipe', madeAt: MADE_AT, rating: 5, photos: [photo('a'), photo('b')] }] });

    const res = await request(app).get('/api/sync/cooked').set('Authorization', `Bearer ${token}`);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ slug: 'photo-recipe', rating: 5 });
    expect(res.body[0].photos).toHaveLength(2);
    expect(res.body[0].photos[0]).toMatchObject({ url: 'https://cdn/a.jpg', publicId: 'vajeeva/prepared/u/a' });
  });

  it('attaching photos to an existing make updates it, not duplicates it', async () => {
    // 1) the make lands first, no photos
    await request(app).post('/api/sync/cooked').set('Authorization', `Bearer ${token}`)
      .send({ makes: [{ recipe: 'photo-recipe', madeAt: MADE_AT, rating: 4 }] });
    // 2) later, the same make is re-sent WITH photos (and no rating field)
    await request(app).post('/api/sync/cooked').set('Authorization', `Bearer ${token}`)
      .send({ makes: [{ recipe: 'photo-recipe', madeAt: MADE_AT, photos: [photo('a')] }] });

    const res = await request(app).get('/api/sync/cooked').set('Authorization', `Bearer ${token}`);
    expect(res.body).toHaveLength(1);           // upsert, not a second row
    expect(res.body[0].rating).toBe(4);         // rating preserved by merge semantics
    expect(res.body[0].photos).toHaveLength(1);
  });

  it('caps photos at 5 per make', async () => {
    const many = Array.from({ length: 8 }, (_, i) => photo(`p${i}`));
    await request(app).post('/api/sync/cooked').set('Authorization', `Bearer ${token}`)
      .send({ makes: [{ recipe: 'photo-recipe', madeAt: MADE_AT, photos: many }] });

    const res = await request(app).get('/api/sync/cooked').set('Authorization', `Bearer ${token}`);
    expect(res.body[0].photos).toHaveLength(5);
  });

  it('drops malformed photos (missing url or publicId)', async () => {
    await request(app).post('/api/sync/cooked').set('Authorization', `Bearer ${token}`)
      .send({ makes: [{ recipe: 'photo-recipe', madeAt: MADE_AT, photos: [photo('a'), { url: 'https://cdn/x.jpg' }, { publicId: 'y' }] }] });

    const res = await request(app).get('/api/sync/cooked').set('Authorization', `Bearer ${token}`);
    expect(res.body[0].photos).toHaveLength(1);
  });
});

describe('DELETE /api/sync/cooked/photo', () => {
  beforeEach(async () => {
    await request(app).post('/api/sync/cooked').set('Authorization', `Bearer ${token}`)
      .send({ makes: [{ recipe: 'photo-recipe', madeAt: MADE_AT, photos: [photo('a'), photo('b')] }] });
  });

  it('removes the photo from the make and destroys the Cloudinary asset', async () => {
    const del = await request(app).delete('/api/sync/cooked/photo').set('Authorization', `Bearer ${token}`)
      .send({ recipe: 'photo-recipe', madeAt: MADE_AT, publicId: 'vajeeva/prepared/u/a' });
    expect(del.status).toBe(200);
    expect(mockDestroy).toHaveBeenCalledWith('vajeeva/prepared/u/a');

    const res = await request(app).get('/api/sync/cooked').set('Authorization', `Bearer ${token}`);
    expect(res.body[0].photos).toHaveLength(1);
    expect(res.body[0].photos[0].publicId).toBe('vajeeva/prepared/u/b');
  });

  it('404s (and destroys nothing) for a publicId not on the make', async () => {
    const del = await request(app).delete('/api/sync/cooked/photo').set('Authorization', `Bearer ${token}`)
      .send({ recipe: 'photo-recipe', madeAt: MADE_AT, publicId: 'vajeeva/prepared/u/nope' });
    expect(del.status).toBe(404);
    expect(mockDestroy).not.toHaveBeenCalled();
  });

  it('returns 401 without a token', async () => {
    const del = await request(app).delete('/api/sync/cooked/photo')
      .send({ recipe: 'photo-recipe', madeAt: MADE_AT, publicId: 'vajeeva/prepared/u/a' });
    expect(del.status).toBe(401);
  });
});

describe('account deletion purges prepared photos', () => {
  it('DELETE /api/users/me destroys the patient\'s Cloudinary assets', async () => {
    await request(app).post('/api/sync/cooked').set('Authorization', `Bearer ${token}`)
      .send({ makes: [{ recipe: 'photo-recipe', madeAt: MADE_AT, photos: [photo('a'), photo('b')] }] });

    const del = await request(app).delete('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);
    expect(mockDestroy).toHaveBeenCalledWith('vajeeva/prepared/u/a');
    expect(mockDestroy).toHaveBeenCalledWith('vajeeva/prepared/u/b');
  });
});
