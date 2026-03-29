import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import './StaffPages.css';

const TYPE_ICONS = { grocery:'🛒', housekeeping:'🧹', maintenance:'🔧', utility:'🚗', spa_wellness:'💆' };

export default function StaffCompletedPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/staff/assigned');
      setOrders(data.filter(o => o.status === 'completed'));
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const totalEarned = orders.filter(o => o.cashCollected).reduce((s, o) => s + (o.cashAmount || 0), 0);
  const confirmed = orders.filter(o => o.userConfirmed).length;

  if (loading) return <div className="spinner" />;

  return (
    <div className="staff-page fade-up">
      <div className="staff-page-header">
        <div>
          <h1>Completed Tasks</h1>
          <p>{orders.length} tasks completed · {confirmed} confirmed by residents</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetch}><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* Summary */}
      <div className="stats-summary" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        {[
          { label: 'Total Completed', num: orders.length, color: '#059669' },
          { label: 'Resident Confirmed', num: confirmed, color: '#1d4ed8' },
          { label: 'Cash Collected (AED)', num: totalEarned, color: '#c8973a' },
        ].map(s => (
          <div key={s.label} className="stat-big-card">
            <div className="sbc-num" style={{ color: s.color }}>{s.num}</div>
            <div className="sbc-label">{s.label}</div>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={60} strokeWidth={1} />
          <h3>No completed tasks yet</h3>
          <p>Tasks you finish will appear here</p>
        </div>
      ) : (
        <div className="completed-grid">
          {orders.map(order => (
            <div key={order._id} className="completed-card">
              <div className="completed-card-left">
                <div className="cc-badge">✅ Completed</div>
                <div className="cc-title">{TYPE_ICONS[order.orderType]} {order.orderType.replace('_', ' ')}</div>
                <div className="cc-sub">
                  #{order._id.slice(-8).toUpperCase()} · Apt {order.apartmentNumber}{order.block ? `, ${order.block}` : ''}
                </div>
                {order.staffProofNote && <div className="cc-note-text">"{order.staffProofNote}"</div>}
              </div>
              <div className="completed-card-right">
                <div className="cc-amount">AED {order.totalAmount?.toLocaleString()}</div>
                {order.cashCollected && (
                  <span style={{ fontSize: 11, background: '#fefce8', color: '#a16207', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                    💵 Cash Collected
                  </span>
                )}
                <div className="cc-time">
                  {order.staffCompletedAt
                    ? new Date(order.staffCompletedAt).toLocaleString('en-AE', { dateStyle: 'short', timeStyle: 'short' })
                    : new Date(order.updatedAt).toLocaleString('en-AE', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
                {order.userConfirmed
                  ? <div className="cc-confirmed">✅ Resident confirmed</div>
                  : <div className="cc-pending">⏳ Awaiting confirmation</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
