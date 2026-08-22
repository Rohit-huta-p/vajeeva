import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface User {
  id: string;
  name: string;
  email: string;
  authProviders: string[];
  healthTags: string[];
  joinedAt: string;
}

// Fallback shown while /api/admin/users endpoint is not yet implemented
const PLACEHOLDER_USERS: User[] = [
  {
    id: '1', name: 'Priya Venkatesh', email: 'priya@example.com',
    authProviders: ['Google'], healthTags: ['Diabetes', 'Lactose intolerant'],
    joinedAt: '2026-07-12',
  },
  {
    id: '2', name: 'Karthik Rajan', email: 'karthik@example.com',
    authProviders: ['Email', 'Phone'], healthTags: [],
    joinedAt: '2026-07-28',
  },
  {
    id: '3', name: 'Meena Subramanian', email: 'meena@example.com',
    authProviders: ['Email'], healthTags: ['Pregnant'],
    joinedAt: '2026-08-05',
  },
];

// No blue theme token — raw hex for Google
const PROVIDER_COLORS: Record<string, string> = {
  Google: 'bg-[#E8F0FA] text-[#3B6BA0]',
  Email: 'bg-brand-bg text-brand',
  Phone: 'bg-amber-bg text-amber',
};

export function UsersPage() {
  const [users, setUsers] = useState<User[]>(PLACEHOLDER_USERS);

  // Load real users; normalize the server shape (accounts may lack name /
  // health tags, and joinedAt arrives as an ISO timestamp).
  useEffect(() => {
    api<Partial<User>[]>('/api/admin/users')
      .then(list => setUsers(list.map(u => ({
        id: u.id ?? '',
        name: u.name || (u.email ? u.email.split('@')[0] : '—'),
        email: u.email ?? '—',
        authProviders: u.authProviders ?? [],
        healthTags: u.healthTags ?? (u as any).healthProfile ?? [],
        joinedAt: u.joinedAt ? new Date(u.joinedAt).toISOString().slice(0, 10) : '—',
      }))))
      .catch(() => { /* endpoint unreachable — placeholder stays */ });
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-ink">Users</h1>
        <span className="text-sm text-ink/50">{users.length} users</span>
      </div>

      <div className="border border-sand rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_2fr_1fr_2fr_1fr] bg-bone px-4 py-3">
          {['Name', 'Email', 'Auth', 'Health Profile', 'Joined'].map(h => (
            <span key={h} className="text-xs font-mono text-ink/50 uppercase tracking-wider">{h}</span>
          ))}
        </div>
        {users.map((user, i) => (
          <div
            key={user.id}
            className={`grid grid-cols-[2fr_2fr_1fr_2fr_1fr] px-4 py-3 items-center ${i % 2 === 1 ? 'bg-white' : ''}`}
          >
            <span className="text-sm font-medium text-ink">{user.name}</span>
            <span className="text-sm text-ink/70">{user.email}</span>
            <div className="flex flex-wrap gap-1">
              {user.authProviders.map(p => (
                <span key={p} className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROVIDER_COLORS[p] ?? 'bg-bone text-ink/70'}`}>
                  {p}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {user.healthTags.length === 0
                ? <span className="text-xs text-ink/50">—</span>
                : user.healthTags.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-amber-bg text-clay">{t}</span>
                  ))
              }
            </div>
            <span className="text-xs text-ink/50">{user.joinedAt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
