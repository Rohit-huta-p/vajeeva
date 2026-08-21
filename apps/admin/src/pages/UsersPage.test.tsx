import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UsersPage } from './UsersPage';

afterEach(cleanup);

it('renders the users table with header columns and rows', () => {
  render(<MemoryRouter><UsersPage /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
  // 'Email' also appears as an auth-provider chip, so allow multiple matches
  for (const col of ['Name', 'Email', 'Auth', 'Health Profile', 'Joined']) {
    expect(screen.getAllByText(col).length).toBeGreaterThanOrEqual(1);
  }
  expect(screen.getByText('Priya Venkatesh')).toBeInTheDocument();
  expect(screen.getByText('priya@example.com')).toBeInTheDocument();
});

it('is read-only: no edit, delete, or new buttons', () => {
  render(<MemoryRouter><UsersPage /></MemoryRouter>);
  expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /new/i })).not.toBeInTheDocument();
});

it('shows a dash for users without health tags', () => {
  render(<MemoryRouter><UsersPage /></MemoryRouter>);
  expect(screen.getByText('Diabetes')).toBeInTheDocument();
  expect(screen.getByText('—')).toBeInTheDocument();
});
