import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import './AuthPages.css';

const D5Logo = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="14" fill="#111111"/>
    <path d="M22 18 L22 82 L48 82 C70 82 80 68 80 50 C80 32 70 18 48 18 Z" fill="white"/>
    <circle cx="50" cy="50" r="24" fill="#8F50FF"/>
    <circle cx="50" cy="50" r="19" stroke="white" strokeWidth="2.5" fill="none"/>
    <text x="50" y="59" textAnchor="middle" fill="white" fontSize="20" fontWeight="700" fontFamily="Georgia,serif">5</text>
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
      toast.success(`Welcome back! 👋`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'staff') navigate('/staff');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-up">
        <div className="auth-logo-row"><D5Logo size={52} /></div>
        <div className="auth-title">LOGIN</div>

        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label>Email</label>
            <div className="auth-input-wrap">
              <input type="email" placeholder="johndoe@email.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <div className="auth-input-wrap">
              <input type={showPass ? 'text' : 'password'} placeholder="Password"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                required style={{ paddingRight: 44 }} />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            <button type="button" className="auth-forgot">Forgot Password</button>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        <div className="auth-divider">Demo</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.7 }}>
          Admin: <strong>admin@apartment.com</strong> / <strong>admin123</strong>
        </div>
      </div>
    </div>
  );
}
