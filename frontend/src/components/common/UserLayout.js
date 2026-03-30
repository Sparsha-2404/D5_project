import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotif } from '../../context/NotifContext';
import { Home, ShoppingBag, Package, CalendarCheck, User, LogOut, ShoppingBasket, Menu, X, Wallet, Bell, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import './UserLayout.css';
import logo from '../../assets/D5logo.jpeg';



const navItems = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/services', icon: ShoppingBag, label: 'Services' },
  { to: '/orders', icon: Package, label: 'My Orders' },
  { to: '/facilities', icon: CalendarCheck, label: 'Facilities' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function UserLayout() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { unread } = useNotif();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getTitle = () => {
    const p = location.pathname;
    if (p === '/') return 'Home';
    if (p.startsWith('/services')) return 'Services';
    if (p.startsWith('/orders')) return 'My Orders';
    if (p.startsWith('/facilities')) return 'Facilities';
    if (p.startsWith('/wallet')) return 'Wallet';
    if (p.startsWith('/notifications')) return 'Notifications';
    if (p.startsWith('/profile')) return 'Profile';
    if (p.startsWith('/cart')) return 'Cart';
    if (p.startsWith('/checkout')) return 'Checkout';
    return 'D5';
  };

  return (
    <div className="ul-root">
      <aside className={`ul-sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="ul-logo">
          <img src={logo} alt="Logo" height={44} />
          <div>
            <div className="ul-brand-name">D5</div>
            <div className="ul-brand-sub">Resident Portal</div>
          </div>
        </div>

        {/* User card */}
        <div className="ul-user-card">
          <div className="ul-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div className="ul-uname">{user?.name}</div>
            <div className="ul-uapt">Apt {user?.apartmentNumber}{user?.block ? `, Block ${user.block}` : ''}</div>
          </div>
        </div>

        <nav className="ul-nav">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `ul-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}>
              <div className="ul-nav-icon"><Icon size={18} /></div>
              <span className="ul-nav-label">{label}</span>
              <ChevronRight size={13} className="ul-nav-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="ul-footer">
          {user?.role === 'admin' && (
            <button className="ul-admin-btn" onClick={() => navigate('/admin')}>
              ⚙️ Admin Panel
            </button>
          )}
          <button className="ul-logout" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="ul-overlay" onClick={() => setMobileOpen(false)} />}

      <div className="ul-main">
        {/* Mobile topbar */}
        <header className="ul-topbar">
          <button className="ul-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={logo} alt="Logo" height={28} />
            <span className="ul-topbar-title">{getTitle()}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="ul-icon-btn" onClick={() => navigate('/notifications')}>
              <Bell size={20} />
              {unread > 0 && <span className="ul-badge">{unread > 9 ? '9+' : unread}</span>}
            </button>
            <button className="ul-icon-btn" onClick={() => navigate('/cart')}>
              <ShoppingBasket size={20} />
              {cartCount > 0 && <span className="ul-badge">{cartCount}</span>}
            </button>
          </div>
        </header>

        {/* Desktop top strip */}
        <div className="ul-desktop-strip">
          <span className="ul-strip-text">Dubai Residences · Premium Service Portal</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="ul-icon-btn" onClick={() => navigate('/notifications')}>
              <Bell size={19} />
              {unread > 0 && <span className="ul-badge">{unread > 9 ? '9+' : unread}</span>}
            </button>
            <button className="ul-icon-btn" onClick={() => navigate('/cart')}>
              <ShoppingBasket size={19} />
              {cartCount > 0 && <span className="ul-badge">{cartCount}</span>}
            </button>
          </div>
        </div>

        <main className="ul-content"><Outlet /></main>
      </div>
    </div>
  );
}
