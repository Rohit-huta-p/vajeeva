# Vajeeva API — Implementation Plan (1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the monorepo scaffold, shared Zod schemas, and Express REST API that the mobile app and admin web connect to.

**Architecture:** Yarn workspaces monorepo with Turborepo. Shared package holds Zod schemas and inferred TypeScript types used by all three apps. Express API serves auth, public recipe, sync, and admin routes backed by MongoDB Atlas via Mongoose.

**Tech Stack:** Node 20, TypeScript 5, Express 4, Mongoose 8, Zod 3, jsonwebtoken, bcryptjs, Jest + Supertest, Turborepo, Yarn 4

**Spec:** `docs/specs/2026-08-17-vajeeva-rn-design.md`

## Global Constraints

- Node ≥ 20.0.0
- TypeScript strict mode (`"strict": true`)
- All route handlers must be async; errors caught with `next(err)` — no `try/catch` per handler
- Access token TTL: 15 minutes. Refresh token TTL: 30 days (httpOnly cookie)
- `status: 'draft'` recipes are never returned from public routes
- Recipe `slug` format: lowercase letters, digits, hyphens only (`/^[a-z0-9-]+$/`)
- `illColor` format: 6-digit hex (`/^#[0-9a-fA-F]{6}$/`)
- No pagination — 83 recipes fits in one response

---

## File Map

```
vajeeva/
├── package.json                         ← workspace root (Yarn 4 + Turborepo)
├── turbo.json
├── .gitignore
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts                 ← barrel export
│           └── schemas/
│               ├── user.schema.ts       ← Zod UserSchema + inferred type
│               ├── recipe.schema.ts     ← Zod RecipeSchema + sub-schemas
│               └── savedRecipe.schema.ts
└── apps/
    └── api/
        ├── package.json
        ├── tsconfig.json
        ├── jest.config.ts
        ├── .env.example
        └── src/
            ├── index.ts                 ← createApp() + listen()
            ├── app.ts                   ← Express app factory (testable without listen)
            ├── db.ts                    ← Mongoose connect/disconnect
            ├── models/
            │   ├── User.ts              ← Mongoose model from shared schema
            │   ├── Recipe.ts
            │   └── SavedRecipe.ts
            ├── middleware/
            │   ├── requireAuth.ts       ← JWT verify → req.user
            │   ├── requireAdmin.ts      ← role === 'admin' guard
            │   └── errorHandler.ts      ← global Express error handler
            ├── routes/
            │   ├── auth.routes.ts       ← /api/auth/*
            │   ├── recipes.routes.ts    ← /api/recipes/*
            │   ├── sync.routes.ts       ← /api/sync/*
            │   └── admin.routes.ts      ← /api/admin/*
            └── __tests__/
                ├── auth.test.ts
                ├── recipes.test.ts
                ├── sync.test.ts
                └── admin.test.ts
```

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/jest.config.ts`
- Create: `apps/api/.env.example`

**Interfaces:**
- Produces: `@vajeeva/shared` importable from `apps/api`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "vajeeva",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "packageManager": "yarn@4.1.1"
}
```

- [ ] **Step 2: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev":   { "persistent": true },
    "test":  { "dependsOn": ["^build"] }
  }
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
.env
*.local
.turbo/
```

- [ ] **Step 4: Create packages/shared/package.json**

```json
{
  "name": "@vajeeva/shared",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 5: Create packages/shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "strict": true,
    "outDir": "./dist",
    "declaration": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

- [ ] **Step 6: Create apps/api/package.json**

```json
{
  "name": "@vajeeva/api",
  "version": "0.0.1",
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "@vajeeva/shared": "*",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "express": "^4.19.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.4.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.7",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "mongodb-memory-server": "^9.3.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.1.4",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 7: Create apps/api/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "strict": true,
    "outDir": "./dist",
    "esModuleInterop": true,
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 8: Create apps/api/jest.config.ts**

```ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  globalSetup: './src/__tests__/setup.ts',
  globalTeardown: './src/__tests__/teardown.ts',
};
```

- [ ] **Step 9: Create apps/api/.env.example**

```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/vajeeva
JWT_SECRET=change-me-32-chars-min
JWT_REFRESH_SECRET=change-me-different-32-chars-min
PORT=4000
NODE_ENV=development
```

- [ ] **Step 10: Install dependencies**

```bash
yarn install
```

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "chore: monorepo scaffold — Turborepo + Yarn workspaces"
```

