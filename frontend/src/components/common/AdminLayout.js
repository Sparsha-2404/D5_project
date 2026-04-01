import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, ShoppingBag, Users, CalendarCheck, LogOut, Building2, ArrowLeft, Star, Navigation, HardHat } from 'lucide-react';
import './AdminLayout.css';
import logo from '../../assets/D5logo.jpeg';

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
          <img src={logo} alt="Logo" height={36} />
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
