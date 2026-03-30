import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import {
  MapPin, Phone, Clock, CheckCircle, Play, DollarSign,
  Package, RefreshCw, X, AlertCircle, Wifi, WifiOff, Calendar
} from 'lucide-react';
import './StaffPages.css';

const TYPE_ICONS = {
  grocery: '🛒', housekeeping: '🧹',
  maintenance: '🔧', utility: '🚗', spa_wellness: '💆'
};

export default function StaffTasksPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [proofNote, setProofNote] = useState('');
  const [cashCollected, setCashCollected] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [connected, setConnected] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const socketRef = useSocket();
  const pollingRef = useRef(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const { data } = await api.get('/orders/staff/assigned');
      setOrders(data.filter(o => o.status !== 'completed'));
      setLastRefresh(new Date());
      setConnected(true);
    } catch {
      setConnected(false);
      if (!silent) toast.error('Failed to load. Check connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    pollingRef.current = setInterval(() => fetchOrders(true), 15000);
    return () => clearInterval(pollingRef.current);
  }, [fetchOrders]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    const onNotif = () => fetchOrders(true);
    socket.on('new_notification', onNotif);
    socket.on('order_status_update', onNotif);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => {
      socket.off('new_notification', onNotif);
      socket.off('order_status_update', onNotif);
    };
  }, [socketRef, fetchOrders]);

  const updateStatus = async (orderId, status, extra = {}) => {
    setUpdating(true);
    try {
      await api.put(`/orders/${orderId}/staff-update`, {
        status,
        staffNotes: extra.note || `Order ${status.replace('_', ' ')} by staff`,
        staffProofNote: extra.proofNote || '',
        cashCollected: extra.cashCollected || false,
        cashAmount: extra.cashAmount || 0,
      });
      if (status === 'in_progress') {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
        toast.success('Task started! Resident notified 🚀');
      } else if (status === 'completed') {
        setOrders(prev => prev.filter(o => o._id !== orderId));
        setSelected(null);
        toast.success('Task completed! ✅');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setUpdating(false); }
  };

  const openComplete = (order) => {
    setSelected(order);
    setProofNote('');
    setCashCollected(order.paymentMethod === 'cash_on_delivery');
    setCashAmount(order.totalAmount?.toString() || '');
  };

  const confirmComplete = () => {
    if (!proofNote.trim()) return toast.error('Add a completion note');
    updateStatus(selected._id, 'completed', {
      note: proofNote, proofNote,
      cashCollected, cashAmount: cashCollected ? Number(cashAmount) : 0,
    });
  };

  const inProgress = orders.filter(o => o.status === 'in_progress');
  const newTasks = orders.filter(o => o.status === 'assigned');

  if (loading) return <div className="spinner" />;

  return (
    <div className="staff-page fade-up">
      <div className="staff-page-header">
        <div>
          <h1>Active Tasks</h1>
          <p>{orders.length === 0 ? 'No tasks right now — check back soon' : `${newTasks.length} new · ${inProgress.length} in progress`}</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => fetchOrders(false)} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="staff-stats-row">
        {[
          { label: 'New Tasks', num: newTasks.length, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'In Progress', num: inProgress.length, color: '#c8973a', bg: '#fffbf0' },
          { label: 'Total Active', num: orders.length, color: '#0a0f1e', bg: '#f8fafc' },
          { label: connected ? 'Live Updates' : 'Offline', num: connected ? '●' : '○', color: connected ? '#10b981' : '#ef4444', bg: connected ? '#f0fdf4' : '#fef2f2' },
        ].map(s => (
          <div key={s.label} className="staff-stat-card">
            <div className="ssc-icon" style={{ background: s.bg }}>
              <span style={{ color: s.color, fontSize: 16, fontWeight: 800 }}>{s.num}</span>
            </div>
            <div className="ssc-num" style={{ color: s.color }}>{s.num}</div>
            <div className="ssc-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Live bar */}
      <div className="live-status-bar">
        <div className={`live-dot ${connected ? 'online' : 'offline'}`}>
          <div className="live-dot-pulse" />
          {connected ? 'Live' : 'Offline'}
        </div>
        {lastRefresh && (
          <span className="lsb-time">Last updated: {lastRefresh.toLocaleTimeString('en-AE', { timeStyle: 'short' })}</span>
        )}
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Auto-refreshes every 15s</span>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <Package size={64} strokeWidth={1} />
          <h3>No active tasks</h3>
          <p>When admin assigns you an order, it appears here instantly</p>
          <button className="btn btn-primary btn-sm" onClick={() => fetchOrders(false)} style={{ marginTop: 8 }}>
            <RefreshCw size={13} /> Check now
          </button>
        </div>
      ) : (
        <div className="task-grid">
          {inProgress.map(o => <TaskCard key={o._id} order={o} onStart={updateStatus} onComplete={openComplete} updating={updating} />)}
          {newTasks.map(o => <TaskCard key={o._id} order={o} onStart={updateStatus} onComplete={openComplete} updating={updating} />)}
        </div>
      )}

      {/* Complete Modal */}
      {selected && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Complete Order</h3>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <p className="complete-modal-type">
              {TYPE_ICONS[selected.orderType]} {selected.orderType.replace('_', ' ')} · #{selected._id.slice(-8).toUpperCase()}
            </p>
            <div className="form-group">
              <label>Completion Note *</label>
              <textarea rows={3} value={proofNote} onChange={e => setProofNote(e.target.value)}
                placeholder="e.g. Groceries delivered to door. All items checked by resident..." />
            </div>
            {selected.paymentMethod === 'cash_on_delivery' && (
              <div className="cash-box">
                <div className="cash-check-row">
                  <input type="checkbox" id="cashCheck" checked={cashCollected} onChange={e => setCashCollected(e.target.checked)} />
                  <label htmlFor="cashCheck"><DollarSign size={16} /> Cash Collected from Resident</label>
                </div>
                {cashCollected && (
                  <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                    <label>Amount Collected (AED)</label>
                    <input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} />
                  </div>
                )}
              </div>
            )}
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#15803d' }}>
              ℹ️ Resident will receive a confirmation request after you submit
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn btn-complete btn-lg" onClick={confirmComplete} disabled={updating} style={{ background: '#059669', color: 'white' }}>
                <CheckCircle size={16} /> {updating ? 'Completing...' : 'Mark as Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ order, onStart, onComplete, updating }) {
  const isActive = order.status === 'in_progress';
  const c = order.customerDetails;
  return (
    <div className={`task-card ${isActive ? 'in-progress' : 'new-task'}`}>
      <div className="tc-top">
        <div className="tc-type-row">
          <span className="tc-emoji">{TYPE_ICONS[order.orderType] || '📦'}</span>
          <div>
            <div className="tc-title">{order.orderType.replace('_', ' ')}</div>
            <div className="tc-id">#{order._id.slice(-8).toUpperCase()}</div>
          </div>
        </div>
        <span className={`task-status-pill ${isActive ? 'tsp-active' : 'tsp-new'}`}>
          {isActive ? '🔥 In Progress' : '🆕 New'}
        </span>
      </div>

      <div className="tc-info-grid">
        <div className="tc-info-item">
          <div className="tc-info-icon"><MapPin size={13} /></div>
          Apt {order.apartmentNumber}{order.block ? `, ${order.block}` : ''}
        </div>
        {c?.name && <div className="tc-info-item"><div className="tc-info-icon">👤</div>{c.name}</div>}
        {c?.phone && (
          <div className="tc-info-item">
            <div className="tc-info-icon"><Phone size={13} /></div>
            <a href={`tel:${c.phone}`}>{c.phone}</a>
          </div>
        )}
        {c?.serviceTime && (
          <div className="tc-info-item">
            <div className="tc-info-icon"><Clock size={13} /></div>
            {c.serviceTime}
          </div>
        )}
        {c?.serviceDate && (
          <div className="tc-info-item">
            <div className="tc-info-icon"><Calendar size={13} /></div>
            {new Date(c.serviceDate).toLocaleDateString('en-AE', { dateStyle: 'medium' })}
          </div>
        )}
      </div>

      <div className="tc-items-box">
        <div className="tc-items-head">Items ({order.items.length})</div>
        {order.items.slice(0, 4).map((item, i) => (
          <div key={i} className="tc-item-row">
            <span className="tc-item-name">{item.name}</span>
            <span className="tc-item-qty">×{item.quantity}</span>
          </div>
        ))}
        {order.items.length > 4 && <div className="tc-items-more">+{order.items.length - 4} more items</div>}
      </div>

      {c?.specialInstructions && (
        <div className="tc-instructions">💬 {c.specialInstructions}</div>
      )}

      <div className="tc-footer">
        <div>
          <div className="tc-amount">AED {order.totalAmount?.toLocaleString()}</div>
          <span className={`tc-payment-badge ${order.paymentMethod === 'cash_on_delivery' ? 'tpb-cod' : 'tpb-paid'}`}>
            {order.paymentMethod === 'cash_on_delivery' ? '💵 Collect Cash' : '✅ Already Paid'}
          </span>
        </div>
        <div className="tc-actions">
          {order.status === 'assigned' && (
            <button className="btn btn-start btn-sm" onClick={() => onStart(order._id, 'in_progress')} disabled={updating}>
              <Play size={14} /> Start Task
            </button>
          )}
          {isActive && (
            <button className="btn btn-complete btn-sm" style={{ background: '#059669', color: 'white' }} onClick={() => onComplete(order)} disabled={updating}>
              <CheckCircle size={14} /> Done
            </button>
          )}
        </div>
      </div>
      {order.staffNotes && <div className="tc-note-bar">📝 {order.staffNotes}</div>}
    </div>
  );
}
