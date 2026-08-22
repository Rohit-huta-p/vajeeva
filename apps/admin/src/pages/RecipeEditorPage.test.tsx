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

// ── ADM-IMAGES: hero gallery + per-step image uploads ─────────────────────────

it('hero gallery: renders the "Add hero image" file input', async () => {
  vi.stubGlobal('fetch', vi.fn());
  setToken('t');
  renderCreate();
  // There should be a file input for the hero gallery
  const input = screen.getByLabelText(/add hero image/i) as HTMLInputElement;
  expect(input).toBeInTheDocument();
  expect(input.type).toBe('file');
  expect(input.accept).toContain('image/');
});

it('hero gallery: uploading a file calls /api/admin/uploads and shows thumbnail', async () => {
  const uploadMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ url: 'https://res.cloudinary.com/demo/image/upload/hero.jpg', publicId: 'vajeeva/hero' }), { status: 200 })
  );
  vi.stubGlobal('fetch', uploadMock);
  setToken('admin-tok');
  renderCreate();

  const file = new File(['img'], 'hero.jpg', { type: 'image/jpeg' });
  const input = screen.getByLabelText(/add hero image/i);
  await userEvent.upload(input, file);

  // POST to upload endpoint
  expect(uploadMock).toHaveBeenCalledWith(
    '/api/admin/uploads',
    expect.objectContaining({ method: 'POST' })
  );
  // Thumbnail appears
  expect(await screen.findByRole('img', { name: /hero image 1/i })).toBeInTheDocument();
});

it('hero gallery: shows inline error when upload returns 400', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: 'File too large (max 8MB)' }), { status: 400 })
  ));
  setToken('admin-tok');
  renderCreate();

  // Use an image file so the input change fires normally in jsdom
  const file = new File(['x'.repeat(100)], 'large.jpg', { type: 'image/jpeg' });
  const input = screen.getByLabelText(/add hero image/i);
  await userEvent.upload(input, file);

  expect(await screen.findByText(/file too large/i)).toBeInTheDocument();
});

it('hero gallery: remove button deletes the image from the list', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ url: 'https://res.cloudinary.com/demo/image/upload/hero.jpg', publicId: 'vajeeva/hero' }), { status: 200 })
  ));
  setToken('admin-tok');
  renderCreate();

  const file = new File(['img'], 'hero.jpg', { type: 'image/jpeg' });
  await userEvent.upload(screen.getByLabelText(/add hero image/i), file);
  expect(await screen.findByRole('img', { name: /hero image 1/i })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /remove hero image 1/i }));
  expect(screen.queryByRole('img', { name: /hero image 1/i })).not.toBeInTheDocument();
});

it('per-step: each step has an "Add step image" file input', async () => {
  vi.stubGlobal('fetch', vi.fn());
  setToken('t');
  renderCreate();
  // aria-label rendered by ImageGalleryEditor: "Add step 1 image"
  expect(screen.getByLabelText(/add step 1 image/i)).toBeInTheDocument();
});
