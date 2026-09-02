import './env';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { TagConfig } from '../models/TagConfig';

const app = createApp();

let adminToken: string;

beforeAll(async () => {
  await User.deleteMany({});
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin-tags@test.com', password: 'password123' });
  await User.findByIdAndUpdate(reg.body.userId ?? (await User.findOne())!._id, { role: 'admin' });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-tags@test.com', password: 'password123' });
  adminToken = login.body.accessToken;
});

beforeEach(async () => { await TagConfig.deleteMany({}); });

describe('Discovery tags — admin CRUD', () => {
  it('GET /api/admin/tags returns all facets empty when nothing is configured', async () => {
    const res = await request(app)
      .get('/api/admin/tags')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ type: [], meal: [], ingredient: [], method: [], diet: [], filter: [] });
  });

  it('PUT bulk-saves grouped tags and GET returns them', async () => {
    const put = await request(app)
      .put('/api/admin/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: [{ code: 'laddu', label: 'Laddu', order: 1, enabled: true }],
        ingredient: [
          { code: 'coconut', label: 'Coconut', order: 1, enabled: true },
          { code: 'jaggery', label: 'Jaggery', order: 2, enabled: false },
        ],
        diet: [{ code: 'sweet', label: 'Sweet', order: 1, enabled: true }],
      });
    expect(put.status).toBe(200);
    expect(put.body.type).toEqual([{ code: 'laddu', label: 'Laddu', order: 1, enabled: true }]);
    expect(put.body.ingredient).toHaveLength(2);

    const get = await request(app)
      .get('/api/admin/tags')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(get.body.ingredient.map((t: any) => t.code)).toEqual(['coconut', 'jaggery']);
    expect(get.body.diet[0]).toMatchObject({ code: 'sweet', label: 'Sweet' });
  });

  it('round-trips the filter facet with its group', async () => {
    await request(app)
      .put('/api/admin/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        filter: [
          { code: 'quick', label: 'Quick', order: 1, enabled: true, group: 'effort' },
          { code: 'sweet', label: 'Sweet', order: 2, enabled: true, group: 'taste' },
        ],
      });
    const admin = await request(app).get('/api/admin/tags').set('Authorization', `Bearer ${adminToken}`);
    expect(admin.body.filter).toEqual([
      { code: 'quick', label: 'Quick', order: 1, enabled: true, group: 'effort' },
      { code: 'sweet', label: 'Sweet', order: 2, enabled: true, group: 'taste' },
    ]);
    // Public feed carries {code,label,group} for filter items.
    const pub = await request(app).get('/api/tags');
    expect(pub.body.filter).toEqual([
      { code: 'quick', label: 'Quick', group: 'effort' },
      { code: 'sweet', label: 'Sweet', group: 'taste' },
    ]);
  });

  it('PUT replaces the whole vocabulary', async () => {
    await request(app).put('/api/admin/tags').set('Authorization', `Bearer ${adminToken}`)
      .send({ type: [{ code: 'laddu', label: 'Laddu' }] });
    await request(app).put('/api/admin/tags').set('Authorization', `Bearer ${adminToken}`)
      .send({ type: [{ code: 'roti', label: 'Roti' }] });
    const get = await request(app).get('/api/admin/tags').set('Authorization', `Bearer ${adminToken}`);
    expect(get.body.type.map((t: any) => t.code)).toEqual(['roti']);
  });

  it('rejects a tag missing code/label with 400', async () => {
    const res = await request(app)
      .put('/api/admin/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ meal: [{ label: 'Breakfast' }] }); // no code
    expect(res.status).toBe(400);
  });

  it('rejects duplicate codes within a facet with 400', async () => {
    const res = await request(app)
      .put('/api/admin/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ method: [{ code: 'fried', label: 'Fried' }, { code: 'fried', label: 'Deep fried' }] });
    expect(res.status).toBe(400);
  });

  it('requires auth (401 without a token)', async () => {
    const res = await request(app).get('/api/admin/tags');
    expect(res.status).toBe(401);
  });
});

describe('Discovery tags — public feed', () => {
  it('GET /api/tags returns only enabled values as {code,label}, ordered', async () => {
    await request(app)
      .put('/api/admin/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ingredient: [
          { code: 'coconut', label: 'Coconut', order: 2, enabled: true },
          { code: 'amla', label: 'Amla', order: 1, enabled: true },
          { code: 'hidden', label: 'Hidden', order: 3, enabled: false },
        ],
      });

    const res = await request(app).get('/api/tags'); // no auth — public
    expect(res.status).toBe(200);
    // enabled only, ordered by `order`, shape is {code,label}
    expect(res.body.ingredient).toEqual([
      { code: 'amla', label: 'Amla' },
      { code: 'coconut', label: 'Coconut' },
    ]);
    expect(res.body.type).toEqual([]);
  });
});