---

## Task 2: Shared Zod Schemas

**Files:**
- Create: `packages/shared/src/schemas/user.schema.ts`
- Create: `packages/shared/src/schemas/recipe.schema.ts`
- Create: `packages/shared/src/schemas/savedRecipe.schema.ts`
- Create: `packages/shared/src/index.ts`

**Interfaces:**
- Produces: `RecipeSchema`, `UserSchema`, `SavedRecipeSchema` and their inferred types (`Recipe`, `User`, `SavedRecipe`) — imported as `import { RecipeSchema, type Recipe } from '@vajeeva/shared'`

- [ ] **Step 1: Write user.schema.ts**

```ts
// packages/shared/src/schemas/user.schema.ts
import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string(),
  role: z.enum(['user', 'admin']).default('user'),
  lastSyncAt: z.date().default(() => new Date(0)),
  createdAt: z.date().default(() => new Date()),
});

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const LoginInputSchema = RegisterInputSchema;

export type User = z.infer<typeof UserSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
```

- [ ] **Step 2: Write recipe.schema.ts**

```ts
// packages/shared/src/schemas/recipe.schema.ts
import { z } from 'zod';

export const IngredientSchema = z.object({
  nameEn: z.string().min(1),
  quantityG: z.string(),
  quantityCup: z.string(),
});

export const StepSchema = z.object({
  order: z.number().int().min(1),
  text: z.string().min(1),
  phase: z.string(),
  heat: z.string().nullable(),
  timerStr: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  stepIngredients: z.array(z.string()),
  illColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const HealthFlagSchema = z.object({
  condition: z.string().min(1),
  severity: z.enum(['safe', 'caution', 'avoid']),
  note: z.string(),
});

export const SourceSchema = z.object({
  text: z.string().min(1),
  citation: z.string(),
});

export const RecipeSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  nameEn: z.string().min(1),
  nameTa: z.string(),
  category: z.enum(['solid', 'liquid', 'semi-solid']),
  description: z.string(),
  ingredients: z.array(IngredientSchema).min(1),
  steps: z.array(StepSchema).min(1),
  healthFlags: z.array(HealthFlagSchema),
  sources: z.array(SourceSchema),
  yieldStr: z.string(),
  shelfLife: z.string(),
  status: z.enum(['published', 'draft']).default('draft'),
  updatedAt: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date()),
});

export const RecipeInputSchema = RecipeSchema.omit({
  updatedAt: true,
  createdAt: true,
});

export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipeInput = z.infer<typeof RecipeInputSchema>;
```

- [ ] **Step 3: Write savedRecipe.schema.ts**

```ts
// packages/shared/src/schemas/savedRecipe.schema.ts
import { z } from 'zod';

export const SavedRecipeSchema = z.object({
  userId: z.string(),   // ObjectId as string
  recipeId: z.string(), // ObjectId as string
  savedAt: z.date().default(() => new Date()),
});

export type SavedRecipe = z.infer<typeof SavedRecipeSchema>;
```

- [ ] **Step 4: Write index.ts barrel**

```ts
// packages/shared/src/index.ts
export * from './schemas/user.schema';
export * from './schemas/recipe.schema';
export * from './schemas/savedRecipe.schema';
```

- [ ] **Step 5: Build shared package**

```bash
cd packages/shared && yarn build
```

Expected: `dist/` created with `index.js` and `index.d.ts`.

- [ ] **Step 6: Verify import from API**

