import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { TrendingUp, Star, Clock, CheckCircle } from 'lucide-react';
import './StaffPages.css';

export default function StaffStatsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/staff/assigned')
      .then(({ data }) => setOrders(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = orders.filter(o => o.status === 'completed');
  const active = orders.filter(o => ['assigned','in_progress'].includes(o.status));
  const confirmed = completed.filter(o => o.userConfirmed);
  const cashOrders = completed.filter(o => o.cashCollected);
  const totalCash = cashOrders.reduce((s, o) => s + (o.cashAmount || 0), 0);
  const confirmRate = completed.length > 0 ? Math.round((confirmed.length / completed.length) * 100) : 0;

  const typeBreakdown = completed.reduce((acc, o) => {
    acc[o.orderType] = (acc[o.orderType] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <div className="spinner" />;

  const typeIcons = { grocery:'🛒', housekeeping:'🧹', maintenance:'🔧', utility:'🚗', spa_wellness:'💆' };

  return (
    <div className="staff-page fade-up">
      <div className="staff-page-header">
        <div><h1>My Performance</h1><p>Your task history and completion stats</p></div>
      </div>

      <div className="staff-stats-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { icon: CheckCircle, label: 'Completed', num: completed.length, color: '#059669', bg: '#f0fdf4' },
          { icon: TrendingUp, label: 'Active Now', num: active.length, color: '#c8973a', bg: '#fffbf0' },
          { icon: Star, label: 'Confirm Rate', num: `${confirmRate}%`, color: '#1d4ed8', bg: '#eff6ff' },
          { icon: Clock, label: 'Cash (AED)', num: totalCash, color: '#7c3aed', bg: '#faf5ff' },
        ].map(s => (
          <div key={s.label} className="staff-stat-card">
            <div className="ssc-icon" style={{ background: s.bg }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div className="ssc-num" style={{ color: s.color }}>{s.num}</div>
            <div className="ssc-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Breakdown by type */}
      {Object.keys(typeBreakdown).length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>Tasks by Service Type</h3>
          {Object.entries(typeBreakdown).map(([type, count]) => {
            const pct = Math.round((count / completed.length) * 100);
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{typeIcons[type] || '📦'}</span>
                <span style={{ fontSize: 13, fontWeight: 600, width: 130, textTransform: 'capitalize' }}>{type.replace('_', ' ')}</span>
                <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#c8973a', borderRadius: 99, minWidth: 4 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, width: 32, textAlign: 'right' }}>{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {completed.length === 0 && (
        <div className="empty-state"><TrendingUp size={56} strokeWidth={1} /><h3>No data yet</h3><p>Complete tasks to see your stats</p></div>
      )}
    </div>
  );
}
