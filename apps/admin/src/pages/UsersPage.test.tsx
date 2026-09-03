import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { UsersPage } from './UsersPage';
import { setToken } from '../api/client';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); setToken(null); });

// No fetch stub → the /api/admin/users call rejects and the placeholder users stay.
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

it('renders the users table with headers and rows', () => {
  renderUsers();
  expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
  for (const col of ['User', 'Auth', 'Health Profile', 'Joined']) {
    expect(screen.getAllByText(col).length).toBeGreaterThanOrEqual(1);
  }
  expect(screen.getByText('Priya Venkatesh')).toBeInTheDocument();
  expect(screen.getByText('priya@example.com')).toBeInTheDocument();
});

it('is read-only: no edit, delete, or new buttons', () => {
  renderUsers();
  expect(screen.queryByRole('button', { name: /edit|delete|new/i })).not.toBeInTheDocument();
});

it('shows a dash for a user without health tags', () => {
  renderUsers();
  // 'Diabetes' appears on more than one placeholder user.
  expect(screen.getAllByText('Diabetes').length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
});

it('navigates to the per-patient detail when a row is clicked', async () => {
  renderUsers();
  await userEvent.click(screen.getByText('Priya Venkatesh'));
  expect(await screen.findByText('detail page')).toBeInTheDocument();
});
