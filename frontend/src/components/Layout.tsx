import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Icon, type IconName } from './icons';

const NAV_ITEMS: Array<{ to: string; label: string; icon: IconName; end?: boolean }> = [
  { to: '/', label: 'Overview', icon: 'overview', end: true },
  { to: '/fleet', label: 'Fleet & Utilization', icon: 'fleet' },
  { to: '/map', label: 'Farms & GIS Map', icon: 'map' },
  { to: '/demand', label: 'Demand & Bookings', icon: 'demand' },
  { to: '/revenue', label: 'Revenue & Finance', icon: 'revenue' },
  { to: '/vegetation', label: 'Vegetation', icon: 'vegetation' },
  { to: '/data-quality', label: 'Data Quality', icon: 'quality' },
  { to: '/recommendations', label: 'Recommendations', icon: 'recommend' },
];

function ApiStatusPill() {
  const [state, setState] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then(() => !cancelled && setState('online'))
      .catch(() => !cancelled && setState('offline'));
    return () => {
      cancelled = true;
    };
  }, []);

  const label = state === 'checking' ? 'Connecting…' : state === 'online' ? 'API connected' : 'API offline';
  return (
    <div className={`status-pill status-pill-${state}`}>
      <span className="status-dot" aria-hidden="true" />
      {label}
    </div>
  );
}

export function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            AI
          </div>
          <div>
            <p className="eyebrow">Agri Intelligence</p>
            <p className="brand-sub">Mechanization platform</p>
          </div>
        </div>
        <nav className="side-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `side-nav-link${isActive ? ' active' : ''}`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p>v2.0 · Demo mode</p>
          <p className="sidebar-footnote">Synthetic operational data — no proprietary or personal records.</p>
        </div>
      </aside>

      <div className="content-area">
        <header className="topbar">
          <div>
            <h1>Mechanization operations intelligence</h1>
            <p className="topbar-sub">Fleet, GIS, and demand analytics across 5 regions</p>
          </div>
          <ApiStatusPill />
        </header>
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
