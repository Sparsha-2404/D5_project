import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Phone, Mail, MapPin, Shield, Star } from 'lucide-react';
import './StaffPages.css';

const STEPS = [
  'Go to Tasks tab to see your assignments',
  'Tap "Start Task" when you begin working',
  'Resident gets notified you\'re on the way',
  'Tap "Done" when service is completed',
  'Add a completion note + confirm cash if COD',
  'Resident confirms receipt via OTP or button',
  'Rate and review becomes available to resident',
];

export default function StaffProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="staff-page fade-up">
      <div className="profile-card-staff">
        <div className="pcs-avatar">{user?.name?.[0]?.toUpperCase()}</div>
        <div className="pcs-name">{user?.name}</div>
        <div className="pcs-badge"><Shield size={12} /> Service Staff Member</div>
      </div>

      <div className="profile-info-card">
        <div className="pic-title">Contact Information</div>
        {[
          { icon: Mail, label: 'Email', value: user?.email },
          { icon: Phone, label: 'Phone', value: user?.phone || 'Not set' },
          { icon: MapPin, label: 'Base Location', value: user?.apartmentNumber || 'Main Office' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="pic-row">
            <div className="pic-icon"><Icon size={16} /></div>
            <div><div className="pic-label">{label}</div><div className="pic-value">{value}</div></div>
          </div>
        ))}
      </div>

      <div className="guide-card">
        <div className="guide-title">📋 How to Complete a Task</div>
        {STEPS.map((step, i) => (
          <div key={i} className="guide-step">
            <div className="guide-num">{i + 1}</div>
            <span>{step}</span>
          </div>
        ))}
      </div>

      <button className="btn btn-danger w-full" onClick={() => { logout(); navigate('/login'); }}>
        <LogOut size={15} /> Sign Out
      </button>
    </div>
  );
}
