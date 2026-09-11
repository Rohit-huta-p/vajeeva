import './env';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { Recipe } from '../models/Recipe';
import { SavedRecipe } from '../models/SavedRecipe';
import { CookLog } from '../models/CookLog';
import { HealthFlagConfig } from '../models/HealthFlagConfig';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload_stream: jest.fn(), destroy: jest.fn().mockResolvedValue({ result: 'ok' }) },
  },
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockDestroy = require('cloudinary').v2.uploader.destroy as jest.Mock;

const app = createApp();

let adminToken: string;

beforeAll(async () => {
  await User.deleteMany({});
  // Create admin user
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin-ua@test.com', password: 'password123' });
  await User.findByIdAndUpdate(reg.body.userId ?? (await User.findOne())!._id, { role: 'admin' });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-ua@test.com', password: 'password123' });
  adminToken = login.body.accessToken;

  // Create a regular user
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'regular@test.com', password: 'password123' });
});

describe('Admin Users', () => {
  it('GET /api/admin/users returns list of users with correct shape', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2); // admin + regular

    const u = res.body[0];
    expect(u).toHaveProperty('id');
    expect(u).toHaveProperty('email');
    expect(u).toHaveProperty('role');
    expect(u).toHaveProperty('authProviders');
    expect(u).toHaveProperty('joinedAt');
    expect(u).not.toHaveProperty('passwordHash');
  });

  it('GET /api/admin/users returns 401 for unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/users returns 403 for non-admin', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'regular@test.com', password: 'password123' });
    const userToken = loginRes.body.accessToken;
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/users/:id — per-patient view', () => {
  it('returns engagement, adherence flags, and satisfaction', async () => {
    const patient = await User.create({
      email: 'patient@test.com', passwordHash: 'x', healthProfile: ['diabetes'], lastSyncAt: new Date(),
    });
    await HealthFlagConfig.updateOne(
      { code: 'diabetes' },
      { $set: { label: 'Diabetes', description: 'd', enabled: true } },
      { upsert: true },
    );
    const recipe = await Recipe.create({
      slug: 'sweet-thing', nameEn: 'Sweet Thing', category: 'solid', status: 'published',
      healthFlags: [{ condition: 'diabetes', severity: 'caution' }],
    });
    await SavedRecipe.create({ userId: patient.id, recipeId: recipe.id });
    await CookLog.create({ userId: patient.id, recipeId: recipe.id, rating: 4 });

    const res = await request(app)
      .get(`/api/admin/users/${patient.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.conditions).toEqual([{ code: 'diabetes', label: 'Diabetes' }]);
    expect(res.body.engagement).toMatchObject({ saves: 1, makes: 1 });
    expect(res.body.satisfaction.avgRating).toBe(4);
    expect(res.body.adherence.flags).toHaveLength(1);
    expect(res.body.adherence.flags[0]).toMatchObject({
      nameEn: 'Sweet Thing', condition: 'diabetes', conditionLabel: 'Diabetes',
      severity: 'caution', saved: true, made: true,
    });
  });

  it('404 for a non-existent user', async () => {
    const res = await request(app)
      .get('/api/admin/users/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe('per-patient prepared-dish photos', () => {
  async function makePatientWithPhoto() {
    const patient = await User.create({
      email: `pp-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
      passwordHash: 'x', healthProfile: ['diabetes'],
    });
    await HealthFlagConfig.updateOne(
      { code: 'diabetes' }, { $set: { label: 'Diabetes', enabled: true } }, { upsert: true },
    );
    const recipe = await Recipe.create({
      slug: `flagged-${Math.random().toString(36).slice(2)}`, nameEn: 'Flagged Dish',
      category: 'solid', status: 'published',
      healthFlags: [{ condition: 'diabetes', severity: 'caution' }],
    });
    const photo = { url: 'https://cdn/x.jpg', publicId: `vajeeva/prepared/${patient.id}/x` };
    await CookLog.create({ userId: patient.id, recipeId: recipe.id, rating: 5, photos: [photo] });
    return { patient, photo };
  }

  it('GET /:id surfaces photos on recentMakes and a flagged photoMakes gallery', async () => {
    const { patient, photo } = await makePatientWithPhoto();
    const res = await request(app)
      .get(`/api/admin/users/${patient.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.engagement.recentMakes[0].photos[0]).toMatchObject({ publicId: photo.publicId });
    expect(res.body.engagement.photoMakes).toHaveLength(1);
    expect(res.body.engagement.photoMakes[0]).toMatchObject({ flagged: true, nameEn: 'Flagged Dish' });
    expect(res.body.engagement.photoMakes[0].photos[0].url).toBe(photo.url);
  });

  it('DELETE /:id/photo removes the photo and destroys the asset', async () => {
    mockDestroy.mockClear();
    const { patient, photo } = await makePatientWithPhoto();
    const del = await request(app)
      .delete(`/api/admin/users/${patient.id}/photo`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ publicId: photo.publicId });
    expect(del.status).toBe(200);
    expect(mockDestroy).toHaveBeenCalledWith(photo.publicId);
    const res = await request(app)
      .get(`/api/admin/users/${patient.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.engagement.photoMakes).toHaveLength(0);
  });

  it('DELETE /:id/photo 404s for a publicId not on the patient', async () => {
    const { patient } = await makePatientWithPhoto();
    const del = await request(app)
      .delete(`/api/admin/users/${patient.id}/photo`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ publicId: 'vajeeva/prepared/none/none' });
    expect(del.status).toBe(404);
  });

  it('DELETE /:id/photo is admin-only (403 for a regular user)', async () => {
    const { patient, photo } = await makePatientWithPhoto();
    const login = await request(app).post('/api/auth/login').send({ email: 'regular@test.com', password: 'password123' });
    const del = await request(app)
      .delete(`/api/admin/users/${patient.id}/photo`)
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ publicId: photo.publicId });
    expect(del.status).toBe(403);
  });
});
