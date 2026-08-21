import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken, tokenRole } from '../api/client';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setError('Invalid credentials');
      return;
    }
    const body = await res.json();
    setToken(body.accessToken);
    if (tokenRole() !== 'admin') {
      setToken(null);
      setError('Admins only');
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <form onSubmit={onSubmit} className="bg-white border border-ink/20 rounded-lg p-8 w-80 space-y-4">
        <h1 className="font-serif text-xl font-semibold text-ink">Vajeeva Admin</h1>
        {error && <p role="alert" className="text-clay text-sm">{error}</p>}
        <label className="block text-xs font-semibold uppercase text-ink/55">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
          />
        </label>
        <label className="block text-xs font-semibold uppercase text-ink/55">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
          />
        </label>
        <button type="submit" className="w-full bg-brand text-white rounded-lg py-2 text-sm font-medium">
          Sign in
        </button>
      </form>
    </main>
  );
}
