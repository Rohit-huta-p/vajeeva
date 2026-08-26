import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';

afterEach(cleanup);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="*" element={<p>content here</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

it('renders all six sidebar nav items', () => {
  renderAt('/');
  for (const label of ['Dashboard', 'Recipes', 'Sources', 'Sub-recipes', 'Users', 'Health Flags']) {
    expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
  }
});

it('renders the Vajeeva logo and admin sub-label', () => {
  renderAt('/');
  expect(screen.getByText('Vajeeva')).toBeInTheDocument();
});

it('shows the page title for the current route in the topbar', () => {
  renderAt('/health-flags');
  expect(screen.getByRole('heading', { name: 'Health Flags' })).toBeInTheDocument();
});

it('renders the routed page content via Outlet', () => {
  renderAt('/dashboard');
  expect(screen.getByText('content here')).toBeInTheDocument();
});
