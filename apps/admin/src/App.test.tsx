import { afterEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import { setToken } from './api/client';

afterEach(() => {
  vi.unstubAllGlobals();
  setToken(null);
});

it('redirects an unauthenticated visitor to login', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: 'No refresh token' }), { status: 401 })
  ));
  render(<App />);
  expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
