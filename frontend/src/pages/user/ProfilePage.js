import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { User, Save } from 'lucide-react';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    apartmentNumber: user?.apartmentNumber || '',
    block: user?.block || '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      const payload = { name: form.name, phone: form.phone, apartmentNumber: form.apartmentNumber, block: form.block };
      if (form.password) payload.password = form.password;
      const { data } = await api.put('/auth/profile', payload);
      updateUser(data);
      toast.success('Profile updated!');
      setForm((f) => ({ ...f, password: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page fade-up">
      <div className="page-title">My Profile</div>
      <div className="page-subtitle">Manage your account details</div>

      <div className="profile-layout">
        {/* Avatar card */}
        <div className="card profile-avatar-card">
          <div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="profile-name">{user?.name}</div>
          <div className="profile-email">{user?.email}</div>
          <div className="profile-apt">Apt {user?.apartmentNumber}{user?.block ? `, Block ${user?.block}` : ''}</div>
          <div className={`badge ${user?.role === 'admin' ? 'badge-confirmed' : 'badge-completed'}`} style={{ marginTop: 12 }}>
            {user?.role}
          </div>
        </div>

        {/* Edit form */}
        <div className="card profile-form-card">
          <h3>Edit Information</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row-2">
              <div className="form-group">
                <label>Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 ..." />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Apartment Number</label>
                <input name="apartmentNumber" value={form.apartmentNumber} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Block</label>
                <input name="block" value={form.block} onChange={handleChange} placeholder="e.g. A" />
              </div>
            </div>

            <div className="form-divider">Change Password (optional)</div>

            <div className="form-row-2">
              <div className="form-group">
                <label>New Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Leave blank to keep" minLength={6} />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat new password" />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
