import './env';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { Recipe } from '../models/Recipe';
import { IngredientRule } from '../models/IngredientRule';
import { HealthFlagConfig } from '../models/HealthFlagConfig';

const app = createApp();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt = require('jsonwebtoken');

let adminToken: string;
const auth = () => ({ Authorization: `Bearer ${adminToken}` });
const RECIPE = (over: object) => ({
  category: 'solid', status: 'published', steps: [{ order: 1, text: 'x' }], sources: [], yieldStr: '1', shelfLife: '1d', ...over,
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Recipe.deleteMany({}), IngredientRule.deleteMany({}), HealthFlagConfig.deleteMany({})]);
  const admin = await User.create({ email: 'a@t.com', passwordHash: 'x', role: 'admin' });
  adminToken = jwt.sign({ userId: admin.id, role: 'admin' }, process.env.JWT_SECRET!, { expiresIn: '15m' });
  await HealthFlagConfig.create({ code: 'diabetes', label: 'Diabetes', description: 'd', enabled: true });
});

it('creates a rule, lists ingredients, and derives flags onto recipes (preview then commit)', async () => {
  await Recipe.create(RECIPE({ slug: 'ladoo', nameEn: 'Jaggery Ladoo', ingredients: [{ nameEn: 'Jaggery' }, { nameEn: 'Sesame' }], healthFlags: [] }));

  const post = await request(app).post('/api/admin/diet-rules').set(auth())
    .send({ ingredient: 'Jaggery', match: ['Jaggery'], effects: [{ condition: 'diabetes', severity: 'avoid' }] });
  expect(post.status).toBe(201);
  expect(post.body.match).toEqual(['jaggery']); // normalised to lowercase

  const ing = await request(app).get('/api/admin/diet-rules/ingredients').set(auth());
  expect(ing.body.find((x: { name: string }) => x.name === 'Jaggery')).toBeTruthy();

  // preview writes nothing
  const preview = await request(app).post('/api/admin/diet-rules/apply').set(auth()).send({});
  expect(preview.body).toMatchObject({ committed: false, added: 1, recipesAffected: 1 });
  expect((await Recipe.findOne({ slug: 'ladoo' }).lean())!.healthFlags).toHaveLength(0);

  // commit writes the derived flag
  const applied = await request(app).post('/api/admin/diet-rules/apply').set(auth()).send({ commit: true });
  expect(applied.body).toMatchObject({ committed: true, added: 1 });
  const r = await Recipe.findOne({ slug: 'ladoo' }).lean();
  expect(r!.healthFlags[0]).toMatchObject({ condition: 'diabetes', severity: 'avoid', source: 'rule' });

  // idempotent
  const again = await request(app).post('/api/admin/diet-rules/apply').set(auth()).send({ commit: true });
  expect(again.body).toMatchObject({ added: 0, changed: 0, removed: 0, recipesAffected: 0 });
});

it('preserves a manual override on re-apply', async () => {
  await Recipe.create(RECIPE({
    slug: 'safe-ladoo', nameEn: 'Safe Ladoo', ingredients: [{ nameEn: 'Jaggery' }],
    healthFlags: [{ condition: 'diabetes', severity: 'safe', note: 'substitute', source: 'manual' }],
  }));
  await request(app).post('/api/admin/diet-rules').set(auth())
    .send({ ingredient: 'Jaggery', match: ['jaggery'], effects: [{ condition: 'diabetes', severity: 'avoid' }] });

  const applied = await request(app).post('/api/admin/diet-rules/apply').set(auth()).send({ commit: true });
  expect(applied.body.recipesWithOverrides).toBe(1);
  const diabetes = (await Recipe.findOne({ slug: 'safe-ladoo' }).lean())!.healthFlags.filter((f) => f.condition === 'diabetes');
  expect(diabetes).toHaveLength(1);
  expect(diabetes[0].severity).toBe('safe'); // manual wins
});

it('a new recipe self-classifies from rules on save', async () => {
  await request(app).post('/api/admin/diet-rules').set(auth())
    .send({ ingredient: 'Jaggery', match: ['jaggery'], effects: [{ condition: 'diabetes', severity: 'avoid' }] });
  const payload = {
    slug: 'new-ladoo', nameEn: 'New Ladoo', nameTa: '', category: 'solid', description: '',
    ingredients: [{ nameEn: 'Jaggery', quantityG: '50g', quantityCup: '¼' }],
    steps: [{ order: 1, text: 'Mix', phase: '', heat: null, stepIngredients: [], illColor: '#111111' }],
    healthFlags: [], sources: [], yieldStr: '1', shelfLife: '1d', status: 'draft',
  };
  const res = await request(app).post('/api/admin/recipes').set(auth()).send(payload);
  expect(res.status).toBe(201);
  const r = await Recipe.findOne({ slug: 'new-ladoo' }).lean();
  expect(r!.healthFlags).toContainEqual(expect.objectContaining({ condition: 'diabetes', severity: 'avoid', source: 'rule' }));
});

it('rejects a rule effect with an unknown condition code', async () => {
  const res = await request(app).post('/api/admin/diet-rules').set(auth())
    .send({ ingredient: 'Nuts', match: ['nut'], effects: [{ condition: 'nope', severity: 'avoid' }] });
  expect(res.status).toBe(400);
});

it('403 for non-admin', async () => {
  const reg = await request(app).post('/api/auth/register').send({ email: 'u@t.com', password: 'password123' });
  const res = await request(app).get('/api/admin/diet-rules').set('Authorization', `Bearer ${reg.body.accessToken}`);
  expect(res.status).toBe(403);
});
