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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setToken(null);
});

function renderDash() {
  setToken('t');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify(RECIPES), { status: 200 })
  ));
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
}

it('renders the total recipes stat card', async () => {
  renderDash();
  expect(await screen.findByText('Total Recipes')).toBeInTheDocument();
  expect(screen.getByTestId('total-recipes-count')).toHaveTextContent('3');
  expect(screen.getByText(/2 published · 1 drafts/)).toBeInTheDocument();
});

it('renders a category bar for each recipe category', async () => {
  renderDash();
  await screen.findByText('Total Recipes');
  expect(screen.getByText('By Category')).toBeInTheDocument();
  for (const cat of ['Solid', 'Liquid', 'Semi-solid']) {
    expect(screen.getByText(cat)).toBeInTheDocument();
  }
});

it('renders the recent edits timeline with recipe names', async () => {
  renderDash();
  await screen.findByText('Total Recipes');
  expect(screen.getByText('Recent Edits')).toBeInTheDocument();
  expect(screen.getByText('Paavakkai Pitla')).toBeInTheDocument();
});
