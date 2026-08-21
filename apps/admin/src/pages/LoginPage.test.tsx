import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { getToken, setToken } from '../api/client';

const adminJwt = 'h.' + btoa(JSON.stringify({ userId: 'u1', role: 'admin' })) + '.s';
const userJwt = 'h.' + btoa(JSON.stringify({ userId: 'u2', role: 'user' })) + '.s';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setToken(null);
});

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>home</p>} />
      </Routes>
    </MemoryRouter>
  );
}

async function submit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText(/email/i), email);
  await userEvent.type(screen.getByLabelText(/password/i), password);
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
}

it('stores token and navigates home on admin login', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ accessToken: adminJwt }), { status: 200 })
  ));
  renderLogin();
  await submit('admin@test.com', 'password123');
  expect(await screen.findByText('home')).toBeInTheDocument();
  expect(getToken()).toBe(adminJwt);
});

it('rejects non-admin login', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ accessToken: userJwt }), { status: 200 })
  ));
  renderLogin();
  await submit('user@test.com', 'password123');
  expect(await screen.findByRole('alert')).toHaveTextContent('Admins only');
  expect(getToken()).toBeNull();
});

it('shows error on bad credentials', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })
  ));
  renderLogin();
  await submit('admin@test.com', 'wrong-password');
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
});
