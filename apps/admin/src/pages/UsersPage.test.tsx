import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { UsersPage } from './UsersPage';
import { setToken } from '../api/client';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); setToken(null); });

function renderUsers() {
  render(
    <MemoryRouter initialEntries={['/users']}>
      <Routes>
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id" element={<p>detail page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const DB_USERS = [
  {
    id: 'u1', email: 'aarav@example.com', name: 'Aarav Nair',
    phone: '+91 90000 12345', age: 30, gender: 'Male',
    authProviders: ['Email'], healthTags: ['Diabetes'], joinedAt: '2026-09-01',
  },
];

// Stub the global fetch used by the api client with a minimal ok Response.
function stubFetch(data: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => data })));
}

it('renders the users table headers', () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  renderUsers();
  expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
  for (const col of ['User', 'Auth', 'Health Profile', 'Joined']) {
    expect(screen.getAllByText(col).length).toBeGreaterThanOrEqual(1);
  }
});

it('shows an empty state (no placeholder users) when the DB has none', async () => {
  stubFetch([]);
  renderUsers();
  expect(await screen.findByText('No users yet.')).toBeInTheDocument();
  // The old hardcoded placeholder accounts must never show.
  expect(screen.queryByText('Priya Venkatesh')).not.toBeInTheDocument();
});

it('renders the accounts returned by the API', async () => {
  stubFetch(DB_USERS);
  renderUsers();
  expect(await screen.findByText('Aarav Nair')).toBeInTheDocument();
  expect(screen.getByText('aarav@example.com')).toBeInTheDocument();
});

it('is read-only: no edit, delete, or new buttons', () => {
  stubFetch([]);
  renderUsers();
  expect(screen.queryByRole('button', { name: /edit|delete|new/i })).not.toBeInTheDocument();
});

it('navigates to the per-patient detail when a row is clicked', async () => {
  stubFetch(DB_USERS);
  renderUsers();
  await userEvent.click(await screen.findByText('Aarav Nair'));
  expect(await screen.findByText('detail page')).toBeInTheDocument();
});
