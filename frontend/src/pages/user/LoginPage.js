import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { IMAGES } from '../../utils/images';
import './AuthPages.css';

const D5Logo = () => (
  <svg width="52" height="52" viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="white"/>
    <path d="M18 15 L18 85 L45 85 C68 85 82 70 82 50 C82 30 68 15 45 15 Z" fill="#2E1A3C"/>
    <circle cx="50" cy="50" r="22" fill="white"/>
    <circle cx="50" cy="50" r="17" stroke="#2E1A3C" strokeWidth="2.5" fill="none"/>
    <text x="50" y="57" textAnchor="middle" fill="#2E1A3C" fontSize="18" fontWeight="bold" fontFamily="serif">5</text>
  </svg>
);

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}! 👋`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'staff') navigate('/staff');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      {/* Left — Photo hero matching client design */}
      <div className="auth-left" style={{ backgroundImage: `url(${IMAGES.heroBg})` }}>
        <div className="auth-left-overlay" />
        <div className="auth-left-content">
          <div className="auth-logo-top">
            <D5Logo />
            <span className="auth-logo-brand">D5</span>
          </div>
          <div className="auth-hero-badge">Premium Residential Services</div>
          <h1 className="auth-hero-title">From the earth<br /><em>To your table</em></h1>
          <p className="auth-hero-sub">Freshness You Can Taste, Quality You Can Trust</p>
          <div className="auth-features-grid">
            {['🛒 Grocery', '🧹 Housekeeping', '🔧 Maintenance', '💆 Spa', '🏊 Facilities', '💰 Wallet'].map(f => (
              <div key={f} className="auth-feature-chip">{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="auth-right">
        <div className="auth-card fade-up">
          <div className="auth-card-logo">
            <D5Logo />
            <div>
              <div className="auth-brand-name">D5</div>
              <div className="auth-brand-tagline">Resident Portal</div>
            </div>
          </div>
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to access your premium services</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Password</label>
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                required style={{ paddingRight: 46 }} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="pass-toggle">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ marginBottom: 16 }}>
              <LogIn size={17} /> {loading ? 'Signing in...' : 'Get Started →'}
            </button>
          </form>

          <p className="auth-switch">Don't have an account? <Link to="/register">Register here</Link></p>
          <div className="auth-demo-box">
            <div className="auth-demo-title">Demo Credentials</div>
            <div className="auth-demo-row"><span>Admin</span><span>admin@apartment.com / admin123</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
