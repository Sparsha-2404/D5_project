import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Package, Users, CheckCircle, Clock, IndianRupee, ShoppingBag } from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setStats(data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;
  if (!stats) return null;

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: '#118ab2' },
    { label: 'Pending', value: stats.pendingOrders, icon: Clock, color: '#f59e0b' },
    { label: 'Completed', value: stats.completedOrders, icon: CheckCircle, color: '#06d6a0' },
    { label: 'Residents', value: stats.totalResidents, icon: Users, color: '#8b5cf6' },
    { label: 'Staff Members', value: stats.totalStaff, icon: Users, color: '#e94560' },
    { label: 'Revenue (AED )', value: `AED ${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: '#0891b2' },
  ];

  const typeLabels = {
    grocery: '🛒 Grocery', housekeeping: '🧹 Housekeeping',
    maintenance: '🔧 Maintenance', utility: '🚗 Utility', spa_wellness: '💆 Spa',
  };

  return (
    <div className="admin-dashboard fade-up">
      <div className="page-title">Dashboard</div>
      <div className="page-subtitle">Overview of your apartment services</div>

      {/* Stat cards */}
      <div className="stats-grid">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card" style={{ '--sc': s.color }}>
              <div className="stat-icon"><Icon size={22} /></div>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-bottom">
        {/* Orders by type */}
        <div className="card">
          <h3>Orders by Service Type</h3>
          <div className="type-bars">
            {stats.ordersByType.map((t) => {
              const pct = stats.totalOrders > 0 ? Math.round((t.count / stats.totalOrders) * 100) : 0;
              return (
                <div key={t._id} className="type-bar-row">
                  <div className="type-bar-label">{typeLabels[t._id] || t._id}</div>
                  <div className="type-bar-track">
                    <div className="type-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="type-bar-count">{t.count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent orders */}
        <div className="card">
          <div className="recent-header">
            <h3>Recent Orders</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/orders')}>
              View All
            </button>
          </div>
          <div className="recent-orders">
            {stats.recentOrders.map((o) => (
              <div key={o._id} className="recent-order-row">
                <div>
                  <div className="ro-name">{o.user?.name}</div>
                  <div className="ro-apt">Apt {o.user?.apartmentNumber} · {o.orderType}</div>
                </div>
                <div className="ro-right">
                  <span className={`badge badge-${o.status}`}>{o.status}</span>
                  <div className="ro-amount">AED {o.totalAmount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// v2 note: avgRating is now included in dashboard stats from backend
