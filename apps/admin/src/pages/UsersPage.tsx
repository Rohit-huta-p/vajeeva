import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

interface User {
  id:            string;
  name:          string;
  email:         string;
  phone?:        string;
  age?:          number;
  gender?:       string;
  authProviders: string[];
  healthTags:    string[];
  joinedAt:      string;
}

const PLACEHOLDER_USERS: User[] = [
  {
    id: '1', name: 'Priya Venkatesh', email: 'priya@example.com',
    phone: '+91 98400 11234', age: 34, gender: 'Female',
    authProviders: ['Google'],
    healthTags: ['Diabetes', 'Lactose intolerant'],
    joinedAt: '2026-07-12',
  },
  {
    id: '2', name: 'Karthik Rajan', email: 'karthik@example.com',
    phone: '+91 99401 55678', age: 41, gender: 'Male',
    authProviders: ['Email', 'Phone'],
    healthTags: [],
    joinedAt: '2026-07-28',
  },
  {
    id: '3', name: 'Meena Subramanian', email: 'meena@example.com',
    phone: '+91 73053 22901', age: 29, gender: 'Female',
    authProviders: ['Email'],
    healthTags: ['Pregnant'],
    joinedAt: '2026-08-05',
  },
  {
    id: '4', name: 'Suresh Kumar', email: 'suresh@example.com',
    phone: '+91 94440 87321', age: 58, gender: 'Male',
    authProviders: ['Google'],
    healthTags: ['Cardiac', 'Sedentary'],
    joinedAt: '2026-08-10',
  },
  {
    id: '5', name: 'Ananya Krishnan', email: 'ananya@example.com',
    phone: '+91 81220 44567', age: 25, gender: 'Female',
    authProviders: ['Phone'],
    healthTags: ['Lactating'],
    joinedAt: '2026-08-14',
  },
  {
    id: '6', name: 'Ravi Shankar', email: 'ravi@example.com',
    phone: '+91 99000 34512', age: 47, gender: 'Male',
    authProviders: ['Email'],
    healthTags: ['Obesity'],
    joinedAt: '2026-08-18',
  },
  {
    id: '7', name: 'Lakshmi Iyer', email: 'lakshmi@example.com',
    phone: '+91 97890 66789', age: 63, gender: 'Female',
    authProviders: ['Google', 'Email'],
    healthTags: ['Elderly / Frail', 'Diabetes'],
    joinedAt: '2026-08-21',
  },
];

const PROVIDER_COLORS: Record<string, string> = {
  Google: 'bg-sky-bg text-sky',
  Email:  'bg-brand-bg text-brand',
  Phone:  'bg-amber-bg text-amber',
};

const AVATAR_COLORS = [
  'bg-brand-bg text-brand',
  'bg-sky-bg text-sky',
  'bg-amber-bg text-amber',
  'bg-clay-bg text-clay',
  'bg-[#F0EBF8] text-[#7B5EA7]',
];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>(PLACEHOLDER_USERS);
  const navigate = useNavigate();

  useEffect(() => {
    api<Partial<User>[]>('/api/admin/users')
      .then(list => setUsers(list.map(u => ({
        id:            u.id ?? '',
        name:          u.name || (u.email ? u.email.split('@')[0] : '—'),
        email:         u.email ?? '—',
        phone:         u.phone,
        age:           u.age,
        gender:        u.gender,
        authProviders: u.authProviders ?? [],
        healthTags:    u.healthTags ?? (u as any).healthProfile ?? [],
        joinedAt:      u.joinedAt ? new Date(u.joinedAt).toISOString().slice(0, 10) : '—',
      }))))
      .catch(() => { /* endpoint unreachable — placeholder stays */ });
  }, []);

  const HEADERS = ['User', 'Phone', 'Age · Gender', 'Auth', 'Health Profile', 'Joined'];

  return (
    <div className="p-5 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif text-[22px] font-light text-ink tracking-tight">Users</h1>
          <p className="text-[12.5px] text-ink/45 mt-0.5">{users.length} registered accounts</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-ink/[0.11]">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="bg-sand">
              {HEADERS.map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10.5px] font-[800] uppercase tracking-[0.07em] text-ink/45 whitespace-nowrap border-b border-ink/[0.11]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr
                key={user.id}
                onClick={() => navigate(`/users/${user.id}`)}
                className="border-b border-ink/[0.08] last:border-0 hover:bg-bone/50 transition-colors cursor-pointer"
              >
                {/* User */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {initials(user.name)}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-ink leading-tight">{user.name}</div>
                      <div className="text-[11.5px] text-ink/45">{user.email}</div>
                    </div>
                  </div>
                </td>

                {/* Phone */}
                <td className="px-4 py-3 text-[12.5px] text-ink/65 whitespace-nowrap">
                  {user.phone ?? '—'}
                </td>

                {/* Age · Gender */}
                <td className="px-4 py-3 text-[12.5px] text-ink/65 whitespace-nowrap">
                  {user.age != null && user.gender
                    ? `${user.age} · ${user.gender}`
                    : user.age != null
                      ? String(user.age)
                      : '—'}
                </td>

                {/* Auth providers */}
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {user.authProviders.map(p => (
                      <span key={p} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PROVIDER_COLORS[p] ?? 'bg-bone text-ink/55'}`}>
                        {p}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Health profile */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                    {user.healthTags.length === 0
                      ? <span className="text-[12px] text-ink/35">—</span>
                      : user.healthTags.map(t => (
                          <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-clay-bg text-clay">
                            {t}
                          </span>
                        ))
                    }
                  </div>
                </td>

                {/* Joined */}
                <td className="px-4 py-3 text-[12px] text-ink/40 whitespace-nowrap">
                  {user.joinedAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
