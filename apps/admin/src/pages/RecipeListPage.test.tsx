import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RecipeListPage } from './RecipeListPage';
import { setToken } from '../api/client';

const RECIPES = [
  { _id: '1', slug: 'coconut-burfi', nameEn: 'Coconut Burfi', nameTa: 'தேங்காய் பர்ஃபி', category: 'semi-solid', status: 'published' },
  { _id: '2', slug: 'dates-ladoo', nameEn: 'Dates Ladoo', nameTa: '', category: 'solid', status: 'draft' },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setToken(null);
});

function renderList() {
  setToken('t');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify(RECIPES), { status: 200 })
  ));
  render(<MemoryRouter><RecipeListPage /></MemoryRouter>);
}

it('renders one row per recipe with slug and status', async () => {
  renderList();
  expect(await screen.findByText('Coconut Burfi')).toBeInTheDocument();
  expect(screen.getByText('coconut-burfi')).toBeInTheDocument();
  expect(screen.getByText('Dates Ladoo')).toBeInTheDocument();
  // Stats row also renders "published" and "draft" labels, so allow multiple matches
  expect(screen.getAllByText('published').length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText('draft').length).toBeGreaterThanOrEqual(1);
});

it('filters by status using tab buttons', async () => {
  renderList();
  await screen.findByText('Coconut Burfi');
  await userEvent.click(screen.getByRole('tab', { name: /draft/i }));
  expect(screen.queryByText('Coconut Burfi')).not.toBeInTheDocument();
  expect(screen.getByText('Dates Ladoo')).toBeInTheDocument();
});

it('publish toggle PATCHes and flips the badge optimistically', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(RECIPES), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  setToken('t');
  render(<MemoryRouter><RecipeListPage /></MemoryRouter>);
  await screen.findByText('Dates Ladoo');
  await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
  const [url, init] = fetchMock.mock.calls[1];
  expect(url).toBe('/api/admin/recipes/2');
  expect(init.method).toBe('PATCH');
  expect(JSON.parse(init.body)).toEqual({ status: 'published' });
  // 2 recipe badges + 1 stats-row "published" label = 3 total
  expect(screen.getAllByText('published')).toHaveLength(3);
});

it('reverts the status when the PATCH fails', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(RECIPES), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'boom' }), { status: 500 }));
  vi.stubGlobal('fetch', fetchMock);
  setToken('t');
  render(<MemoryRouter><RecipeListPage /></MemoryRouter>);
  await screen.findByText('Dates Ladoo');
  await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('boom');
  expect(screen.getAllByText('draft')).toHaveLength(1);
});

it('deletes after confirm and removes the row', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(RECIPES), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  setToken('t');
  render(<MemoryRouter><RecipeListPage /></MemoryRouter>);
  await screen.findByText('Dates Ladoo');
  await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
  const [url, init] = fetchMock.mock.calls[1];
  expect(url).toBe('/api/admin/recipes/2');
  expect(init.method).toBe('DELETE');
  await waitFor(() => expect(screen.queryByText('Dates Ladoo')).not.toBeInTheDocument());
});

it('does nothing when the confirm is cancelled', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(RECIPES), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  setToken('t');
  render(<MemoryRouter><RecipeListPage /></MemoryRouter>);
  await screen.findByText('Dates Ladoo');
  await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Dates Ladoo')).toBeInTheDocument();
});
