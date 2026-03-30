import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { RefreshCw, UserCheck, UserPlus, X, Check, ChevronDown } from 'lucide-react';
import './AdminOrders.css';

const STATUSES = ['', 'pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'];
const TYPES = ['', 'grocery', 'housekeeping', 'maintenance', 'utility', 'spa_wellness'];
const NEXT_STATUS = {
  pending: 'confirmed', confirmed: 'assigned',
  assigned: 'in_progress', in_progress: 'completed',
};
const TYPE_ICONS = { grocery:'🛒', housekeeping:'🧹', maintenance:'🔧', utility:'🚗', spa_wellness:'💆' };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', orderType: '' });
  const [updating, setUpdating] = useState(null);
  const [assignModal, setAssignModal] = useState(null); // { order }
  const [selectedStaff, setSelectedStaff] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.orderType) params.append('orderType', filters.orderType);
      const [ordersRes, staffRes] = await Promise.all([
        api.get(`/admin/orders?${params}&limit=50`),
        api.get('/admin/staff'),
      ]);
      setOrders(ordersRes.data.orders);
      setStaff(staffRes.data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters]);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      const { data } = await api.put(`/admin/orders/${orderId}/status`, {
        status, note: `Status updated to ${status} by admin`,
      });
      setOrders(prev => prev.map(o => o._id === orderId ? data : o));
      toast.success(`✅ Status → ${status.replace('_', ' ')}`);
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  const openAssignModal = (order) => {
    setAssignModal(order);
    setSelectedStaff(order.assignedStaff?._id || '');
  };

  const confirmAssign = async () => {
    if (!selectedStaff) return toast.error('Please select a staff member');
    const order = assignModal;
    setUpdating(order._id);
    try {
      const newStatus = ['pending', 'confirmed'].includes(order.status) ? 'assigned' : order.status;
      const { data } = await api.put(`/admin/orders/${order._id}/status`, {
        status: newStatus,
        assignedStaff: selectedStaff,
        note: `Staff assigned by admin`,
      });
      setOrders(prev => prev.map(o => o._id === order._id ? data : o));
      const staffName = staff.find(s => s._id === selectedStaff)?.name || 'Staff';
      toast.success(`✅ ${staffName} assigned to order #${order._id.slice(-8).toUpperCase()}`);
      setAssignModal(null);
    } catch { toast.error('Assignment failed'); }
    finally { setUpdating(null); }
  };

  const getStaffWorkload = (staffId) => orders.filter(o =>
    o.assignedStaff?._id === staffId &&
    ['assigned', 'in_progress'].includes(o.status)
  ).length;

  return (
    <div className="admin-orders fade-up">
      <div className="ao-header">
        <div>
          <div className="page-title">All Orders</div>
          <div className="page-subtitle">{orders.length} orders found</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="ao-filters">
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select value={filters.orderType} onChange={e => setFilters({ ...filters, orderType: e.target.value })}>
          <option value="">All Service Types</option>
          {TYPES.filter(Boolean).map(t => (
            <option key={t} value={t}>{TYPE_ICONS[t]} {t.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Resident</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Assigned Staff</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} className={order.userRejected ? 'issue-row' : ''}>
                  <td>
                    <div className="order-id-cell">#{order._id.slice(-8).toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {new Date(order.createdAt).toLocaleDateString('en-AE')}
                    </div>
                  </td>
                  <td>
                    <div className="resident-name">{order.user?.name}</div>
                    <div className="resident-apt">Apt {order.user?.apartmentNumber}{order.user?.block ? `, ${order.user.block}` : ''}</div>
                  </td>
                  <td>
                    <span className="type-pill">
                      {TYPE_ICONS[order.orderType]} {order.orderType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="amount-cell">AED {order.totalAmount}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className={`badge badge-${order.status}`}>{order.status.replace('_', ' ')}</span>
                      {order.userRejected && <span className="badge" style={{ background: '#fef2f2', color: '#dc2626', fontSize: 10 }}>⚠️ Issue</span>}
                      {order.userConfirmed && <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', fontSize: 10 }}>✅ Confirmed</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${order.paymentStatus || 'pending'}`}>
                      {order.paymentStatus || 'pending'}
                    </span>
                  </td>
                  <td>
                    {order.assignedStaff ? (
                      <div className="assigned-staff-cell">
                        <div className="asc-avatar">{order.assignedStaff.name[0]}</div>
                        <div>
                          <div className="asc-name">{order.assignedStaff.name}</div>
                          <button className="asc-change" onClick={() => openAssignModal(order)}>
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn-assign"
                        onClick={() => openAssignModal(order)}
                        disabled={['completed', 'cancelled'].includes(order.status)}
                      >
                        <UserPlus size={13} /> Assign Staff
                      </button>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {NEXT_STATUS[order.status] && (
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={updating === order._id}
                          onClick={() => updateStatus(order._id, NEXT_STATUS[order.status])}
                        >
                          → {NEXT_STATUS[order.status].replace('_', ' ')}
                        </button>
                      )}
                      {['pending', 'confirmed', 'assigned'].includes(order.status) && (
                        <button
                          className="btn btn-sm cancel-btn"
                          disabled={updating === order._id}
                          onClick={() => updateStatus(order._id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Staff Modal */}
      {assignModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Assign Staff Member</h3>
              <button className="modal-close" onClick={() => setAssignModal(null)}><X size={20} /></button>
            </div>

            {/* Order summary */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                {TYPE_ICONS[assignModal.orderType]} {assignModal.orderType.replace('_', ' ')} Order
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                #{assignModal._id.slice(-8).toUpperCase()} · Apt {assignModal.apartmentNumber}
                {assignModal.block ? `, Block ${assignModal.block}` : ''} · AED {assignModal.totalAmount}
              </div>
              {assignModal.customerDetails?.name && (
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  👤 {assignModal.customerDetails.name} · {assignModal.customerDetails.phone}
                </div>
              )}
            </div>

            {/* Staff list */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 10 }}>
                Select Staff Member
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {staff.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    No staff members yet. Create staff accounts in Users & Staff.
                  </div>
                ) : staff.map(s => {
                  const workload = getStaffWorkload(s._id);
                  const isSelected = selectedStaff === s._id;
                  return (
                    <button
                      key={s._id}
                      onClick={() => setSelectedStaff(s._id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', border: `2px solid ${isSelected ? '#c8973a' : '#e2e8f0'}`,
                        borderRadius: 10, background: isSelected ? '#fffbf0' : 'white',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                        fontFamily: 'inherit',
                      }}
                    >
                      <div style={{
                        width: 38, height: 38, background: isSelected ? '#c8973a' : '#0a0f1e',
                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'white', fontWeight: 800,
                        fontSize: 15, flexShrink: 0,
                      }}>
                        {s.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0a0f1e' }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{s.email}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                          background: workload > 2 ? '#fef2f2' : workload > 0 ? '#fffbf0' : '#f0fdf4',
                          color: workload > 2 ? '#dc2626' : workload > 0 ? '#a16207' : '#15803d',
                        }}>
                          {workload} active {workload === 1 ? 'task' : 'tasks'}
                        </div>
                      </div>
                      {isSelected && (
                        <div style={{ color: '#c8973a', flexShrink: 0 }}><Check size={18} /></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setAssignModal(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={confirmAssign}
                disabled={!selectedStaff || updating === assignModal._id}
              >
                <UserCheck size={16} />
                {updating === assignModal._id ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
