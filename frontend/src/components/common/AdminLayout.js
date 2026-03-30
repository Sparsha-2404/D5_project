import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, ShoppingBag, Users, CalendarCheck, LogOut, Building2, ArrowLeft, Star, Navigation, HardHat } from 'lucide-react';
import './AdminLayout.css';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/orders', icon: Package, label: 'Orders' },
  { to: '/admin/services', icon: ShoppingBag, label: 'Services' },
  { to: '/admin/users', icon: Users, label: 'Users & Staff' },
  { to: '/admin/facilities', icon: CalendarCheck, label: 'Facilities' },
  { to: '/admin/tracking', icon: Navigation, label: 'Live Tracking' },
  { to: '/admin/reviews', icon: Star, label: 'Reviews' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="al-root">
      <aside className="al-sidebar">
        <div className="al-logo">
          <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="12" fill="white"/>
            <path d="M22 18 L22 82 L48 82 C70 82 80 68 80 50 C80 32 70 18 48 18 Z" fill="#111111"/>
            <circle cx="50" cy="50" r="24" fill="#8F50FF"/>
            <circle cx="50" cy="50" r="19" stroke="white" strokeWidth="2.5" fill="none"/>
            <text x="50" y="59" textAnchor="middle" fill="white" fontSize="20" fontWeight="700" fontFamily="Georgia,serif">5</text>
          </svg>
          <div><div className="al-logo-name">D5</div><div className="al-logo-sub">Admin Panel</div></div>
        </div>
        <nav className="al-nav">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `al-nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={17} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="al-footer">
          <button className="al-back" onClick={() => navigate('/')}><ArrowLeft size={14} /> Back to App</button>
          <div className="al-user">
            <div className="al-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div><div className="al-uname">{user?.name}</div><div className="al-urole">Administrator</div></div>
          </div>
          <button className="al-logout" onClick={() => { logout(); navigate('/login'); }}><LogOut size={15} /> Logout</button>
        </div>
      </aside>
      <main className="al-main"><Outlet /></main>
    </div>
  );
}
