import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getToken, tryRefresh } from './api/client';

export function RequireAuth() {
  const [state, setState] = useState<'checking' | 'ok' | 'anon'>(
    getToken() ? 'ok' : 'checking'
  );

  useEffect(() => {
    if (state !== 'checking') return;
    tryRefresh().then(ok => setState(ok ? 'ok' : 'anon'));
  }, [state]);

  if (state === 'checking') return <p className="p-6 text-ink/55">Loading…</p>;
  if (state === 'anon') return <Navigate to="/login" replace />;
  return <Outlet />;
}
