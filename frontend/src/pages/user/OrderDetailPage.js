import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, Clock, XCircle, Star, ShieldCheck, AlertTriangle, Key } from 'lucide-react';
import './OrderDetailPage.css';

const STATUS_STEPS = ['pending', 'confirmed', 'assigned', 'in_progress', 'completed'];

function StarRating({ value, onChange }) {
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" className={`star-btn ${s <= value ? 'filled':''}`} onClick={() => onChange(s)}>
          <Star size={22}/>
        </button>
      ))}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '', staffRating: 5 });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data))
      .catch(() => toast.error('Order not found')).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !id) return;
    socket.emit('join_order_room', id);
    const handler = (update) => {
      setOrder(prev => prev ? { ...prev, ...update } : prev);
      toast.success(`Order: ${(update.status||'').replace('_',' ')}`);
    };
    const issueHandler = () => toast.error('Issue reported with this order');
    socket.on('order_status_update', handler);
    socket.on('order_issue_reported', issueHandler);
    return () => { socket.off('order_status_update', handler); socket.off('order_issue_reported', issueHandler); };
  }, [socketRef, id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      const { data } = await api.put(`/orders/${id}/cancel`);
      setOrder(data); toast.success('Order cancelled');
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot cancel'); }
    finally { setCancelling(false); }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) return toast.error('Enter 4-digit OTP');
    setVerifyingOTP(true);
    try {
      const { data } = await api.put(`/orders/${id}/verify-otp`, { otp });
      setOrder(data.order); setShowOTP(false);
      toast.success('✅ Delivery confirmed! Thank you.');
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP'); }
    finally { setVerifyingOTP(false); }
  };

  const handleUserConfirm = async () => {
    setConfirming(true);
    try {
      const { data } = await api.put(`/orders/${id}/user-confirm`, { confirmationNote: 'Confirmed by resident' });
      setOrder(data.order); toast.success('✅ Receipt confirmed! Thank you.');
    } catch (err) { toast.error('Confirmation failed'); }
    finally { setConfirming(false); }
  };

  const handleReject = async () => {
    if (!rejectReason) return toast.error('Please describe the issue');
    try {
      await api.put(`/orders/${id}/user-reject`, { reason: rejectReason });
      setOrder(prev => ({ ...prev, userRejected: true, userRejectionReason: rejectReason }));
      setShowReject(false);
      toast.success('Issue reported. Admin will contact you shortly.');
    } catch { toast.error('Failed to report issue'); }
  };

  const handleReview = async (e) => {
    e.preventDefault(); setSubmittingReview(true);
    try {
      await api.post('/reviews', { orderId: id, ...review });
      setOrder(prev => ({ ...prev, isReviewed: true }));
      setShowReview(false); toast.success('Review submitted! Thank you. ⭐');
    } catch (err) { toast.error(err.response?.data?.message || 'Review failed'); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return <div className="spinner"/>;
  if (!order) return null;

  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const payLabel = { card:'💳 Card', simulated:'💳 Card (Simulated)', wallet:'💰 Wallet', cash_on_delivery:'🏠 Cash on Delivery' };
  const showConfirmButtons = order.status === 'in_progress' && !order.userConfirmed && !order.userRejected;
  const showCompletedConfirm = order.status === 'completed' && !order.userConfirmed && !order.userRejected;

  return (
    <div className="order-detail fade-up">
      <button className="back-btn" onClick={() => navigate('/orders')}><ArrowLeft size={16}/> Back to Orders</button>

      <div className="od-header">
        <div>
          <div className="page-title">Order #{order._id.slice(-8).toUpperCase()}</div>
          <div className="page-subtitle">{new Date(order.createdAt).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'})}</div>
        </div>
        <div className="od-badges">
          <span className={`badge badge-${order.status}`}>{order.status.replace('_',' ')}</span>
          <span className={`badge badge-${order.paymentStatus}`}>{order.paymentStatus}</span>
        </div>
      </div>

      {/* User confirmation banner when staff completes */}
      {showConfirmButtons && (
        <div className="confirm-banner">
          <ShieldCheck size={20}/>
          <div>
            <div className="cb-title">Staff is working on your order!</div>
            <div className="cb-sub">You'll be able to confirm receipt when delivery is done.</div>
          </div>
        </div>
      )}

      {showCompletedConfirm && (
        <div className="confirm-banner success">
          <CheckCircle size={20}/>
          <div>
            <div className="cb-title">Service Completed! Please confirm receipt.</div>
            <div className="cb-sub">Did you receive your order? Confirm below.</div>
          </div>
          <div className="cb-actions">
            <button className="btn btn-success btn-sm" onClick={handleUserConfirm} disabled={confirming}>
              ✅ {confirming ? 'Confirming...' : 'Confirm Receipt'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowOTP(true)}>
              <Key size={14}/> Use OTP
            </button>
            <button className="btn btn-outline btn-sm" style={{color:'#dc2626', borderColor:'#fca5a5'}} onClick={() => setShowReject(true)}>
              ⚠️ Report Issue
            </button>
          </div>
        </div>
      )}

      {order.userConfirmed && (
        <div className="confirmed-banner">
          ✅ You confirmed receipt of this order on {new Date(order.userConfirmedAt).toLocaleDateString('en-IN')}
        </div>
      )}

      {order.userRejected && (
        <div className="rejected-banner">
          ⚠️ Issue reported: "{order.userRejectionReason}" — Admin will contact you shortly.
        </div>
      )}

      {/* Live tracking */}
      {order.status !== 'cancelled' && (
        <div className="card od-tracking">
          <div className="od-tracking-header">
            <h3>Live Order Tracking</h3>
            <span className="live-dot"><span/>Live</span>
          </div>
          <div className="tracking-steps">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className={`ts-item ${i<=stepIndex?'done':''} ${i===stepIndex?'current':''}`}>
                <div className="ts-icon">
                  {i<stepIndex?<CheckCircle size={18}/>:i===stepIndex?<Clock size={18}/>:<div className="ts-dot"/>}
                </div>
                <div className="ts-label">{step.replace('_',' ')}</div>
                {i<STATUS_STEPS.length-1 && <div className="ts-line"/>}
              </div>
            ))}
          </div>
          {order.assignedStaff && (
            <div className="assigned-staff">
              👷 <strong>{order.assignedStaff.name}</strong> is handling your order
              {order.assignedStaff.phone && <> · <a href={`tel:${order.assignedStaff.phone}`}>{order.assignedStaff.phone}</a></>}
            </div>
          )}
          {order.staffNotes && (
            <div className="staff-note-display">📝 Staff note: {order.staffNotes}</div>
          )}
        </div>
      )}

      {/* OTP display */}
      {order.deliveryOTP && !order.userConfirmed && order.status !== 'cancelled' && (
        <div className="card otp-card">
          <div className="otp-card-header">
            <Key size={18}/>
            <h3>Your Delivery OTP</h3>
          </div>
          <div className="otp-display">{order.deliveryOTP}</div>
          <p className="otp-hint">Share this OTP with the staff member to confirm delivery</p>
        </div>
      )}

      <div className="od-grid">
        <div className="card">
          <h3>Items Ordered</h3>
          <div className="od-items">
            {order.items.map((item,i) => (
              <div key={i} className="od-item-row">
                <span className="oi-name">{item.name}</span>
                <span className="oi-qty">×{item.quantity}</span>
                <span className="oi-price">AED {(item.price*item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="od-total-row"><span>Total</span><span>AED {order.totalAmount.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="card">
          <h3>Customer & Payment</h3>
          <div className="od-info-list">
            {order.customerDetails?.name && <div className="od-info-row"><span>Customer</span><strong>{order.customerDetails.name}</strong></div>}
            {order.customerDetails?.phone && <div className="od-info-row"><span>Phone</span><strong>{order.customerDetails.phone}</strong></div>}
            <div className="od-info-row"><span>Payment</span><strong>{payLabel[order.paymentMethod]||order.paymentMethod}</strong></div>
            <div className="od-info-row"><span>Pay Status</span><span className={`badge badge-${order.paymentStatus}`}>{order.paymentStatus}</span></div>
            <div className="od-info-row"><span>Apartment</span><strong>{order.apartmentNumber}{order.block?`, Block ${order.block}`:''}</strong></div>
            {order.customerDetails?.serviceDate && <div className="od-info-row"><span>Scheduled</span><strong>{new Date(order.customerDetails.serviceDate).toLocaleDateString()} {order.customerDetails.serviceTime}</strong></div>}
            {order.customerDetails?.specialInstructions && <div className="od-info-row"><span>Instructions</span><strong>{order.customerDetails.specialInstructions}</strong></div>}
          </div>
        </div>

        <div className="card od-history">
          <h3>Status History</h3>
          <div className="history-list">
            {order.statusHistory.map((h,i) => (
              <div key={i} className="history-item">
                <span className={`badge badge-${h.status}`}>{h.status.replace('_',' ')}</span>
                <span className="hi-note">{h.note}</span>
                <span className="hi-time">{new Date(h.updatedAt).toLocaleString('en-IN', {dateStyle:'short', timeStyle:'short'})}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="od-actions">
        {['pending','confirmed'].includes(order.status) && (
          <button className="btn btn-outline" onClick={handleCancel} disabled={cancelling}>
            <XCircle size={15}/> {cancelling?'Cancelling...':'Cancel Order'}
          </button>
        )}
        {order.status==='completed' && !order.isReviewed && order.userConfirmed && (
          <button className="btn btn-primary" onClick={() => setShowReview(true)}>
            <Star size={15}/> Rate this Service
          </button>
        )}
        {order.isReviewed && <div className="reviewed-badge">✅ You reviewed this order</div>}
      </div>

      {/* OTP Modal */}
      {showOTP && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3><Key size={18}/> Verify OTP</h3>
              <button className="modal-close" onClick={() => setShowOTP(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              Enter the 4-digit OTP shown on your order or given by the delivery staff
            </p>
            <div className="otp-input-wrap">
              <input className="otp-input" type="text" maxLength={4} value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,4))}
                placeholder="1234"/>
              <button className="btn btn-primary" onClick={handleVerifyOTP} disabled={verifyingOTP || otp.length !== 4}>
                {verifyingOTP ? 'Verifying...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showReject && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3><AlertTriangle size={18}/> Report an Issue</h3>
              <button className="modal-close" onClick={() => setShowReject(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>What's the issue?</label>
              <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Items missing, wrong delivery, quality issue..."/>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowReject(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject}>Report Issue</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReview && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Rate Your Experience</h3>
              <button className="modal-close" onClick={() => setShowReview(false)}>✕</button>
            </div>
            <p style={{color:'var(--text-muted)',fontSize:'14px',margin:'8px 0 20px'}}>Order #{order._id.slice(-8).toUpperCase()}</p>
            <form onSubmit={handleReview}>
              <div className="form-group"><label>Overall Rating</label><StarRating value={review.rating} onChange={v=>setReview({...review,rating:v})}/></div>
              <div className="form-group"><label>Staff Rating</label><StarRating value={review.staffRating} onChange={v=>setReview({...review,staffRating:v})}/></div>
              <div className="form-group"><label>Comments (optional)</label><textarea rows={3} value={review.comment} onChange={e=>setReview({...review,comment:e.target.value})} placeholder="Share your experience..."/></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={()=>setShowReview(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submittingReview}>{submittingReview?'Submitting...':'Submit Review'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
