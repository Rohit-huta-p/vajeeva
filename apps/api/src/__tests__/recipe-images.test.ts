/**
 * recipe-images.test.ts — BE-IMAGES items 1-4
 * Verifies that recipe images[] and steps[].images[] are:
 *  - accepted + persisted via admin POST/PUT
 *  - surfaced in public GET /api/recipes and /:slug
 */
import './env';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { Recipe } from '../models/Recipe';

const app = createApp();

let adminToken: string;

// Minimal valid recipe body for POST (passes RecipeInputSchema)
const BASE_RECIPE = {
  slug: 'test-img-recipe',
  nameEn: 'Image Test Recipe',
  nameTa: '',
  category: 'solid',
  description: 'Test',
  ingredients: [{ nameEn: 'Coconut', quantityG: '50g', quantityCup: '¼ cup' }],
  steps: [
    {
      order: 1, text: 'Mix.', phase: 'Prep',
      heat: null, timerStr: null, stepIngredients: [], illColor: '#E8F4E8',
    },
  ],
  healthFlags: [],
  sources: [],
  yieldStr: '2 servings',
  shelfLife: '1 day',
  status: 'published',
};

beforeAll(async () => {
  await User.deleteMany({});
  await Recipe.deleteMany({});
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin-img@test.com', password: 'password123' });
  await User.findByIdAndUpdate(
    reg.body.userId ?? (await User.findOne())!._id,
    { role: 'admin' }
  );
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-img@test.com', password: 'password123' });
  adminToken = login.body.accessToken;
});

beforeEach(async () => { await Recipe.deleteMany({}); });

describe('Recipe images — admin POST + public GET', () => {
  it('POST /api/admin/recipes persists images[] and steps[].images[]', async () => {
    const body = {
      ...BASE_RECIPE,
      images: [
        { url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', alt: 'Hero shot', order: 0 },
      ],
      steps: [
        {
          ...BASE_RECIPE.steps[0],
          images: [
            { url: 'https://res.cloudinary.com/demo/image/upload/step1.jpg', order: 0 },
          ],
        },
      ],
    };
    const res = await request(app)
      .post('/api/admin/recipes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body);
    expect(res.status).toBe(201);
    expect(res.body.images).toHaveLength(1);
    expect(res.body.images[0]).toMatchObject({
      url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      alt: 'Hero shot',
      order: 0,
    });
    expect(res.body.steps[0].images).toHaveLength(1);
    expect(res.body.steps[0].images[0].url).toContain('step1.jpg');
  });

  it('POST without images is backward compat (images defaults to [])', async () => {
    const res = await request(app)
      .post('/api/admin/recipes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(BASE_RECIPE);
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.images)).toBe(true);
    expect(res.body.images).toHaveLength(0);
  });

  it('PUT /api/admin/recipes/:id updates images[]', async () => {
    const create = await request(app)
      .post('/api/admin/recipes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(BASE_RECIPE);
    const id = create.body._id;
    const updated = await request(app)
      .put(`/api/admin/recipes/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...BASE_RECIPE,
        images: [{ url: 'https://res.cloudinary.com/demo/image/upload/updated.jpg', order: 0 }],
      });
    expect(updated.status).toBe(200);
    expect(updated.body.images[0].url).toContain('updated.jpg');
  });

  it('GET /api/recipes surfaces images[] in public list', async () => {
    await Recipe.create({
      ...BASE_RECIPE,
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/pub.jpg', order: 0 }],
    });
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(res.body[0].images).toHaveLength(1);
    expect(res.body[0].images[0].url).toContain('pub.jpg');
  });

  it('GET /api/recipes/:slug surfaces images[] and steps[].images', async () => {
    await Recipe.create({
      ...BASE_RECIPE,
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/slug.jpg', order: 0 }],
      steps: [{
        ...BASE_RECIPE.steps[0],
        images: [{ url: 'https://res.cloudinary.com/demo/image/upload/stepslug.jpg', order: 0 }],
      }],
    });
    const res = await request(app).get(`/api/recipes/${BASE_RECIPE.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.images[0].url).toContain('slug.jpg');
    expect(res.body.steps[0].images[0].url).toContain('stepslug.jpg');
  });
});
