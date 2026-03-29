import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MapPin, User, Phone, RefreshCw, AlertTriangle, Clock, UserCheck } from 'lucide-react';
import './AdminTracking.css';

const STATUS_FILTERS = ['', 'pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'];

export default function AdminTracking() {
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('assigned');
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const [ordersRes, staffRes] = await Promise.all([
        api.get(`/admin/orders${params}&limit=50`),
        api.get('/admin/staff'),
      ]);
      setOrders(ordersRes.data.orders);
      setStaff(staffRes.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  // Assign staff + automatically set status to 'assigned'
  const handleAssign = async (orderId, staffId, currentStatus) => {
    if (!staffId) return;
    setUpdating(orderId);
    try {
      const newStatus = ['pending', 'confirmed'].includes(currentStatus) ? 'assigned' : currentStatus;
      const { data } = await api.put(`/admin/orders/${orderId}/status`, {
        status: newStatus,
        assignedStaff: staffId,
        note: 'Staff assigned by admin',
      });
      setOrders(prev => prev.map(o => o._id === orderId ? data : o));
      toast.success('Staff assigned — task now visible in Staff app ✅');
    } catch { toast.error('Failed to assign'); }
    finally { setUpdating(null); }
  };

  const handleStatusUpdate = async (orderId, status) => {
    setUpdating(orderId);
    try {
      const { data } = await api.put(`/admin/orders/${orderId}/status`, {
        status, note: `Status set to ${status} by admin`,
      });
      setOrders(prev => prev.map(o => o._id === orderId ? data : o));
      toast.success(`Status → ${status.replace('_', ' ')}`);
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  const issueOrders = orders.filter(o => o.userRejected);
  const pendingConfirm = orders.filter(o => o.status === 'completed' && !o.userConfirmed && !o.userRejected);

  return (
    <div className="tracking-page fade-up">
      <div className="page-title">Live Order Tracking</div>
      <div className="page-subtitle">Real-time order and staff management</div>

      {issueOrders.length > 0 && (
        <div className="alert-banner danger">
          <AlertTriangle size={18}/> {issueOrders.length} order(s) have reported issues
        </div>
      )}
      {pendingConfirm.length > 0 && (
        <div className="alert-banner warning">
          <Clock size={18}/> {pendingConfirm.length} order(s) awaiting resident confirmation
        </div>
      )}

      {/* How it works hint */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#15803d' }}>
        💡 <strong>To assign work to staff:</strong> Select a staff member from the dropdown → order automatically moves to "assigned" → staff sees it instantly in their app
      </div>

      <div className="tracking-filters">
        {STATUS_FILTERS.map(s => (
          <button key={s} className={`cat-pill ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}>
            {s || 'All'}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14}/></button>
      </div>

      {loading ? <div className="spinner"/> : orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders found</h3>
          <p>Try a different status filter</p>
        </div>
      ) : (
        <div className="tracking-grid">
          {orders.map(order => (
            <div key={order._id} className={`tracking-card ${order.userRejected ? 'issue' : ''}`}>
              <div className="trc-header">
                <div>
                  <div className="trc-id">#{order._id.slice(-8).toUpperCase()}</div>
                  <div className="trc-type">
                    {order.orderType.replace('_',' ')} · AED {order.totalAmount}
                  </div>
                </div>
                <div className="trc-badges">
                  <span className={`badge badge-${order.status}`}>
                    {order.status.replace('_',' ')}
                  </span>
                  {order.userRejected && <span className="badge badge-cancelled">⚠️ Issue</span>}
                  {order.userConfirmed && <span className="badge badge-completed">✅ Confirmed</span>}
                </div>
              </div>

              <div className="trc-customer">
                <div className="trc-row"><User size={13}/> {order.user?.name}</div>
                <div className="trc-row">
                  <MapPin size={13}/> Apt {order.apartmentNumber}{order.block ? `, Block ${order.block}` : ''}
                </div>
                {order.user?.phone && (
                  <div className="trc-row"><Phone size={13}/> {order.user.phone}</div>
                )}
              </div>

              {/* Staff assignment - KEY: use value not defaultValue */}
              <div className="trc-assign-section">
                <label className="trc-assign-label">Assign Staff</label>
                <select
                  className="staff-select-sm"
                  value={order.assignedStaff?._id || ''}
                  onChange={e => handleAssign(order._id, e.target.value, order.status)}
                  disabled={
                    updating === order._id ||
                    order.status === 'completed' ||
                    order.status === 'cancelled'
                  }
                >
                  <option value="">— Select Staff Member —</option>
                  {staff.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
                {order.assignedStaff && (
                  <div className="trc-assigned-name">
                    <UserCheck size={12}/> Assigned to: <strong>{order.assignedStaff.name}</strong>
                  </div>
                )}
              </div>

              {order.userRejected && (
                <div className="trc-issue">⚠️ Issue: "{order.userRejectionReason}"</div>
              )}
              {order.staffNotes && (
                <div className="trc-issue" style={{background:'#fffbf0', borderColor:'var(--accent)', color:'#a16207'}}>
                  📝 Staff note: "{order.staffNotes}"
                </div>
              )}

              <div className="trc-footer">
                <div className="trc-time">
                  {new Date(order.createdAt).toLocaleString('en-AE', {dateStyle:'short', timeStyle:'short'})}
                </div>
                <div style={{display:'flex', gap:6}}>
                  {order.status === 'pending' && (
                    <button className="btn btn-primary btn-sm"
                      disabled={updating === order._id}
                      onClick={() => handleStatusUpdate(order._id, 'confirmed')}>
                      Confirm
                    </button>
                  )}
                  {order.status === 'in_progress' && (
                    <button className="btn btn-success btn-sm"
                      disabled={updating === order._id}
                      onClick={() => handleStatusUpdate(order._id, 'completed')}>
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
