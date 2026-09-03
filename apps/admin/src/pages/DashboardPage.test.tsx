import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { setToken } from '../api/client';

const RECIPES = [
  { _id: '1', nameEn: 'Paavakkai Pitla', category: 'solid', status: 'published',
    updatedAt: new Date(Date.now() - 2 * 3_600_000).toISOString() },
  { _id: '2', nameEn: 'Methi Rasam', category: 'liquid', status: 'draft',
    updatedAt: new Date(Date.now() - 4 * 3_600_000).toISOString() },
  { _id: '3', nameEn: 'Coconut Burfi', category: 'semi-solid', status: 'published',
    updatedAt: new Date(Date.now() - 26 * 3_600_000).toISOString() },
];

const STATS = {
  users: { total: 5, active7d: 2, active30d: 3 },
  saves: 8,
  makes: 5,
  savedNotMade: 4,
  avgRating: 4.3,
  makesByWeek: Array.from({ length: 8 }, (_, i) => ({ week: `2026-08-0${i + 1}`, count: i })),
  mostCooked: [
    { slug: 'coconut-burfi', nameEn: 'Coconut Burfi', makes: 3 },
    { slug: 'methi-rasam', nameEn: 'Methi Rasam', makes: 2 },
  ],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setToken(null);
});

function renderDash() {
  setToken('t');
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    const body = String(url).includes('/api/admin/stats') ? STATS : RECIPES;
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  }));
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
}

it('renders engagement KPI cards from /api/admin/stats', async () => {
  renderDash();
  expect(await screen.findByText('Active (30d)')).toBeInTheDocument();
  expect(screen.getByText('Makes logged')).toBeInTheDocument();
  expect(screen.getByText('Avg rating')).toBeInTheDocument();
  expect(screen.getByText('4.3')).toBeInTheDocument();     // avg rating value (unique)
});

it('renders makes-over-time and most-cooked panels', async () => {
  renderDash();
  await screen.findByText('Active (30d)');
  expect(screen.getByText('Makes over time')).toBeInTheDocument();
  expect(screen.getByText('Most cooked')).toBeInTheDocument();
  expect(screen.getByText('Saves vs makes')).toBeInTheDocument();
  // "Coconut Burfi" appears in both Most-cooked and Recent activity.
  expect(screen.getAllByText('Coconut Burfi').length).toBeGreaterThan(0);
});

it('still renders the library content stats', async () => {
  renderDash();
  await screen.findByText('Active (30d)');
  expect(screen.getByTestId('total-recipes-count')).toHaveTextContent('3');
  expect(screen.getByText(/2 published · 1 drafts/)).toBeInTheDocument();
  expect(screen.getByText('By category')).toBeInTheDocument();
  for (const cat of ['Solid', 'Liquid', 'Semi-solid']) {
    expect(screen.getByText(cat)).toBeInTheDocument();
  }
});