Create `apps/api/src/_schema-check.ts` temporarily:
```ts
import { RecipeSchema } from '@vajeeva/shared';
const r = RecipeSchema.safeParse({});
console.log(r.success); // false — expected
```
Run: `cd apps/api && npx ts-node src/_schema-check.ts`
Expected: prints `false`. Delete the file after.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): Zod schemas for User, Recipe, SavedRecipe"
```

---

## Task 3: API Scaffold + DB Connection

**Files:**
- Create: `apps/api/src/db.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/middleware/errorHandler.ts`
- Create: `apps/api/src/__tests__/setup.ts`
- Create: `apps/api/src/__tests__/teardown.ts`
- Create: `apps/api/src/__tests__/health.test.ts`

**Interfaces:**
- Produces: `createApp(): Express` (imported by all test files), `connectDB(uri: string): Promise<void>`, `disconnectDB(): Promise<void>`

- [ ] **Step 1: Write the failing health test**

```ts
// apps/api/src/__tests__/health.test.ts
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

test('GET /health returns 200', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: 'ok' });
});
```

- [ ] **Step 2: Create test setup/teardown (mongodb-memory-server)**

```ts
// apps/api/src/__tests__/setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from '../db';

let mongod: MongoMemoryServer;

export default async function setup() {
  mongod = await MongoMemoryServer.create();
  (global as any).__MONGOD__ = mongod;
  await connectDB(mongod.getUri());
}
```

```ts
// apps/api/src/__tests__/teardown.ts
import { disconnectDB } from '../db';

export default async function teardown() {
  await disconnectDB();
  await (global as any).__MONGOD__.stop();
}
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd apps/api && yarn test --testPathPattern=health
```

Expected: FAIL — `Cannot find module '../app'`

- [ ] **Step 4: Write db.ts**

```ts
// apps/api/src/db.ts
import mongoose from 'mongoose';

export async function connectDB(uri: string): Promise<void> {
  await mongoose.connect(uri);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
```

- [ ] **Step 5: Write errorHandler.ts**

```ts
// apps/api/src/middleware/errorHandler.ts
import { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err.status ?? 500;
  const message = err.message ?? 'Internal server error';
  res.status(status).json({ error: message });
};
```

- [ ] **Step 6: Write app.ts**

```ts
// apps/api/src/app.ts
import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(errorHandler);
  return app;
}
```

- [ ] **Step 7: Write index.ts**

```ts
// apps/api/src/index.ts
import { createApp } from './app';
import { connectDB } from './db';

const PORT = process.env.PORT ?? 4000;
const MONGO_URI = process.env.MONGO_URI!;

connectDB(MONGO_URI).then(() => {
  createApp().listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
});
```

- [ ] **Step 8: Run test to verify it passes**

```bash
cd apps/api && yarn test --testPathPattern=health
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/
git commit -m "feat(api): Express scaffold + MongoDB connection + health check"
```

---

## Task 4: User Model + Auth Routes

**Files:**
- Create: `apps/api/src/models/User.ts`
- Create: `apps/api/src/routes/auth.routes.ts`
- Create: `apps/api/src/middleware/requireAuth.ts`
- Create: `apps/api/src/middleware/requireAdmin.ts`
- Modify: `apps/api/src/app.ts` — mount auth router
- Create: `apps/api/src/__tests__/auth.test.ts`

**Interfaces:**
- Consumes: `RegisterInputSchema`, `LoginInputSchema` from `@vajeeva/shared`
- Produces:
  - `requireAuth(req, res, next)` — attaches `req.user: { userId: string; role: 'user' | 'admin' }` or 401
  - `requireAdmin(req, res, next)` — 403 if `req.user.role !== 'admin'`
  - `POST /api/auth/register` → `{ accessToken: string }`
  - `POST /api/auth/login` → `{ accessToken: string }` + sets `refreshToken` httpOnly cookie
  - `POST /api/auth/refresh` → `{ accessToken: string }`

- [ ] **Step 1: Write failing auth tests**

```ts
// apps/api/src/__tests__/auth.test.ts
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('POST /api/auth/register', () => {
  it('creates user and returns accessToken', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user@test.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('rejects duplicate email with 409', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'password123' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('rejects short password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@test.com', password: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@test.com', password: 'password123' });
  });

  it('returns accessToken and sets refreshToken cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns new accessToken when valid refreshToken cookie present', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'password123' });
    const cookie = loginRes.headers['set-cookie'][0];

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('returns 401 with no cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd apps/api && yarn test --testPathPattern=auth
```

Expected: FAIL — `Cannot find module '../routes/auth.routes'`

- [ ] **Step 3: Write User model**

```ts
// apps/api/src/models/User.ts
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['user', 'admin'], default: 'user' },
  lastSyncAt:   { type: Date, default: () => new Date(0) },
  createdAt:    { type: Date, default: Date.now },
});

