import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import './AuthPages.css';
import logo from '../../assets/D5logo.jpeg';


export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', apartmentNumber:'', block:'' });
  const [showPass, setShowPass] = useState(false);
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-up">
        <div className="auth-logo-row"><img src={logo} alt="Logo" height={52} /></div>
        <div className="auth-title">REGISTER</div>
        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label>Full Name</label>
            <div className="auth-input-wrap">
              <input placeholder="John Doe" value={form.name} onChange={set('name')} required />
            </div>
          </div>
          <div className="auth-input-group">
            <label>Email</label>
            <div className="auth-input-wrap">
              <input type="email" placeholder="johndoe@email.com" value={form.email} onChange={set('email')} required />
            </div>
          </div>
          <div className="auth-input-group">
            <label>Phone</label>
            <div className="auth-input-wrap">
              <input placeholder="+00 123 456 7890" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div className="auth-input-group">
            <label>Password</label>
            <div className="auth-input-wrap">
              <input type={showPass ? 'text' : 'password'} placeholder="Password"
                value={form.password} onChange={set('password')} required minLength={6}
                style={{ paddingRight: 44 }} />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="auth-input-group">
              <label>Apt No.</label>
              <div className="auth-input-wrap">
                <input placeholder="e.g. 301" value={form.apartmentNumber} onChange={set('apartmentNumber')} required />
              </div>
            </div>
            <div className="auth-input-group">
              <label>Block</label>
              <div className="auth-input-wrap">
                <input placeholder="e.g. A" value={form.block} onChange={set('block')} />
              </div>
            </div>
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Registering...' : 'REGISTER'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
