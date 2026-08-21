# Vajeeva Admin UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pixel-perfect admin panel matching `prototypes/vajeeva-admin-mockup.html` — extend existing `apps/admin` with Dashboard, Sources, SubRecipes, Users, and HealthFlags pages while keeping the 17 existing tests green.

**Architecture:** Vite + React + TailwindCSS 4 + React Router (already set up). New pages added as routes; shared layout chrome (Sidebar + Topbar) already exists or is extended. All new pages follow the `grid-template-columns` values from the prototype exactly.

**Tech Stack:** Vite, React 18, TailwindCSS 4, React Router, existing `apps/admin/src/api/client.ts`

**Spec:** `docs/superpowers/specs/2026-08-21-vajeeva-ui-implementation-design.md`

## Global Constraints

- Sidebar: 240px, sand bg (`#E9E1D0`), 1px `#E5DDCC` right border
- Topbar: 58px height, cream bg (`#FBF8F1`), 1px `#E5DDCC` bottom border
- Table grid: `2fr 1fr 1fr 80px 110px` (RecipeList) — unchanged from existing
- RecipeEditor grid: `1fr 360px`
- Dashboard: 3-col CSS grid
- All existing tests (17/17) must remain green throughout
- Follow existing Tailwind class patterns; don't introduce new CSS files

---

### Task 1: Audit existing pages + extend Sidebar nav

**Files:**
- Read: `apps/admin/src/pages/RecipeListPage.tsx`
- Read: `apps/admin/src/pages/RecipeEditorPage.tsx`
- Read: `apps/admin/src/pages/LoginPage.tsx`
- Modify: `apps/admin/src/App.tsx` (or equivalent router file) — add new routes
- Modify: existing Sidebar component — add new nav items

**Interfaces:**
- Produces: nav links for Dashboard, Sources, SubRecipes, Users, HealthFlags visible in sidebar

- [ ] **Step 1: Read existing router file to understand current routes**

```bash
cat vajeeva/apps/admin/src/App.tsx
```

Note the existing `<Route>` structure.

- [ ] **Step 2: Read existing Sidebar to understand its nav item structure**

```bash
cat vajeeva/apps/admin/src/components/*.tsx 2>/dev/null || find vajeeva/apps/admin/src -name "Sidebar*"
```

- [ ] **Step 3: Add new routes to router**

In `App.tsx` (or wherever routes are defined), add:

```tsx
import { DashboardPage } from './pages/DashboardPage';
import { SourcesPage } from './pages/SourcesPage';
import { SubRecipesPage } from './pages/SubRecipesPage';
import { UsersPage } from './pages/UsersPage';
import { HealthFlagsPage } from './pages/HealthFlagsPage';

// Inside <Routes>:
<Route path="/dashboard" element={<DashboardPage />} />
<Route path="/sources" element={<SourcesPage />} />
<Route path="/subrecipes" element={<SubRecipesPage />} />
<Route path="/users" element={<UsersPage />} />
<Route path="/health-flags" element={<HealthFlagsPage />} />
```

- [ ] **Step 4: Extend Sidebar nav items**

Find the sidebar nav list and add (following existing item shape exactly):

```tsx
{ href: '/dashboard',   label: 'Dashboard' },
{ href: '/',            label: 'Recipes' },       // already exists
{ href: '/sources',     label: 'Sources' },
{ href: '/subrecipes',  label: 'Sub-recipes' },
{ href: '/users',       label: 'Users' },
{ href: '/health-flags',label: 'Health Flags' },
```

- [ ] **Step 5: Run existing tests to confirm nothing broke**

```bash
cd vajeeva/apps/admin
npm test
```

Expected: 17/17 pass.

- [ ] **Step 6: Commit**

```bash
git add vajeeva/apps/admin/src/
git commit -m "feat(admin): add new routes + sidebar nav items"
```

---

### Task 2: DashboardPage

**Files:**
- Create: `apps/admin/src/pages/DashboardPage.tsx`
- Create: `apps/admin/src/pages/DashboardPage.test.tsx`