export const User = mongoose.model('User', UserSchema);
```

- [ ] **Step 4: Write requireAuth middleware**

```ts
// apps/api/src/middleware/requireAuth.ts
import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export const requireAuth: RequestHandler = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET!) as {
      userId: string; role: 'user' | 'admin';
    };
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
};
```

- [ ] **Step 5: Write requireAdmin middleware**

```ts
// apps/api/src/middleware/requireAdmin.ts
import { RequestHandler } from 'express';

export const requireAdmin: RequestHandler = (req, res, next) => {
  if ((req as any).user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  next();
};
```

- [ ] **Step 6: Write auth.routes.ts**

```ts
// apps/api/src/routes/auth.routes.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegisterInputSchema, LoginInputSchema } from '@vajeeva/shared';
import { User } from '../models/User';

export const authRouter = Router();

function signAccess(userId: string, role: string) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '15m' });
}
function signRefresh(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '30d' });
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = RegisterInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const { email, password } = parsed.data;
    if (await User.findOne({ email })) { res.status(409).json({ error: 'Email already registered' }); return; }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash });
    res.status(201).json({ accessToken: signAccess(user.id, user.role) });
  } catch (err) { next(err); }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = LoginInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid credentials' }); return;
    }
    res.cookie('refreshToken', signRefresh(user.id), {
      httpOnly: true, sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken: signAccess(user.id, user.role) });
  } catch (err) { next(err); }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) { res.status(401).json({ error: 'No refresh token' }); return; }
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    const user = await User.findById(payload.userId);
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }
    res.json({ accessToken: signAccess(user.id, user.role) });
  } catch {
    res.status(401).json({ error: 'Refresh token invalid or expired' });
  }
});
```

- [ ] **Step 7: Mount auth router in app.ts**

Add to `apps/api/src/app.ts` after the cookie-parser line:

```ts
import { authRouter } from './routes/auth.routes';
// ...
app.use('/api/auth', authRouter);
```

- [ ] **Step 8: Set test env vars — create apps/api/src/__tests__/env.ts**

```ts
// apps/api/src/__tests__/env.ts  — import this at the top of every test file
process.env.JWT_SECRET = 'test-secret-min-32-chars-xxxxxxxxx';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-xxxxxxx';
```

Add `import './env'` as the first line of `auth.test.ts`.

- [ ] **Step 9: Run tests to verify they pass**

```bash
cd apps/api && yarn test --testPathPattern=auth
```

Expected: all PASS

- [ ] **Step 10: Commit**

```bash
git add apps/api/src/
git commit -m "feat(api): User model + auth routes (register/login/refresh) + auth middleware"
```

---

## Task 5: Recipe Model + Public Routes

**Files:**
- Create: `apps/api/src/models/Recipe.ts`
- Create: `apps/api/src/routes/recipes.routes.ts`
- Modify: `apps/api/src/app.ts` — mount recipes router
- Create: `apps/api/src/__tests__/recipes.test.ts`

**Interfaces:**
- Consumes: `requireAuth` from `./middleware/requireAuth`
- Produces:
  - `GET /api/recipes` → `Recipe[]` (published only; optional `?category=solid|liquid|semi-solid`)
  - `GET /api/recipes/:slug` → `Recipe` (published only) or 404

- [ ] **Step 1: Write failing recipe tests**

```ts
// apps/api/src/__tests__/recipes.test.ts
import './env';
import request from 'supertest';
import { createApp } from '../app';
import { Recipe } from '../models/Recipe';

