/**
 * auth-ext.test.ts — BE-AUTH items 1–3
 *  1. POST /api/auth/register accepts name + phone
 *  2. Public GET /api/healthflags returns enabled flags only
 *  3. PATCH /users/me writes healthProfile
 */
import './env';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { HealthFlagConfig } from '../models/HealthFlagConfig';

const app = createApp();

beforeAll(async () => {
  await User.deleteMany({});
  await HealthFlagConfig.deleteMany({});
});

beforeEach(async () => {
  await User.deleteMany({});
  await HealthFlagConfig.deleteMany({});
});

// ── 1. Register with name + phone ─────────────────────────────────────────────

describe('POST /api/auth/register — extended fields', () => {
  it('accepts name and phone, and they are persisted', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'rohit@test.com', password: 'password123', name: 'Rohit', phone: '+91-9999999999' });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    const user = await User.findOne({ email: 'rohit@test.com' });
    expect(user?.name).toBe('Rohit');
    expect(user?.phone).toBe('+91-9999999999');
  });

  it('registers without name/phone (backward compat)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'anon@test.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
  });

  it('accepts age and gender, and they are persisted', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'agegender@test.com', password: 'password123',
        name: 'Rohit', age: 28, gender: 'male',
      });
    expect(res.status).toBe(201);
    const user = await User.findOne({ email: 'agegender@test.com' });
    expect(user?.age).toBe(28);
    expect(user?.gender).toBe('male');
  });

  it('registers without age/gender (both optional)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'noagegender@test.com', password: 'password123' });
    expect(res.status).toBe(201);
    const user = await User.findOne({ email: 'noagegender@test.com' });
    expect(user?.age).toBeUndefined();
    expect(user?.gender).toBeUndefined();
  });

  it('rejects an out-of-range age with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'toddler@test.com', password: 'password123', age: 5 });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid gender value with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'badgender@test.com', password: 'password123', gender: 'robot' });
    expect(res.status).toBe(400);
  });
});

// ── 2. Public GET /api/healthflags ────────────────────────────────────────────

describe('GET /api/healthflags — public, enabled only', () => {
  it('returns empty array when no flags configured', async () => {
    const res = await request(app).get('/api/healthflags');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns only enabled flags with code+label shape', async () => {
    await HealthFlagConfig.insertMany([
      { code: 'DM', label: 'Diabetes', description: 'Elevated blood sugar', enabled: true },
      { code: 'OW', label: 'Obesity', description: 'High BMI', enabled: false },
      { code: 'LI', label: 'Lactose Intolerant', description: 'Dairy sensitivity', enabled: true },
    ]);
    const res = await request(app).get('/api/healthflags');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // Only enabled flags
    const codes = res.body.map((f: any) => f.code);
    expect(codes).toContain('DM');
    expect(codes).toContain('LI');
    expect(codes).not.toContain('OW');
    // Shape check — now carries description + emoji so the patient grid renders
    // any admin-added condition fully from data.
    expect(res.body[0]).toMatchObject({
      code: expect.any(String),
      label: expect.any(String),
      description: expect.any(String),
    });
    // enabled stays server-side — not leaked to the public grid.
    expect(res.body[0].enabled).toBeUndefined();
  });

  it('requires no auth header', async () => {
    const res = await request(app).get('/api/healthflags');
    expect(res.status).toBe(200);
  });
});

// ── 3. PATCH /users/me ────────────────────────────────────────────────────────

describe('PATCH /users/me — healthProfile + name', () => {
  let userToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'me@test.com', password: 'password123', name: 'Old Name' });
    userToken = reg.body.accessToken;
  });

  it('updates healthProfile and returns updated user without secrets', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ healthProfile: ['DM', 'OW'] });
    expect(res.status).toBe(200);
    expect(res.body.healthProfile).toEqual(['DM', 'OW']);
    expect(res.body.email).toBe('me@test.com');
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.id).toBeDefined();
  });

  it('updates name', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .send({ healthProfile: ['DM'] });
    expect(res.status).toBe(401);
  });
});
