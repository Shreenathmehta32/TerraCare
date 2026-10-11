import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, RadioTower, ShieldAlert, FlaskConical,
  GitCompare, FileCheck, ShieldCheck, Settings, ChevronLeft, ChevronRight,
  Sun, Moon, Bell, Search, LogOut, User, RefreshCw, X, Leaf, Menu,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { formatDistanceToNow } from 'date-fns';
import { KPI_DATA } from '@/services/mock/fixtures';

interface NavItem {
  label: string;
  route: string;
  icon: React.FC<{ size?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', route: '/dashboard', icon: LayoutDashboard },
  { label: 'GIS Intelligence', route: '/map', icon: Map },
  { label: 'Sensor Registry', route: '/sensors', icon: RadioTower },
  { label: 'Integrity Incidents', route: '/incidents', icon: ShieldAlert },
  { label: 'Scenario Lab', route: '/scenario-lab', icon: FlaskConical },
  { label: 'Decision Delta', route: '/decision-delta', icon: GitCompare },
  { label: 'Evidence Center', route: '/evidence', icon: FileCheck },
  { label: 'SOC Integration', route: '/soc', icon: ShieldCheck },
  { label: 'Settings', route: '/settings', icon: Settings },
];

export default function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const lastRefresh = formatDistanceToNow(new Date(KPI_DATA.last_refresh), { addSuffix: true });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (q.startsWith('eco-') || q.startsWith('inc-') || q.startsWith('evd-')) {
      if (q.startsWith('eco-')) navigate(`/sensors?search=${q.toUpperCase()}`);
      else if (q.startsWith('inc-')) navigate(`/incidents?search=${q.toUpperCase()}`);
      else navigate(`/evidence?search=${q.toUpperCase()}`);
    } else {
      navigate(`/sensors?search=${q}`);
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setMobileOpen(false)}
          style={{ zIndex: 150 }}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Main navigation"
        style={{
          width: collapsed ? 76 : 260,
          minWidth: collapsed ? 76 : 260,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s ease, min-width 0.25s ease',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 100,
          boxShadow: '2px 0 16px color-mix(in srgb, var(--shadow-dark) 40%, transparent)',
          transform: mobileOpen ? 'translateX(0)' : undefined,
        }}
        className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Logo */}
        <div style={{
          height: 72, display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '0 22px' : '0 20px',
          borderBottom: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-raised-sm)',
          }}>
            <Leaf size={18} color="#fff" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1 }}>
                TerraCare
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Environmental Integrity
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.route}
                to={item.route}
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: collapsed ? '10px 22px' : '10px 20px',
                  margin: '2px 8px',
                  borderRadius: 'var(--r-sm)',
                  textDecoration: 'none',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-soft)' : 'transparent',
                  boxShadow: isActive ? 'var(--shadow-raised-sm)' : 'none',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.8125rem',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                })}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="btn-ghost btn"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            margin: '8px',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: 'var(--r-sm)',
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span style={{ fontSize: '0.75rem' }}>Collapse</span>}
        </button>
      </aside>

      {/* Main content area */}
      <div style={{
        flex: 1,
        marginLeft: collapsed ? 76 : 260,
        transition: 'margin-left 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        {/* Header */}
        <header style={{
          height: 72, background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 12,
          position: 'sticky', top: 0, zIndex: 90,
          boxShadow: '0 2px 12px color-mix(in srgb, var(--shadow-dark) 30%, transparent)',
        }}>
          {/* Mobile hamburger */}
          <button
            className="btn-ghost btn"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Open navigation"
            style={{ display: 'none', padding: 8 }}
            id="mobile-menu-btn"
          >
            <Menu size={18} />
          </button>

          {/* Environment selector */}
          <div className="card-sm" style={{ padding: '5px 12px' }}>
            <select
              className="input"
              style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, width: 'auto', fontSize: '0.8rem' }}
              aria-label="Select monitoring area"
              defaultValue="metro-a"
            >
              <option value="metro-a">Metro Region A</option>
              <option value="metro-b">Metro Region B</option>
              <option value="suburb-n">North Suburbs</option>
            </select>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Data freshness */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            <RefreshCw size={13} />
            <span>Updated {lastRefresh}</span>
            <span className="badge badge-info" style={{ marginLeft: 4 }}>SYNTHETIC DATA</span>
          </div>

          {/* Global search */}
          <div style={{ position: 'relative' }}>
            {searchOpen ? (
              <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  autoFocus
                  className="input"
                  style={{ width: 220 }}
                  placeholder="Sensor ID, Incident ID, ward…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  aria-label="Global search"
                />
                <button type="button" className="btn-ghost btn" onClick={() => setSearchOpen(false)} style={{ padding: 7 }} aria-label="Close search">
                  <X size={15} />
                </button>
              </form>
            ) : (
              <button
                className="btn-ghost btn"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                style={{ padding: 8 }}
              >
                <Search size={16} />
              </button>
            )}
          </div>

          {/* Notifications placeholder */}
          <button className="btn-ghost btn" aria-label="Notifications" style={{ padding: 8, position: 'relative' }}>
            <Bell size={16} />
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--clr-critical)',
            }} aria-hidden />
          </button>

          {/* Theme toggle */}
          <button
            className="btn-ghost btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            style={{ padding: 8 }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 'var(--r-sm)', background: 'var(--surface-inset)', boxShadow: 'var(--shadow-inset)', cursor: 'pointer' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={14} color="var(--accent)" />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>Analyst</span>
            <LogOut size={13} color="var(--text-secondary)" />
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Mobile-specific styles injected via style tag */}
      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
          .sidebar {
            transform: translateX(-100%);
            z-index: 151;
          }
          .sidebar.mobile-open {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </div>
  );
}
