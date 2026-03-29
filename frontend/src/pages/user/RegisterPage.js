import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
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

export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', apartmentNumber:'', block:'' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await register(form);
      toast.success('Welcome to D5! 🎉');
      navigate('/');
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left" style={{ backgroundImage: `url(${IMAGES.homeBanner})` }}>
        <div className="auth-left-overlay" />
        <div className="auth-left-content">
          <div className="auth-logo-top"><D5Logo /><span className="auth-logo-brand">D5</span></div>
          <div className="auth-hero-badge">Join Dubai's Premier Residential Hub</div>
          <h1 className="auth-hero-title">Live Better,<br /><em>Every Day</em></h1>
          <p className="auth-hero-sub">Register to access D5's full suite of apartment services — all in one elegant platform.</p>
          <div className="auth-features-grid">
            {['🛒 Grocery', '🧹 Housekeeping', '🔧 Maintenance', '💆 Spa', '🏊 Facilities', '💰 Wallet'].map(f => (
              <div key={f} className="auth-feature-chip">{f}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card fade-up">
          <div className="auth-card-logo">
            <D5Logo />
            <div><div className="auth-brand-name">D5</div><div className="auth-brand-tagline">Resident Portal</div></div>
          </div>
          <h2 className="auth-title">Create account</h2>
          <p className="auth-subtitle">Register as a resident to get started</p>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group"><label>Full Name *</label><input placeholder="John Smith" value={form.name} onChange={set('name')} required /></div>
              <div className="form-group"><label>Phone</label><input placeholder="+971 50 000 0000" value={form.phone} onChange={set('phone')} /></div>
            </div>
            <div className="form-group"><label>Email Address *</label><input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required /></div>
            <div className="form-group"><label>Password *</label><input type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6} /></div>
            <div className="form-row">
              <div className="form-group"><label>Apartment No. *</label><input placeholder="e.g. 301" value={form.apartmentNumber} onChange={set('apartmentNumber')} required /></div>
              <div className="form-group"><label>Block</label><input placeholder="e.g. A" value={form.block} onChange={set('block')} /></div>
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ marginBottom: 16 }}>
              <UserPlus size={17} /> {loading ? 'Creating account...' : 'Register →'}
            </button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
