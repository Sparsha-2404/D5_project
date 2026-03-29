import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CreditCard, Wallet, Truck, ArrowLeft, ShieldCheck } from 'lucide-react';
import './CheckoutPage.css';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const ORDER_TYPES = [
  { value: 'grocery', label: '🛒 Grocery' },
  { value: 'housekeeping', label: '🧹 Housekeeping' },
  { value: 'maintenance', label: '🔧 Maintenance' },
  { value: 'utility', label: '🚗 Utility' },
  { value: 'spa_wellness', label: '💆 Spa & Wellness' },
];

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payMethod, setPayMethod] = useState('razorpay');
  const [orderType, setOrderType] = useState('grocery');
  const [notes, setNotes] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cart.length === 0) navigate('/cart');
    api.get('/wallet').then(({ data }) => setWalletBalance(data.balance)).catch(() => {});
  }, []);

  const createOrder = async () => {
    const items = cart.map((i) => ({ service: i._id, name: i.name, quantity: i.quantity, price: i.price }));
    const { data } = await api.post('/orders', { items, orderType, notes, paymentMethod: payMethod });
    return data;
  };

  const handleRazorpay = async () => {
    setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) return toast.error('Failed to load Razorpay. Check your connection.');

      const order = await createOrder();
      const { data: rpData } = await api.post('/payment/create-order', { orderId: order._id });

      const options = {
        key: rpData.key,
        amount: rpData.amount,
        currency: rpData.currency,
        name: 'ApartEase',
        description: `Payment for ${orderType.replace('_', ' ')} order`,
        order_id: rpData.razorpayOrderId,
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id,
            });
            clearCart();
            toast.success('Payment successful! Order confirmed.');
            navigate(`/orders/${order._id}`);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: { name: user.name, email: user.email, contact: user.phone || '' },
        theme: { color: '#f97316' },
        modal: { ondismiss: () => { toast('Payment cancelled'); setLoading(false); } },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handleWallet = async () => {
    if (walletBalance < cartTotal) return toast.error(`Insufficient wallet balance. You have AED ${walletBalance}.`);
    setLoading(true);
    try {
      const order = await createOrder();
      await api.post('/payment/pay-wallet', { orderId: order._id });
      clearCart();
      toast.success('Paid via wallet! Order confirmed.');
      navigate(`/orders/${order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Wallet payment failed');
    } finally { setLoading(false); }
  };

  const handleCOD = async () => {
    setLoading(true);
    try {
      const order = await createOrder();
      clearCart();
      toast.success('Order placed! Pay on delivery.');
      navigate(`/orders/${order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setLoading(false); }
  };

  const handlePlaceOrder = () => {
    if (payMethod === 'razorpay') handleRazorpay();
    else if (payMethod === 'wallet') handleWallet();
    else handleCOD();
  };

  return (
    <div className="checkout-page fade-up">
      <button className="back-btn" onClick={() => navigate('/cart')}>
        <ArrowLeft size={16} /> Back to Cart
      </button>
      <div className="page-title">Checkout</div>
      <div className="page-subtitle">Review your order and choose payment method</div>

      <div className="checkout-grid">
        {/* Left: details */}
        <div className="checkout-left">
          {/* Order type */}
          <div className="card checkout-section">
            <h3>Service Type</h3>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                {ORDER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Delivery address */}
          <div className="card checkout-section">
            <h3>Delivery Address</h3>
            <div className="addr-box">
              <div className="addr-name">{user?.name}</div>
              <div className="addr-detail">Apartment {user?.apartmentNumber}{user?.block ? `, Block ${user.block}` : ''}</div>
              <div className="addr-detail">{user?.phone}</div>
            </div>
          </div>

          {/* Notes */}
          <div className="card checkout-section">
            <h3>Instructions (optional)</h3>
            <textarea
              className="checkout-notes"
              placeholder="Any special instructions for the service team..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Payment method */}
          <div className="card checkout-section">
            <h3>Payment Method</h3>
            <div className="pay-methods">
              {[
                { value: 'razorpay', label: 'Pay Online', sub: 'Cards, UPI, Net Banking', icon: CreditCard, badge: 'Recommended' },
                { value: 'wallet', label: 'ApartEase Wallet', sub: `Balance: AED ${walletBalance.toLocaleString()}`, icon: Wallet, badge: walletBalance >= cartTotal ? null : 'Low balance' },
                { value: 'cash_on_delivery', label: 'Cash on Delivery', sub: 'Pay when service is delivered', icon: Truck, badge: null },
              ].map(({ value, label, sub, icon: Icon, badge }) => (
                <button
                  key={value}
                  className={`pay-method-card ${payMethod === value ? 'selected' : ''}`}
                  onClick={() => setPayMethod(value)}
                >
                  <div className="pay-method-radio">
                    <div className={`radio-dot ${payMethod === value ? 'active' : ''}`} />
                  </div>
                  <div className="pay-method-icon"><Icon size={20} /></div>
                  <div className="pay-method-info">
                    <div className="pay-method-label">{label}</div>
                    <div className="pay-method-sub">{sub}</div>
                  </div>
                  {badge && <span className={`pay-badge ${badge === 'Recommended' ? 'green' : 'orange'}`}>{badge}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: summary */}
        <div className="checkout-right">
          <div className="card order-summary">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {cart.map((item) => (
                <div key={item._id} className="summary-item">
                  <div className="si-name">{item.name}<span className="si-qty"> ×{item.quantity}</span></div>
                  <div className="si-price">AED {(item.price * item.quantity).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="summary-divider" />
            <div className="summary-row"><span>Subtotal</span><span>AED {cartTotal.toLocaleString()}</span></div>
            <div className="summary-row"><span>Delivery</span><span className="free-tag">Free</span></div>
            <div className="summary-row"><span>Taxes</span><span className="free-tag">Included</span></div>
            <div className="summary-divider" />
            <div className="summary-total"><span>Total</span><span>AED {cartTotal.toLocaleString()}</span></div>

            <button
              className="btn btn-primary btn-lg w-full"
              onClick={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? 'Processing...' : payMethod === 'razorpay' ? `Pay AED ${cartTotal.toLocaleString()}` : payMethod === 'wallet' ? `Pay from Wallet` : 'Place Order (COD)'}
            </button>

            <div className="secure-note">
              <ShieldCheck size={14} />
              <span>Payments secured by Razorpay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