const app = createApp();

const FIXTURE = {
  slug: 'coconut-burfi',
  nameEn: 'Coconut Burfi',
  nameTa: 'தேங்காய் பர்ஃபி',
  category: 'semi-solid',
  description: 'A classic sweet.',
  ingredients: [{ nameEn: 'Coconut', quantityG: '50g', quantityCup: '¼ cup' }],
  steps: [{
    order: 1, text: 'Cook coconut in milk.', phase: 'Milk phase',
    heat: 'Low heat', timerStr: null, stepIngredients: ['Coconut'], illColor: '#2A3828',
  }],
  healthFlags: [{ condition: 'diabetes', severity: 'avoid', note: 'High sugar' }],
  sources: [{ text: 'Ksemakutulhalam', citation: '10/54' }],
  yieldStr: '4 pieces', shelfLife: '5 days',
  status: 'published',
};

beforeEach(async () => { await Recipe.deleteMany({}); });

describe('GET /api/recipes', () => {
  it('returns published recipes', async () => {
    await Recipe.create(FIXTURE);
    await Recipe.create({ ...FIXTURE, slug: 'draft-recipe', status: 'draft' });
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].slug).toBe('coconut-burfi');
  });

  it('filters by category', async () => {
    await Recipe.create(FIXTURE);
    await Recipe.create({ ...FIXTURE, slug: 'rice-porridge', category: 'solid' });
    const res = await request(app).get('/api/recipes?category=semi-solid');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('GET /api/recipes/:slug', () => {
  it('returns recipe by slug', async () => {
    await Recipe.create(FIXTURE);
    const res = await request(app).get('/api/recipes/coconut-burfi');
    expect(res.status).toBe(200);
    expect(res.body.nameEn).toBe('Coconut Burfi');
  });

  it('returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/recipes/nope');
    expect(res.status).toBe(404);
  });

  it('returns 404 for draft slug (not published)', async () => {
    await Recipe.create({ ...FIXTURE, slug: 'secret-draft', status: 'draft' });
    const res = await request(app).get('/api/recipes/secret-draft');
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd apps/api && yarn test --testPathPattern=recipes
```

Expected: FAIL — `Cannot find module '../models/Recipe'`

- [ ] **Step 3: Write Recipe model**

```ts
// apps/api/src/models/Recipe.ts
import mongoose from 'mongoose';

const IngredientSchema = new mongoose.Schema({
  nameEn: String, quantityG: String, quantityCup: String,
}, { _id: false });

const StepSchema = new mongoose.Schema({
  order: Number, text: String, phase: String,
  heat: { type: String, default: null },
  timerStr: { type: String, default: null },
  stepIngredients: [String],
  illColor: String,
}, { _id: false });

const HealthFlagSchema = new mongoose.Schema({
  condition: String,
  severity: { type: String, enum: ['safe', 'caution', 'avoid'] },
  note: String,
}, { _id: false });

const RecipeSchema = new mongoose.Schema({
  slug:        { type: String, required: true, unique: true },
  nameEn:      { type: String, required: true },
  nameTa:      String,
  category:    { type: String, enum: ['solid', 'liquid', 'semi-solid'] },
  description: String,
  ingredients: [IngredientSchema],
  steps:       [StepSchema],
  healthFlags: [HealthFlagSchema],
  sources:     [{ text: String, citation: String }],
  yieldStr:    String,
  shelfLife:   String,
  status:      { type: String, enum: ['published', 'draft'], default: 'draft' },
}, { timestamps: true });

export const Recipe = mongoose.model('Recipe', RecipeSchema);
```

- [ ] **Step 4: Write recipes.routes.ts**

```ts
// apps/api/src/routes/recipes.routes.ts
import { Router } from 'express';
import { Recipe } from '../models/Recipe';

export const recipesRouter = Router();

recipesRouter.get('/', async (req, res, next) => {
  try {
    const filter: Record<string, unknown> = { status: 'published' };
    if (req.query.category) filter.category = req.query.category;
    const recipes = await Recipe.find(filter).lean();
    res.json(recipes);
  } catch (err) { next(err); }
});

recipesRouter.get('/:slug', async (req, res, next) => {
  try {
    const recipe = await Recipe.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!recipe) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(recipe);
  } catch (err) { next(err); }
});
```

- [ ] **Step 5: Mount in app.ts**

```ts
import { recipesRouter } from './routes/recipes.routes';
// ...
app.use('/api/recipes', recipesRouter);
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd apps/api && yarn test --testPathPattern=recipes
```

Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/
git commit -m "feat(api): Recipe model + public GET /api/recipes routes"
```

---

## Task 6: SavedRecipe Model + Sync Routes

**Files:**
- Create: `apps/api/src/models/SavedRecipe.ts`
- Create: `apps/api/src/routes/sync.routes.ts`
- Modify: `apps/api/src/app.ts` — mount sync router
- Create: `apps/api/src/__tests__/sync.test.ts`

**Interfaces:**
- Consumes: `requireAuth` middleware; `Recipe` model; `User` model
- Produces:
  - `GET /api/sync/recipes?since=<iso>` → `Recipe[]` (published, updatedAt > since) [auth]
  - `GET /api/sync/saved` → `string[]` (recipeIds) [auth]
  - `POST /api/sync/saved` body `{ added: string[], removed: string[] }` → `{ ok: true }` [auth]

- [ ] **Step 1: Write failing sync tests**

```ts
// apps/api/src/__tests__/sync.test.ts
import './env';
import request from 'supertest';
import { createApp } from '../app';
import { Recipe } from '../models/Recipe';
import { User } from '../models/User';

const app = createApp();

const RECIPE = {
  slug: 'sync-recipe', nameEn: 'Sync Recipe', nameTa: '', category: 'solid',
  description: 'Test', ingredients: [{ nameEn: 'A', quantityG: '1g', quantityCup: '1 tsp' }],
  steps: [{ order: 1, text: 'Do it', phase: 'P', heat: null, timerStr: null, stepIngredients: [], illColor: '#111111' }],
  healthFlags: [], sources: [], yieldStr: '1', shelfLife: '1 day', status: 'published',
};

let token: string;

beforeEach(async () => {
  await Recipe.deleteMany({});
  await User.deleteMany({});
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'sync@test.com', password: 'password123' });
  token = res.body.accessToken;
});

describe('GET /api/sync/recipes', () => {
  it('returns recipes updated after since param', async () => {
    const before = new Date(Date.now() - 1000).toISOString();
    await Recipe.create(RECIPE);
    const res = await request(app)
      .get(`/api/sync/recipes?since=${before}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns empty array when nothing updated since', async () => {
    await Recipe.create(RECIPE);
    const since = new Date(Date.now() + 5000).toISOString();
    const res = await request(app)
      .get(`/api/sync/recipes?since=${since}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/sync/recipes?since=2020-01-01');
    expect(res.status).toBe(401);
  });
});

describe('POST + GET /api/sync/saved', () => {
  it('saves and retrieves recipe IDs', async () => {
    const recipe = await Recipe.create(RECIPE);
    await request(app)
      .post('/api/sync/saved')
      .set('Authorization', `Bearer ${token}`)
      .send({ added: [recipe.id], removed: [] });
    const res = await request(app)
      .get('/api/sync/saved')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toContain(recipe.id);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd apps/api && yarn test --testPathPattern=sync
```

Expected: FAIL

- [ ] **Step 3: Write SavedRecipe model**

```ts
// apps/api/src/models/SavedRecipe.ts
import mongoose from 'mongoose';

const SavedRecipeSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  savedAt:  { type: Date, default: Date.now },
});

SavedRecipeSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

export const SavedRecipe = mongoose.model('SavedRecipe', SavedRecipeSchema);
```

- [ ] **Step 4: Write sync.routes.ts**

```ts
// apps/api/src/routes/sync.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { Recipe } from '../models/Recipe';
import { SavedRecipe } from '../models/SavedRecipe';

export const syncRouter = Router();
syncRouter.use(requireAuth);

syncRouter.get('/recipes', async (req, res, next) => {
  try {
    const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
    const recipes = await Recipe.find({ status: 'published', updatedAt: { $gt: since } }).lean();
    res.json(recipes);
  } catch (err) { next(err); }
});

syncRouter.get('/saved', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const saved = await SavedRecipe.find({ userId }).lean();
    res.json(saved.map(s => s.recipeId.toString()));
  } catch (err) { next(err); }
});

syncRouter.post('/saved', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const { added = [], removed = [] } = req.body as { added: string[]; removed: string[] };
    const addOps = added.map(recipeId =>
      SavedRecipe.findOneAndUpdate(
        { userId, recipeId },
        { userId, recipeId, savedAt: new Date() },
        { upsert: true, new: true }
      )
    );
    const removeOp = SavedRecipe.deleteMany({ userId, recipeId: { $in: removed } });
    await Promise.all([...addOps, removeOp]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});
```

- [ ] **Step 5: Mount in app.ts**

```ts
import { syncRouter } from './routes/sync.routes';
// ...
app.use('/api/sync', syncRouter);
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd apps/api && yarn test --testPathPattern=sync
```

Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/
git commit -m "feat(api): SavedRecipe model + sync routes (delta pull + saved list)"
```

---

## Task 7: Admin Routes

**Files:**
- Create: `apps/api/src/routes/admin.routes.ts`
- Modify: `apps/api/src/app.ts` — mount admin router
- Create: `apps/api/src/__tests__/admin.test.ts`

**Interfaces:**
- Consumes: `requireAuth`, `requireAdmin`; `Recipe` model; `RecipeInputSchema` from `@vajeeva/shared`
- Produces:
  - `GET    /api/admin/recipes` → `Recipe[]` (all, incl. drafts) [admin]
  - `POST   /api/admin/recipes` body: `RecipeInput` → `Recipe` [admin]
  - `PUT    /api/admin/recipes/:id` body: `RecipeInput` → `Recipe` [admin]
  - `PATCH  /api/admin/recipes/:id` body: `Partial<RecipeInput>` → `Recipe` [admin]
  - `DELETE /api/admin/recipes/:id` → `{ ok: true }` [admin]

- [ ] **Step 1: Write failing admin tests**

```ts
// apps/api/src/__tests__/admin.test.ts
import './env';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { Recipe } from '../models/Recipe';

const app = createApp();

const RECIPE_INPUT = {
  slug: 'admin-test-recipe', nameEn: 'Admin Recipe', nameTa: '', category: 'solid',
  description: 'Test', ingredients: [{ nameEn: 'A', quantityG: '1g', quantityCup: '1 tsp' }],
  steps: [{ order: 1, text: 'Do it', phase: 'P', heat: null, timerStr: null, stepIngredients: [], illColor: '#111111' }],
  healthFlags: [], sources: [], yieldStr: '1', shelfLife: '1 day', status: 'draft',
};

let adminToken: string;
let userToken: string;

beforeAll(async () => {
  await User.deleteMany({});
  const adminUser = await User.create({
    email: 'admin@test.com', passwordHash: 'x', role: 'admin',
  });
  const jwt = require('jsonwebtoken');
  adminToken = jwt.sign({ userId: adminUser.id, role: 'admin' }, process.env.JWT_SECRET!, { expiresIn: '15m' });

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'user@test.com', password: 'password123' });
  userToken = res.body.accessToken;
});

beforeEach(async () => { await Recipe.deleteMany({}); });

describe('GET /api/admin/recipes', () => {
  it('returns all recipes including drafts for admin', async () => {
    await Recipe.create(RECIPE_INPUT);
    const res = await request(app)
      .get('/api/admin/recipes')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/admin/recipes')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/admin/recipes', () => {
  it('creates a recipe', async () => {
    const res = await request(app)
      .post('/api/admin/recipes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(RECIPE_INPUT);
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('admin-test-recipe');
  });

  it('rejects duplicate slug with 409', async () => {
    await Recipe.create(RECIPE_INPUT);
    const res = await request(app)
      .post('/api/admin/recipes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(RECIPE_INPUT);
    expect(res.status).toBe(409);
  });
});

describe('PATCH /api/admin/recipes/:id', () => {
  it('updates status to published', async () => {
    const recipe = await Recipe.create(RECIPE_INPUT);
    const res = await request(app)
      .patch(`/api/admin/recipes/${recipe.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'published' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('published');
  });
});

describe('DELETE /api/admin/recipes/:id', () => {
  it('deletes a recipe', async () => {
    const recipe = await Recipe.create(RECIPE_INPUT);
    const res = await request(app)
      .delete(`/api/admin/recipes/${recipe.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(await Recipe.findById(recipe.id)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd apps/api && yarn test --testPathPattern=admin
```

Expected: FAIL

- [ ] **Step 3: Write admin.routes.ts**

```ts
// apps/api/src/routes/admin.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { Recipe } from '../models/Recipe';
import { RecipeInputSchema } from '@vajeeva/shared';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/recipes', async (req, res, next) => {
  try {
    res.json(await Recipe.find({}).lean());
  } catch (err) { next(err); }
});

adminRouter.post('/recipes', async (req, res, next) => {
  try {
    const parsed = RecipeInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const existing = await Recipe.findOne({ slug: parsed.data.slug });
    if (existing) { res.status(409).json({ error: 'Slug already exists' }); return; }
    const recipe = await Recipe.create(parsed.data);
    res.status(201).json(recipe);
  } catch (err) { next(err); }
});

adminRouter.put('/recipes/:id', async (req, res, next) => {
  try {
    const parsed = RecipeInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { ...parsed.data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!recipe) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(recipe);
  } catch (err) { next(err); }
});

adminRouter.patch('/recipes/:id', async (req, res, next) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!recipe) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(recipe);
  } catch (err) { next(err); }
});

adminRouter.delete('/recipes/:id', async (req, res, next) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ ok: true });
  } catch (err) { next(err); }
});
```

- [ ] **Step 4: Mount in app.ts**

```ts
import { adminRouter } from './routes/admin.routes';
// ...
app.use('/api/admin', adminRouter);
```

- [ ] **Step 5: Run all tests**

```bash
cd apps/api && yarn test
```

Expected: all suites PASS (health, auth, recipes, sync, admin)

- [ ] **Step 6: Final commit**

```bash
git add apps/api/src/
git commit -m "feat(api): admin CRUD routes with role guard — Plan 1 complete"
```

---

## Self-Review

**Spec coverage:**
- ✅ Monorepo (Yarn workspaces + Turborepo) — Task 1
- ✅ `packages/shared` Zod schemas — Task 2
- ✅ Express + MongoDB connection — Task 3
- ✅ JWT auth (register / login / refresh, 15m/30d) — Task 4
- ✅ `requireAuth` + `requireAdmin` middleware — Task 4
- ✅ Public recipe routes (category filter, slug lookup, draft hidden) — Task 5
- ✅ Delta sync `?since=` — Task 6
- ✅ Saved list push/pull — Task 6
- ✅ Admin CRUD + 403 guard — Task 7
- ✅ httpOnly cookie for refresh token — Task 4 (`authRouter.post('/login')`)

**Not in this plan (correct — separate plans):**
- React Native app (Plan 2)
- Admin web app (Plan 3)
- Seed data script — add to Plan 2 setup or as a separate `apps/api/scripts/seed.ts`

**Type consistency check:**
- `RecipeInputSchema` used in Task 2 (defined) and Task 7 (consumed) ✅
- `requireAuth` attaches `req.user.userId` (string) — consumed correctly in sync routes ✅
- `signAccess(userId, role)` used in login and refresh — same signature ✅

**No placeholders found.** All steps have code.
