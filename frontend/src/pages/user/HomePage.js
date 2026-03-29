import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotif } from '../../context/NotifContext';
import api from '../../utils/api';
import { IMAGES } from '../../utils/images';
import { ChevronRight, Wallet, Bell, ShoppingCart } from 'lucide-react';
import './HomePage.css';

const categories = [
  { id:'grocery',      label:'Grocery',       color:'#5A9E3A', desc:'Fresh daily essentials' },
  { id:'housekeeping', label:'Housekeeping',   color:'#6B4F8A', desc:'Cleaning & laundry' },
  { id:'maintenance',  label:'Maintenance',    color:'#2E6FBF', desc:'Repairs & fixes' },
  { id:'utility',      label:'Utility',        color:'#8A4F2E', desc:'Car wash & moving' },
  { id:'spa_wellness', label:'Spa & Wellness', color:'#8A2E6A', desc:'Massage & salon' },
  { id:'facilities',   label:'Facilities',    color:'#2E6F8A', desc:'Gym, pool & club' },
];

export default function HomePage() {
  const { user } = useAuth();
  const { unread } = useNotif();
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(null);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  useEffect(() => {
    api.get('/wallet').then(({ data }) => setWalletBalance(data.balance)).catch(() => {});
  }, []);

  const handleCategory = (cat) =>
    cat.id === 'facilities' ? navigate('/facilities') : navigate(`/services/${cat.id}`);

  return (
    <div className="home-page fade-up">

      {/* ── HERO BANNER with real photo ── */}
      <div className="home-hero" style={{ backgroundImage: `url(${IMAGES.homeBanner})` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-greeting">{greeting} 👋</div>
          <h1 className="hero-name">{user?.name?.split(' ')[0]}</h1>
          <p className="hero-apt">Apt {user?.apartmentNumber}{user?.block ? `, Block ${user.block}` : ''} · Dubai Residences</p>
          <div className="hero-cta">
            <button className="hero-btn-primary" onClick={() => navigate('/services')}>
              Browse Services <ChevronRight size={16} />
            </button>
            <button className="hero-btn-ghost" onClick={() => navigate('/cart')}>
              <ShoppingCart size={16} /> View Cart
            </button>
          </div>
        </div>
        <div className="hero-cards">
          <div className="hero-stat-card" onClick={() => navigate('/wallet')}>
            <Wallet size={16} />
            <div>
              <div className="hsc-label">Wallet Balance</div>
              <div className="hsc-val">{walletBalance !== null ? `AED ${walletBalance}` : '—'}</div>
            </div>
          </div>
          {unread > 0 && (
            <div className="hero-stat-card alert" onClick={() => navigate('/notifications')}>
              <Bell size={16} />
              <div>
                <div className="hsc-label">Notifications</div>
                <div className="hsc-val">{unread} new</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TOP PICKS — with real food photos (matches client design) ── */}
      <div className="home-section">
        <div className="section-header">
          <h2>Our Top Picks</h2>
          <button className="see-all" onClick={() => navigate('/services')}>See All <ChevronRight size={14} /></button>
        </div>
        <p className="section-sub">Select from our premium products — naturally better for you</p>

        <div className="top-picks-grid">
          {IMAGES.topPicks.map((item) => (
            <div key={item.name} className="pick-card">
              <div className="pick-img-wrap">
                <img
                  src={item.image}
                  alt={item.name}
                  className="pick-img"
                  onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                />
                <div className="pick-img-fallback" style={{ display:'none', background: '#f3eaff' }}>
                  <span style={{ fontSize: 40 }}>🛒</span>
                </div>
              </div>
              <div className="pick-info">
                <div className="pick-name" style={{ color: item.color }}>{item.name}</div>
                <div className="pick-price">AED {item.price}</div>
                <button className="btn-shop-now" onClick={() => navigate(`/services/${item.category}`)}>
                  Shop Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVICE CATEGORIES with photos ── */}
      <div className="home-section">
        <div className="section-header">
          <h2>All Categories</h2>
          <button className="see-all" onClick={() => navigate('/services')}>See All <ChevronRight size={14} /></button>
        </div>
        <div className="categories-grid">
          {categories.map((cat) => (
            <button key={cat.id} className="cat-card" onClick={() => handleCategory(cat)}>
              <div className="cat-img-wrap">
                <img
                  src={IMAGES.categories[cat.id]}
                  alt={cat.label}
                  className="cat-img"
                  onError={e => { e.target.style.opacity = 0; }}
                />
                <div className="cat-img-overlay" style={{ background: `${cat.color}CC` }} />
              </div>
              <div className="cat-info">
                <div className="cat-label">{cat.label}</div>
                <div className="cat-desc">{cat.desc}</div>
                <div className="cat-arrow-wrap"><ChevronRight size={16} /></div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="home-section">
        <div className="section-header"><h2>Quick Actions</h2></div>
        <div className="quick-grid">
          {[
            { emoji:'📦', label:'Track Orders',    path:'/orders' },
            { emoji:'🔧', label:'Report Issue',    path:'/services/maintenance' },
            { emoji:'🏊', label:'Book Facility',   path:'/facilities' },
            { emoji:'💰', label:'Top Up Wallet',   path:'/wallet' },
            { emoji:'🛒', label:'Order Groceries', path:'/services/grocery' },
            { emoji:'💆', label:'Book Spa',        path:'/services/spa_wellness' },
          ].map(a => (
            <button key={a.path} className="quick-card" onClick={() => navigate(a.path)}>
              <span className="qa-emoji">{a.emoji}</span>
              <span className="qa-label">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