**Interfaces:**
- Consumes: existing admin layout shell (Sidebar + Topbar already rendered by parent)
- Produces: 3-col grid with stat card (42px number), bar chart, recent edits timeline

- [ ] **Step 1: Write the test**

```tsx
// DashboardPage.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';

test('renders dashboard heading and stat card', () => {
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
  expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  expect(screen.getByTestId('total-recipes-count')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd vajeeva/apps/admin
npm test -- DashboardPage --no-coverage
```

Expected: FAIL (DashboardPage not found).

- [ ] **Step 3: Write `DashboardPage.tsx`** (spec §7 DashboardPage)

```tsx
import React from 'react';

// ponytail: static placeholder data — replace with useEffect + api call
const STATS = { total: 51, byCategory: [
  { label: 'Solid', count: 24, color: '#3E6B4F' },
  { label: 'Liquid', count: 11, color: '#3B6BA0' },
  { label: 'Semi-solid', count: 16, color: '#C6902F' },
]};

const RECENT = [
  { name: 'Paavakkai Pitla', action: 'Published', time: '2h ago' },
  { name: 'Methi Rasam', action: 'Draft saved', time: '4h ago' },
  { name: 'Kollu Rasam', action: 'Published', time: '1d ago' },
];

export function DashboardPage() {
  const maxCount = Math.max(...STATS.byCategory.map(c => c.count));
  return (
    <div className="p-8">
      <div className="grid grid-cols-3 gap-6">
        {/* Stat card */}
        <div className="bg-[#F2EDE1] border border-[#E5DDCC] rounded-xl p-6">
          <p className="text-xs font-mono text-[#9C9482] uppercase tracking-wider mb-2">Total Recipes</p>
          <p
            data-testid="total-recipes-count"
            className="font-serif text-[42px] font-bold text-[#2A251E] leading-none"
          >
            {STATS.total}
          </p>
        </div>

        {/* By category */}
        <div className="bg-[#F2EDE1] border border-[#E5DDCC] rounded-xl p-6">
          <p className="text-xs font-mono text-[#9C9482] uppercase tracking-wider mb-4">By Category</p>
          <div className="flex flex-col gap-3">
            {STATS.byCategory.map(c => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="text-xs text-[#6E6656] w-16">{c.label}</span>
                <div className="flex-1 bg-[#E9E1D0] rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${(c.count / maxCount) * 100}%`, backgroundColor: c.color }}
                  />
                </div>
                <span className="text-xs font-mono text-[#9C9482] w-6 text-right">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent edits */}
        <div className="bg-[#F2EDE1] border border-[#E5DDCC] rounded-xl p-6">
          <p className="text-xs font-mono text-[#9C9482] uppercase tracking-wider mb-4">Recent Edits</p>
          <div className="flex flex-col gap-4">
            {RECENT.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#3E6B4F] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#2A251E] font-medium">{item.name}</p>
                  <p className="text-xs text-[#9C9482]">{item.action} · {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
cd vajeeva/apps/admin
npm test -- DashboardPage --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add vajeeva/apps/admin/src/pages/DashboardPage*
git commit -m "feat(admin): DashboardPage — 3-col grid, stat card, bar chart, recent edits"
```

---

### Task 3: SourcesPage

**Files:**
- Create: `apps/admin/src/pages/SourcesPage.tsx`
- Create: `apps/admin/src/pages/SourcesPage.test.tsx`

**Interfaces:**
- Produces: table of sources with Name, Type, Recipes count, Edit/Delete; "+ New Source" modal

- [ ] **Step 1: Write the test**

```tsx
// SourcesPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SourcesPage } from './SourcesPage';

test('renders sources table and new button', () => {
  render(<MemoryRouter><SourcesPage /></MemoryRouter>);
  expect(screen.getByText(/sources/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /new source/i })).toBeInTheDocument();
});

test('opens modal on new source click', () => {
  render(<MemoryRouter><SourcesPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /new source/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd vajeeva/apps/admin
npm test -- SourcesPage --no-coverage
```

- [ ] **Step 3: Write `SourcesPage.tsx`**

```tsx
import React, { useState } from 'react';

interface Source {
  id: string;
  name: string;
  type: string;
  recipeCount: number;
}

const PLACEHOLDER_SOURCES: Source[] = [
  { id: '1', name: 'Samayamulu', type: 'Classical text', recipeCount: 8 },
  { id: '2', name: 'Arogya Padasastra', type: 'Classical text', recipeCount: 5 },
  { id: '3', name: 'ICMR-NIN 2024', type: 'Modern reference', recipeCount: 12 },
];

interface ModalProps {
  source?: Source | null;
  onClose: () => void;
}

function SourceModal({ source, onClose }: ModalProps) {
  const [name, setName] = useState(source?.name ?? '');
  const [type, setType] = useState(source?.type ?? '');
  return (
    <div role="dialog" className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[420px]">
        <h2 className="font-serif text-lg font-bold text-[#2A251E] mb-4">
          {source ? 'Edit Source' : 'New Source'}
        </h2>
        <div className="flex flex-col gap-3 mb-6">
          <div>
            <label className="text-xs font-mono text-[#9C9482] uppercase tracking-wider">Name</label>
            <input
              className="w-full border border-[#E5DDCC] rounded-lg px-3 py-2 text-sm mt-1"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-mono text-[#9C9482] uppercase tracking-wider">Type</label>
            <input
              className="w-full border border-[#E5DDCC] rounded-lg px-3 py-2 text-sm mt-1"
              value={type}
              onChange={e => setType(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6E6656]">Cancel</button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold bg-[#3E6B4F] text-white rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function SourcesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Source | null>(null);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-[#2A251E]">Sources</h1>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="bg-[#3E6B4F] text-white text-sm font-bold px-4 py-2 rounded-lg"
        >
          + New Source
        </button>
      </div>

      {/* Table header */}
      <div className="grid gap-0 border border-[#E5DDCC] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_80px_110px] bg-[#F2EDE1] px-4 py-3">
          <span className="text-xs font-mono text-[#9C9482] uppercase tracking-wider">Name</span>
          <span className="text-xs font-mono text-[#9C9482] uppercase tracking-wider">Type</span>
          <span className="text-xs font-mono text-[#9C9482] uppercase tracking-wider text-right">Recipes</span>
          <span className="text-xs font-mono text-[#9C9482] uppercase tracking-wider text-right">Actions</span>
        </div>
        {PLACEHOLDER_SOURCES.map((src, i) => (
          <div
            key={src.id}
            className={`grid grid-cols-[2fr_1fr_80px_110px] px-4 py-3 items-center ${i % 2 === 1 ? 'bg-white' : ''} hover:bg-[#F2EDE1]/50`}
          >
            <span className="text-sm font-medium text-[#2A251E]">{src.name}</span>
            <span className="text-sm text-[#6E6656]">{src.type}</span>
            <span className="text-sm text-[#9C9482] text-right">{src.recipeCount}</span>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setEditing(src); setModalOpen(true); }}
                className="text-xs px-3 py-1 border border-[#E5DDCC] rounded text-[#6E6656] hover:border-[#3E6B4F]"
              >
                Edit
              </button>
              <button className="text-xs px-3 py-1 border border-[#F3E1D8] rounded text-[#B4472E] hover:bg-[#F3E1D8]">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && <SourceModal source={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
cd vajeeva/apps/admin
npm test -- SourcesPage --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add vajeeva/apps/admin/src/pages/SourcesPage*
git commit -m "feat(admin): SourcesPage — table + CRUD modal"
```

---

### Task 4: SubRecipesPage

**Files:**
- Create: `apps/admin/src/pages/SubRecipesPage.tsx`
- Create: `apps/admin/src/pages/SubRecipesPage.test.tsx`

**Interfaces:**
- Same table pattern as SourcesPage; columns: Name, Used In (count), Edit/Delete

- [ ] **Step 1: Write test**

```tsx
// SubRecipesPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SubRecipesPage } from './SubRecipesPage';

test('renders sub-recipes table', () => {
  render(<MemoryRouter><SubRecipesPage /></MemoryRouter>);
  expect(screen.getByText(/sub-recipes/i)).toBeInTheDocument();
});

test('opens modal on new sub-recipe click', () => {
  render(<MemoryRouter><SubRecipesPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /new sub-recipe/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify fail**

```bash
cd vajeeva/apps/admin
npm test -- SubRecipesPage --no-coverage
```

- [ ] **Step 3: Write `SubRecipesPage.tsx`**

```tsx
import React, { useState } from 'react';

interface SubRecipe {
  id: string;
  name: string;
  usedIn: number;
}

const PLACEHOLDER: SubRecipe[] = [
  { id: '1', name: 'Tamarind extract', usedIn: 6 },
  { id: '2', name: 'Coconut paste', usedIn: 9 },
  { id: '3', name: 'Spice powder blend', usedIn: 4 },
];

function SubRecipeModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <div role="dialog" className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[420px]">
        <h2 className="font-serif text-lg font-bold text-[#2A251E] mb-4">New Sub-recipe</h2>
        <div className="mb-6">
          <label className="text-xs font-mono text-[#9C9482] uppercase tracking-wider">Name</label>
          <input
            className="w-full border border-[#E5DDCC] rounded-lg px-3 py-2 text-sm mt-1"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6E6656]">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold bg-[#3E6B4F] text-white rounded-lg">Save</button>
        </div>
      </div>
    </div>
  );
}

export function SubRecipesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-[#2A251E]">Sub-recipes</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-[#3E6B4F] text-white text-sm font-bold px-4 py-2 rounded-lg"
        >
          + New Sub-recipe
        </button>
      </div>
      <div className="border border-[#E5DDCC] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_110px] bg-[#F2EDE1] px-4 py-3">
          <span className="text-xs font-mono text-[#9C9482] uppercase tracking-wider">Name</span>
          <span className="text-xs font-mono text-[#9C9482] uppercase tracking-wider">Used In</span>
          <span className="text-xs font-mono text-[#9C9482] uppercase tracking-wider text-right">Actions</span>
        </div>
        {PLACEHOLDER.map((sr, i) => (
          <div key={sr.id} className={`grid grid-cols-[2fr_1fr_110px] px-4 py-3 items-center ${i % 2 === 1 ? 'bg-white' : ''}`}>
            <span className="text-sm font-medium text-[#2A251E]">{sr.name}</span>
            <span className="text-sm text-[#6E6656]">{sr.usedIn} recipes</span>
            <div className="flex justify-end gap-2">
              <button className="text-xs px-3 py-1 border border-[#E5DDCC] rounded text-[#6E6656]">Edit</button>
              <button className="text-xs px-3 py-1 border border-[#F3E1D8] rounded text-[#B4472E]">Delete</button>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && <SubRecipeModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
cd vajeeva/apps/admin
npm test -- SubRecipesPage --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add vajeeva/apps/admin/src/pages/SubRecipesPage*
git commit -m "feat(admin): SubRecipesPage — table + modal"
```

---

### Task 5: UsersPage

**Files:**
- Create: `apps/admin/src/pages/UsersPage.tsx`
- Create: `apps/admin/src/pages/UsersPage.test.tsx`

**Interfaces:**
- Read-only table: Name, Email, Auth providers, Health profile tags, Joined date
- No edit / delete buttons (spec: "No action buttons")

- [ ] **Step 1: Write test**

```tsx
// UsersPage.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UsersPage } from './UsersPage';

test('renders users table without action buttons', () => {
  render(<MemoryRouter><UsersPage /></MemoryRouter>);
  expect(screen.getByText(/users/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify fail**

```bash
cd vajeeva/apps/admin
npm test -- UsersPage --no-coverage
```

- [ ] **Step 3: Write `UsersPage.tsx`**

```tsx
import React from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  authProviders: string[];
  healthTags: string[];
  joinedAt: string;
}

const PLACEHOLDER_USERS: User[] = [
  {
    id: '1', name: 'Priya Venkatesh', email: 'priya@example.com',
    authProviders: ['Google'], healthTags: ['Diabetes', 'Lactose intolerant'],
    joinedAt: '2026-07-12',
  },
  {
    id: '2', name: 'Karthik Rajan', email: 'karthik@example.com',
    authProviders: ['Email', 'Phone'], healthTags: [],
    joinedAt: '2026-07-28',
  },
  {
    id: '3', name: 'Meena Subramanian', email: 'meena@example.com',
    authProviders: ['Email'], healthTags: ['Pregnant'],
    joinedAt: '2026-08-05',
  },
];

const PROVIDER_COLORS: Record<string, string> = {
  Google: 'bg-[#E8F0FA] text-[#3B6BA0]',
  Email:  'bg-[#E4EDE3] text-[#3E6B4F]',
  Phone:  'bg-[#F4E8CE] text-[#A9701F]',
};

export function UsersPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-[#2A251E]">Users</h1>
        <span className="text-sm text-[#9C9482]">{PLACEHOLDER_USERS.length} users</span>
      </div>
      <div className="border border-[#E5DDCC] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_2fr_1fr_2fr_1fr] bg-[#F2EDE1] px-4 py-3">
          {['Name', 'Email', 'Auth', 'Health Profile', 'Joined'].map(h => (
            <span key={h} className="text-xs font-mono text-[#9C9482] uppercase tracking-wider">{h}</span>
          ))}
        </div>
        {PLACEHOLDER_USERS.map((user, i) => (
          <div key={user.id} className={`grid grid-cols-[2fr_2fr_1fr_2fr_1fr] px-4 py-3 items-center ${i % 2 === 1 ? 'bg-white' : ''}`}>
            <span className="text-sm font-medium text-[#2A251E]">{user.name}</span>
            <span className="text-sm text-[#6E6656]">{user.email}</span>
            <div className="flex flex-wrap gap-1">
              {user.authProviders.map(p => (
                <span key={p} className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROVIDER_COLORS[p] ?? ''}`}>{p}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {user.healthTags.length === 0
                ? <span className="text-xs text-[#9C9482]">—</span>
                : user.healthTags.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[#F3E1D8] text-[#B4472E]">{t}</span>
                  ))
              }
            </div>
            <span className="text-xs text-[#9C9482]">{user.joinedAt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
cd vajeeva/apps/admin
npm test -- UsersPage --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add vajeeva/apps/admin/src/pages/UsersPage*
git commit -m "feat(admin): UsersPage — read-only table, no action buttons"
```

---

### Task 6: HealthFlagsPage

**Files:**
- Create: `apps/admin/src/pages/HealthFlagsPage.tsx`
- Create: `apps/admin/src/pages/HealthFlagsPage.test.tsx`

**Interfaces:**
- One card per ConditionCode: label input + description textarea
- "Save all" green button
- Consumes: `ConditionCode` enum from `packages/types` (or inline)

- [ ] **Step 1: Write test**

```tsx
// HealthFlagsPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HealthFlagsPage } from './HealthFlagsPage';

test('renders a card for each condition', () => {
  render(<MemoryRouter><HealthFlagsPage /></MemoryRouter>);
  expect(screen.getByText(/diabetes/i)).toBeInTheDocument();
  expect(screen.getByText(/pregnancy/i)).toBeInTheDocument();
});

test('save all button is present', () => {
  render(<MemoryRouter><HealthFlagsPage /></MemoryRouter>);
  expect(screen.getByRole('button', { name: /save all/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify fail**

```bash
cd vajeeva/apps/admin
npm test -- HealthFlagsPage --no-coverage
```

- [ ] **Step 3: Write `HealthFlagsPage.tsx`**

```tsx
import React, { useState } from 'react';

// ConditionCode enum — must match packages/types or api model
const CONDITIONS = [
  { code: 'DIABETES',           label: 'Diabetes',            defaultDesc: 'High blood sugar — avoid recipes high in simple carbohydrates.' },
  { code: 'OBESITY',            label: 'Obesity',             defaultDesc: 'Weight management — prefer low-calorie, high-fibre preparations.' },
  { code: 'LACTOSE_INTOLERANT', label: 'Lactose Intolerant',  defaultDesc: 'Dairy intolerance — exclude milk-based ingredients.' },
  { code: 'SEDENTARY',          label: 'Sedentary Lifestyle',  defaultDesc: 'Low activity — prefer easily digestible, light recipes.' },
  { code: 'PREGNANT',           label: 'Pregnancy',           defaultDesc: 'Pregnancy — avoid bitter, pungent, or uterine-stimulating foods.' },
  { code: 'LACTATING',          label: 'Lactating',           defaultDesc: 'Lactation — favour galactagogues; avoid strong spices.' },
  { code: 'NUT_ALLERGY',        label: 'Nut Allergy',         defaultDesc: 'Tree nut or peanut allergy — exclude all nut-derived ingredients.' },
  { code: 'INFANT_8M',          label: 'Infant (8m+)',        defaultDesc: 'Complementary feeding — soft textures, no added salt or sugar.' },
] as const;

type FlagState = { label: string; description: string };

export function HealthFlagsPage() {
  const [flags, setFlags] = useState<Record<string, FlagState>>(() =>
    Object.fromEntries(CONDITIONS.map(c => [c.code, { label: c.label, description: c.defaultDesc }]))
  );

  function update(code: string, field: keyof FlagState, value: string) {
    setFlags(f => ({ ...f, [code]: { ...f[code], [field]: value } }));
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-[#2A251E]">Health Flags</h1>
        <button className="bg-[#3E6B4F] text-white text-sm font-bold px-4 py-2 rounded-lg">
          Save all
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {CONDITIONS.map(c => (
          <div key={c.code} className="bg-white border border-[#E5DDCC] rounded-xl p-4">
            <p className="text-xs font-mono text-[#9C9482] uppercase tracking-wider mb-3">{c.code}</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#6E6656] mb-1 block">Display label</label>
                <input
                  className="w-full border border-[#E5DDCC] rounded-lg px-3 py-2 text-sm"
                  value={flags[c.code]?.label ?? ''}
                  onChange={e => update(c.code, 'label', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-[#6E6656] mb-1 block">Description shown to users</label>
                <textarea
                  className="w-full border border-[#E5DDCC] rounded-lg px-3 py-2 text-sm resize-none"
                  rows={2}
                  value={flags[c.code]?.description ?? ''}
                  onChange={e => update(c.code, 'description', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
cd vajeeva/apps/admin
npm test -- HealthFlagsPage --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add vajeeva/apps/admin/src/pages/HealthFlagsPage*
git commit -m "feat(admin): HealthFlagsPage — per-condition card, label + description, save all"
```

---

### Task 7: Verify existing pages still match prototype + all tests green

**Files:** no new files

- [ ] **Step 1: Run full admin test suite**

```bash
cd vajeeva/apps/admin
npm test
```

Expected: all tests pass (17 original + new ones).

- [ ] **Step 2: Start admin dev server and verify visual**

```bash
cd vajeeva/apps/admin
npm run dev
```

Open `http://localhost:5173` and verify:
- Login page renders (centred card, bone bg, Vajeeva logo, email + password, green "Sign in")
- Sidebar: 240px sand bg, logo, all 6 nav items
- Topbar: 58px cream, page title left, search + "New Recipe" right
- RecipeList table: `2fr 1fr 1fr 80px 110px` columns, filter tabs, stats row
- RecipeEditor: `1fr 360px` two columns, sticky right panel
- Dashboard: 3-col grid
- Sources / SubRecipes: table + modal
- Users: read-only table
- HealthFlags: 2-col card grid, Save all button

- [ ] **Step 3: Check existing `HealthFlagRows` component still works in RecipeEditor**

The existing `components/HealthFlagRows.tsx` (used in RecipeEditorPage) must still render. Verify it's not broken by navigating to `/recipes/new` in the running dev server.

- [ ] **Step 4: Final commit**

```bash
git add vajeeva/apps/admin/
git commit -m "feat(admin): all new pages integrated — 17+ tests green, prototype-matched"
```
