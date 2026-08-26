import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useSearchParams } from 'react-router-dom';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        icon: (
          <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 15 15" className="w-[15px] h-[15px] shrink-0">
            <rect x="1.5" y="1.5" width="5" height="5" rx="1" /><rect x="8.5" y="1.5" width="5" height="5" rx="1" />
            <rect x="1.5" y="8.5" width="5" height="5" rx="1" /><rect x="8.5" y="8.5" width="5" height="5" rx="1" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Content',
    items: [
      {
        to: '/',
        label: 'Recipes',
        icon: (
          <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 15 15" className="w-[15px] h-[15px] shrink-0">
            <rect x="2.5" y="1.5" width="10" height="12" rx="1.5" />
            <line x1="5" y1="5" x2="10" y2="5" strokeLinecap="round" />
            <line x1="5" y1="7.5" x2="10" y2="7.5" strokeLinecap="round" />
            <line x1="5" y1="10" x2="8" y2="10" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        to: '/sources',
        label: 'Sources',
        icon: (
          <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 15 15" className="w-[15px] h-[15px] shrink-0">
            <path d="M3.5 2C3.22 2 3 2.22 3 2.5V12.5L7.5 10L12 12.5V2.5C12 2.22 11.78 2 11.5 2H3.5Z" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        to: '/subrecipes',
        label: 'Sub-recipes',
        icon: (
          <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 15 15" className="w-[15px] h-[15px] shrink-0">
            <rect x="2" y="5" width="11" height="4" rx="1.5" />
            <path d="M5 5V4C5 3.17 5.67 2.5 6.5 2.5H8.5C9.33 2.5 10 3.17 10 4V5" strokeLinecap="round" />
            <line x1="4.5" y1="11.5" x2="10.5" y2="11.5" strokeLinecap="round" />
            <line x1="7.5" y1="9" x2="7.5" y2="13" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Configuration',
    items: [
      {
        to: '/health-flags',
        label: 'Health Flags',
        icon: (
          <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 15 15" className="w-[15px] h-[15px] shrink-0">
            <path d="M7.5 12.5C7.5 12.5 2 8.8 2 5.5C2 3.84 3.34 2.5 5 2.5C5.95 2.5 6.8 2.92 7.5 3.65C8.2 2.92 9.05 2.5 10 2.5C11.66 2.5 13 3.84 13 5.5C13 8.8 7.5 12.5 7.5 12.5Z" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        to: '/tags',
        label: 'Discovery Tags',
        icon: (
          <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 15 15" className="w-[15px] h-[15px] shrink-0">
            <path d="M8.5 2H13V6.5L7.5 12C7 12.5 6.3 12.5 5.8 12L3 9.2C2.5 8.7 2.5 8 3 7.5L8.5 2Z" strokeLinejoin="round" />
            <circle cx="10.5" cy="4.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'People',
    items: [
      {
        to: '/users',
        label: 'Users',
        icon: (
          <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 15 15" className="w-[15px] h-[15px] shrink-0">
            <circle cx="6" cy="5" r="2.5" />
            <path d="M1.5 13C1.5 10.5 3.5 9 6 9C8.5 9 10.5 10.5 10.5 13" strokeLinecap="round" />
            <path d="M10.5 3.5C11.8 3.5 13 4.6 13 6C13 7.4 11.8 8.5 10.5 8.5" strokeLinecap="round" />
            <path d="M12 10C13.5 10.5 14 11.5 14 13" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/':              'Recipes',
  '/dashboard':     'Dashboard',
  '/sources':       'Sources',
  '/subrecipes':    'Sub-recipes',
  '/users':         'Users',
  '/health-flags':  'Health Flags',
  '/tags':          'Discovery Tags',
  '/recipes/new':   'New Recipe',
};

function pageTitle(pathname: string): string {
  if (pathname.startsWith('/recipes/') && pathname.endsWith('/edit')) return 'Edit Recipe';
  return PAGE_TITLES[pathname] ?? 'Vajeeva';
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const showSearch = pathname === '/';

  function handleSearchChange(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('q', value); else next.delete('q');
    setSearchParams(next, { replace: true });
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-full bg-cream overflow-hidden">

      {/* ── Mobile scrim ──────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/40 z-20 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* ── Sidebar ───────────────────────── */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 flex flex-col',
          'w-[216px] bg-sand border-r border-ink/[0.11]',
          'transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
          'md:relative md:translate-x-0 md:shadow-none md:shrink-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-[18px] border-b border-ink/[0.11] shrink-0">
          <div className="w-[30px] h-[30px] rounded-[7px] bg-brand flex items-center justify-center text-white font-serif text-[17px] font-semibold shrink-0">
            V
          </div>
          <div>
            <div className="font-serif text-[14.5px] font-semibold text-ink leading-tight tracking-tight">Vajeeva</div>
            <div className="text-[10px] font-bold text-ink/50 uppercase tracking-[0.07em]">Admin</div>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="px-2 mb-1">
              <span className="block px-2 pt-3 pb-1 text-[9.5px] font-bold uppercase tracking-[0.09em] text-ink/40">
                {group.label}
              </span>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-2 px-2.5 py-[7.5px] rounded-[10px] text-[13px] font-medium transition-colors w-full',
                      isActive
                        ? 'bg-brand-bg text-brand'
                        : 'text-ink/55 hover:bg-ink/[0.07] hover:text-ink',
                    ].join(' ')
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-ink/[0.11] flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-[11px] font-bold shrink-0">
            AN
          </div>
          <div>
            <div className="text-[12.5px] font-medium text-ink leading-tight">Anand R.</div>
            <div className="text-[10.5px] text-ink/50">Administrator</div>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-[58px] shrink-0 bg-cream border-b border-ink/[0.11] flex items-center gap-2.5 px-4 md:px-6">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex items-center justify-center w-9 h-9 -ml-1 rounded-lg text-ink hover:bg-bone transition-colors shrink-0"
          >
            <svg viewBox="0 0 18 18" fill="none" className="w-[18px] h-[18px]">
              <line x1="2" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="2" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>

          <h1 className="flex-1 font-serif text-[19px] font-light text-ink tracking-tight truncate">
            {pageTitle(pathname)}
          </h1>

          {showSearch && (
            <div className="relative">
              <svg
                fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 14 14"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/40 pointer-events-none"
              >
                <circle cx="6" cy="6" r="4" /><line x1="9" y1="9" x2="12.5" y2="12.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                aria-label="Search recipes"
                placeholder="Search recipes…"
                value={q}
                onChange={e => handleSearchChange(e.target.value)}
                className="w-[200px] sm:w-[240px] bg-bone border border-ink/[0.11] rounded-full pl-8 pr-3 py-[7px] text-[13px] text-ink placeholder:text-ink/40"
              />
            </div>
          )}

          <Link
            to="/recipes/new"
            className="shrink-0 bg-brand text-white rounded-[10px] px-3.5 py-[7px] text-[12.5px] font-semibold hover:opacity-90 transition-opacity"
          >
            + New Recipe
          </Link>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
