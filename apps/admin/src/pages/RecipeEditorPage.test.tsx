import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RecipeEditorPage } from './RecipeEditorPage';
import { setToken } from '../api/client';

const DOC = {
  _id: 'r1',
  slug: 'coconut-burfi',
  nameEn: 'Coconut Burfi',
  nameTa: '',
  category: 'semi-solid',
  description: 'Sweet.',
  ingredients: [{ nameEn: 'Coconut', quantityG: '50 g', quantityCup: '¼ cup' }],
  steps: [{ order: 1, text: 'Cook it.', phase: 'Main', heat: null, timerStr: null, stepIngredients: [], illColor: '#2A3828' }],
  healthFlags: [],
  sources: [],
  yieldStr: '4 pieces',
  shelfLife: '5 days',
  status: 'draft',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setToken(null);
});

function renderCreate() {
  render(
    <MemoryRouter initialEntries={['/recipes/new']}>
      <Routes>
        <Route path="/recipes/new" element={<RecipeEditorPage />} />
        <Route path="/" element={<p>list</p>} />
      </Routes>
    </MemoryRouter>
  );
}

it('create mode: Publish posts a valid RecipeInput with status published', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 201 }));
  vi.stubGlobal('fetch', fetchMock);
  setToken('t');
  renderCreate();
  await userEvent.type(screen.getByLabelText(/name \(english\)/i), 'Ragi Malt');
  await userEvent.type(screen.getByLabelText(/^slug$/i), 'ragi-malt');
  await userEvent.type(screen.getByLabelText(/ingredient 1 name/i), 'Ragi');
  await userEvent.type(screen.getByLabelText(/step 1 text/i), 'Boil it.');
  await userEvent.click(screen.getByRole('button', { name: /publish/i }));

  expect(await screen.findByText('list')).toBeInTheDocument();
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe('/api/admin/recipes');
  expect(init.method).toBe('POST');
  const body = JSON.parse(init.body);
  expect(body.slug).toBe('ragi-malt');
  expect(body.status).toBe('published');
  expect(body.steps[0].order).toBe(1);
});

it('create mode: invalid slug shows a validation error and sends nothing', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  setToken('t');
  renderCreate();
  await userEvent.type(screen.getByLabelText(/name \(english\)/i), 'Bad Slug');
  await userEvent.type(screen.getByLabelText(/^slug$/i), 'Bad Slug!');
  await userEvent.type(screen.getByLabelText(/ingredient 1 name/i), 'X');
  await userEvent.type(screen.getByLabelText(/step 1 text/i), 'Y');
  await userEvent.click(screen.getByRole('button', { name: /publish/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent('slug');
  expect(fetchMock).not.toHaveBeenCalled();
});

it('edit mode: loads the recipe and PUTs on save', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([DOC]), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  setToken('t');
  render(
    <MemoryRouter initialEntries={['/recipes/r1/edit']}>
      <Routes>
        <Route path="/recipes/:id/edit" element={<RecipeEditorPage />} />
        <Route path="/" element={<p>list</p>} />
      </Routes>
    </MemoryRouter>
  );
  expect(await screen.findByDisplayValue('Coconut Burfi')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /save draft/i }));
  expect(await screen.findByText('list')).toBeInTheDocument();
  const [url, init] = fetchMock.mock.calls[1];
  expect(url).toBe('/api/admin/recipes/r1');
  expect(init.method).toBe('PUT');
  expect(JSON.parse(init.body).status).toBe('draft');
});

it('live-previews the recipe name as you type', async () => {
  vi.stubGlobal('fetch', vi.fn());
  setToken('t');
  renderCreate();
  await userEvent.type(screen.getByLabelText(/name \(english\)/i), 'Ragi Malt');
  const preview = screen.getByRole('complementary', { name: /app preview/i });
  expect(within(preview).getByText('Ragi Malt')).toBeInTheDocument();
});
