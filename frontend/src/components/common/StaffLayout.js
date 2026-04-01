import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotif } from '../../context/NotifContext';
import {
  ClipboardList, CheckSquare, Bell, User,
  LogOut, Building2, Menu, X, ChevronRight, TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import './StaffLayout.css';
import logo from '../../assets/D5logo.jpeg';

const navItems = [
  { to: '/staff', icon: ClipboardList, label: 'Active Tasks', end: true, desc: 'Your assigned work' },
  { to: '/staff/completed', icon: CheckSquare, label: 'Completed', desc: 'Finished tasks' },
  { to: '/staff/stats', icon: TrendingUp, label: 'My Stats', desc: 'Performance overview' },
  { to: '/staff/notifications', icon: Bell, label: 'Notifications', desc: 'Alerts & updates' },
  { to: '/staff/profile', icon: User, label: 'Profile', desc: 'Account settings' },
];

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const { unread } = useNotif();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getTitle = () => {
    const path = location.pathname;
    if (path === '/staff') return 'Active Tasks';
    if (path.includes('completed')) return 'Completed Tasks';
    if (path.includes('stats')) return 'My Performance';
    if (path.includes('notifications')) return 'Notifications';
    if (path.includes('profile')) return 'My Profile';
    return 'Staff Portal';
  };

  return (
    <div className="staff-layout">
      {/* Sidebar */}
      <aside className={`staff-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="staff-logo">
          <img src={logo} alt="Logo" height={36} />
          <div>
            <div className="staff-logo-name">D5</div>
            <div className="staff-logo-sub">Staff Portal</div>
          </div>
        </div>

        {/* Staff card */}
        <div className="staff-user-card">
          <div className="staff-avatar-lg">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="staff-user-details">
            <div className="staff-user-name">{user?.name}</div>
            <div className="staff-user-role">
              <span className="staff-online-dot" />
              Service Staff
            </div>
          </div>
        </div>

        <nav className="staff-nav">
          {navItems.map(({ to, icon: Icon, label, desc, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `staff-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <div className="staff-nav-icon"><Icon size={18} /></div>
              <div className="staff-nav-text">
                <span className="staff-nav-label">{label}</span>
                <span className="staff-nav-desc">{desc}</span>
              </div>
              {label === 'Notifications' && unread > 0 && (
                <span className="staff-nav-badge">{unread > 9 ? '9+' : unread}</span>
              )}
              <ChevronRight size={14} className="staff-nav-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="staff-sidebar-footer">
          <button className="staff-logout-btn" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="staff-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="staff-main">
        {/* Top bar */}
        <header className="staff-topbar">
          <button className="staff-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="staff-topbar-title">{getTitle()}</span>
          <button className="staff-notif-topbar" onClick={() => navigate('/staff/notifications')}>
            <Bell size={20} />
            {unread > 0 && <span className="staff-topbar-badge">{unread}</span>}
          </button>
        </header>

        {/* Desktop header strip */}
        <div className="staff-desktop-strip">
          <span className="sds-greeting">Welcome back, {user?.name?.split(' ')[0]} 👋</span>
          <button className="staff-notif-topbar" onClick={() => navigate('/staff/notifications')}>
            <Bell size={18} />
            {unread > 0 && <span className="staff-topbar-badge">{unread}</span>}
          </button>
        </div>

        <main className="staff-content"><Outlet /></main>
      </div>
    </div>
  );
}
