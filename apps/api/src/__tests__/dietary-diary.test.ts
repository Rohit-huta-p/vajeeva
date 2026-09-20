/**
 * dietary-diary.test.ts — Phase 1 of docs/specs/2026-09-20-dietary-diary.md.
 * Meal slot + localDate on makes, DiaryDay sync, the admin diary assembly
 * (slot bucketing, Day N, adherence join, flag), amend, and deletion purge.
 */
import './env';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { Recipe } from '../models/Recipe';
import { CookLog } from '../models/CookLog';
import { DiaryDay } from '../models/DiaryDay';

jest.mock('cloudinary', () => ({
  v2: { config: jest.fn(), uploader: { upload_stream: jest.fn(), destroy: jest.fn().mockResolvedValue({ result: 'ok' }) } },
}));

const app = createApp();

const RECIPE = {
  slug: 'ragi-dosa', nameEn: 'Ragi dosa', nameTa: '', category: 'solid', description: 'x',
  ingredients: [{ nameEn: 'A', quantityG: '1g', quantityCup: '1 tsp' }],
  steps: [{ order: 1, text: 'do', phase: 'P', heat: null, timerStr: null, stepIngredients: [], illColor: '#111111' }],
  healthFlags: [{ condition: 'diabetes', severity: 'caution' }], sources: [], yieldStr: '1', shelfLife: '1 day', status: 'published',
};

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
let patientToken: string, patientId: string, adminToken: string;

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Recipe.deleteMany({}), CookLog.deleteMany({}), DiaryDay.deleteMany({})]);
  const reg = await request(app).post('/api/auth/register').send({ email: 'diary-patient@test.com', password: 'password123' });
  patientToken = reg.body.accessToken;
  const p = await User.findOne({ email: 'diary-patient@test.com' });
  patientId = p!.id;
  await User.findByIdAndUpdate(patientId, { healthProfile: ['diabetes'] });
  await request(app).post('/api/auth/register').send({ email: 'diary-admin@test.com', password: 'password123' });
  await User.findOneAndUpdate({ email: 'diary-admin@test.com' }, { role: 'admin' });
  const alogin = await request(app).post('/api/auth/login').send({ email: 'diary-admin@test.com', password: 'password123' });
  adminToken = alogin.body.accessToken;
  await Recipe.create(RECIPE);
});

describe('makes carry slot + localDate', () => {
  it('stores and returns them via GET /api/sync/cooked', async () => {
    await request(app).post('/api/sync/cooked').set(auth(patientToken))
      .send({ makes: [{ recipe: 'ragi-dosa', madeAt: '2026-09-16T03:00:00.000Z', slot: 'morning', localDate: '2026-09-16' }] });
    const res = await request(app).get('/api/sync/cooked').set(auth(patientToken));
    expect(res.body[0]).toMatchObject({ slug: 'ragi-dosa', slot: 'morning', localDate: '2026-09-16' });
  });
});

describe('POST + GET /api/sync/diary', () => {
  it('upserts a day (no duplicate) and merges fields', async () => {
    await request(app).post('/api/sync/diary').set(auth(patientToken))
      .send({ days: [{ date: '2026-09-16', adherence: 'partial', remarks: 'ate out for lunch' }] });
    await request(app).post('/api/sync/diary').set(auth(patientToken))
      .send({ days: [{ date: '2026-09-16', adherence: 'followed' }] });
    const res = await request(app).get('/api/sync/diary').set(auth(patientToken));
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ date: '2026-09-16', adherence: 'followed', remarks: 'ate out for lunch' });
  });
});

describe('GET /api/admin/users/:id/diary', () => {
  it('buckets makes into slots with Day N, adherence and flag', async () => {
    await request(app).post('/api/sync/cooked').set(auth(patientToken)).send({ makes: [
      { recipe: 'ragi-dosa', madeAt: '2026-09-16T03:00:00.000Z', slot: 'morning', localDate: '2026-09-16' },
      { recipe: 'ragi-dosa', madeAt: '2026-09-16T13:00:00.000Z', slot: 'afternoon', localDate: '2026-09-16' },
    ] });
    await request(app).post('/api/sync/diary').set(auth(patientToken))
      .send({ days: [{ date: '2026-09-16', adherence: 'partial', remarks: 'lunch out' }] });
    await request(app).patch(`/api/admin/users/${patientId}/program-start`).set(auth(adminToken))
      .send({ programStartAt: '2026-09-14' });

    const res = await request(app).get(`/api/admin/users/${patientId}/diary`).set(auth(adminToken));
    expect(res.status).toBe(200);
    const row = res.body.rows.find((r: { date: string }) => r.date === '2026-09-16');
    expect(row.day).toBe(3);
    expect(row.morning).toHaveLength(1);
    expect(row.afternoon).toHaveLength(1);
    expect(row.night).toHaveLength(0);
    expect(row.morning[0]).toMatchObject({ nameEn: 'Ragi dosa', flagged: true });
    expect(row).toMatchObject({ adherence: 'partial', remarks: 'lunch out', flagged: true });
  });

  it('is admin-only (403 for a patient token)', async () => {
    const res = await request(app).get(`/api/admin/users/${patientId}/diary`).set(auth(patientToken));
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/admin/users/:id/diary/:date', () => {
  it('amends adherence + remarks and flags amendedByAdmin', async () => {
    await request(app).patch(`/api/admin/users/${patientId}/diary/2026-09-16`).set(auth(adminToken))
      .send({ adherence: 'deviated', remarks: 'dietitian note' });
    const day = await DiaryDay.findOne({ userId: patientId, date: '2026-09-16' }).lean();
    expect(day).toMatchObject({ adherence: 'deviated', remarks: 'dietitian note', amendedByAdmin: true });
  });
});

describe('account deletion', () => {
  it('DELETE /api/users/me purges the patient\'s diary days', async () => {
    await request(app).post('/api/sync/diary').set(auth(patientToken))
      .send({ days: [{ date: '2026-09-16', adherence: 'followed' }] });
    const del = await request(app).delete('/api/users/me').set(auth(patientToken));
    expect(del.status).toBe(204);
    expect(await DiaryDay.countDocuments({ userId: patientId })).toBe(0);
  });
});
