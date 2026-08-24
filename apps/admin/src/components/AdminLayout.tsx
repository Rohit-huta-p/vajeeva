import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-[17px] h-[17px] shrink-0">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/',
    label: 'Recipes',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-[17px] h-[17px] shrink-0">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    to: '/sources',
    label: 'Sources',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-[17px] h-[17px] shrink-0">
        <path d="M12 6.5C10.5 5 8.5 4 6 4H3v14h3c2.5 0 4.5 1 6 2.5 1.5-1.5 3.5-2.5 6-2.5h3V4h-3c-2.5 0-4.5 1-6 2.5z" />
        <path d="M12 6.5v14" />
      </svg>
    ),
  },
  {
    to: '/subrecipes',
    label: 'Sub-recipes',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-[17px] h-[17px] shrink-0">
        <path d="M8 3v7a4 4 0 0 0 8 0V3" /><path d="M12 14v7" />
      </svg>
    ),
  },
  {
    to: '/users',
    label: 'Users',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-[17px] h-[17px] shrink-0">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    to: '/health-flags',
    label: 'Health Flags',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-[17px] h-[17px] shrink-0">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
  },
  {
    to: '/tags',
    label: 'Tags',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="w-[17px] h-[17px] shrink-0">
        <path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h9z" />
        <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Recipes',
  '/dashboard': 'Dashboard',
  '/sources': 'Sources',
  '/subrecipes': 'Sub-recipes',
  '/users': 'Users',
  '/health-flags': 'Health Flags',
  '/tags': 'Tags',
  '/recipes/new': 'New Recipe',
};

function pageTitle(pathname: string): string {
  if (pathname.startsWith('/recipes/') && pathname.endsWith('/edit')) return 'Edit Recipe';
  return PAGE_TITLES[pathname] ?? 'Vajeeva';
}

export function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex max-h-full bg-cream">
      <aside className="w-[240px] bg-sand border-r border-ink/20 flex flex-col shrink-0">
        <div className="flex items-center gap-2.5 px-4 py-[18px] border-b border-ink/20">
          <div className="w-8 h-8 bg-brand text-white rounded-lg flex items-center justify-center font-serif text-lg font-bold shrink-0">
            V
          </div>
          <div className="font-serif text-[15px] font-semibold text-ink leading-tight">
            Vajeeva
            <span className="block font-sans text-[10px] uppercase tracking-wider text-ink/55">Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-2 flex flex-col gap-0.5">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] transition-colors ${isActive ? 'bg-brand-bg text-brand' : 'text-ink/55 hover:bg-ink/5 hover:text-ink'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-ink/20 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-bg text-amber rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">
            AD
          </div>
          <div className="text-[13px] font-medium text-ink leading-tight">
            Admin
            <span className="block text-[10.5px] font-normal text-ink/55">Admin</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[58px] shrink-0 bg-cream border-b border-ink/20 flex items-center gap-3.5 px-6">
          <h1 className="flex-1 font-serif text-xl font-semibold text-ink">{pageTitle(pathname)}</h1>
          <div className="relative">
            <svg
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/55 pointer-events-none"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              aria-label="Search recipes"
              placeholder="Search recipes…"
              className="w-[200px] bg-bone border border-ink/20 rounded-lg pl-8 pr-3 py-[7px] text-[13px] text-ink placeholder:text-ink/55 outline-none focus:border-brand focus:bg-white"
            />
          </div>
          <Link to="/recipes/new" className="bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium">
            New Recipe
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
