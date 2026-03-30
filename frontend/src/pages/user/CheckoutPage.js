import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CreditCard, Wallet, Truck, ArrowLeft, ShieldCheck } from 'lucide-react';
import './CheckoutPage.css';

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
  // FIXED: 'card' matches backend enum ['card','wallet','cash_on_delivery','simulated']
  const [payMethod, setPayMethod] = useState('card');
  const [orderType, setOrderType] = useState('grocery');
  const [notes, setNotes] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  // Card simulation fields
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');

  useEffect(() => {
    if (cart.length === 0) navigate('/cart');
    api.get('/wallet').then(({ data }) => setWalletBalance(data.balance)).catch(() => {});
  }, []);

  // Create order — paymentMethod must match backend enum exactly
  const createOrder = async (method) => {
    const items = cart.map((i) => ({
      service: i._id,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
    }));
    const { data } = await api.post('/orders', {
      items,
      orderType,
      notes,
      paymentMethod: method,
    });
    return data;
  };

  // Card: create order with method='card', then simulate-payment
  const handleCard = async () => {
    if (!cardHolder.trim()) return toast.error('Please enter card holder name');
    if (cardNumber.replace(/\s/g, '').length < 12) return toast.error('Please enter a valid card number');
    if (!cardExpiry.trim()) return toast.error('Please enter card expiry');
    if (!cardCVV.trim()) return toast.error('Please enter CVV');

    setLoading(true);
    try {
      const order = await createOrder('card');
      const cardLast4 = cardNumber.replace(/\s/g, '').slice(-4);
      await api.post(`/orders/${order._id}/simulate-payment`, {
        cardHolder: cardHolder.trim(),
        cardLast4,
        cardExpiry: cardExpiry.trim(),
      });
      clearCart();
      toast.success('Payment successful! Order confirmed. 💳');
      navigate(`/orders/${order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Card payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Wallet: create order with method='wallet', then pay-wallet
  const handleWallet = async () => {
    if (walletBalance < cartTotal) {
      return toast.error(`Insufficient wallet balance. You have AED ${walletBalance}.`);
    }
    setLoading(true);
    try {
      const order = await createOrder('wallet');
      await api.post('/payment/pay-wallet', { orderId: order._id });
      clearCart();
      toast.success('Paid via wallet! Order confirmed.');
      navigate(`/orders/${order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Wallet payment failed');
    } finally {
      setLoading(false);
    }
  };

  // COD: backend auto-confirms when paymentMethod === 'cash_on_delivery'
  const handleCOD = async () => {
    setLoading(true);
    try {
      const order = await createOrder('cash_on_delivery');
      clearCart();
      toast.success('Order placed! Pay on delivery. 📦');
      navigate(`/orders/${order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    if (payMethod === 'card') handleCard();
    else if (payMethod === 'wallet') handleWallet();
    else handleCOD();
  };

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
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
                {ORDER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Delivery address */}
          <div className="card checkout-section">
            <h3>Delivery Address</h3>
            <div className="addr-box">
              <div className="addr-name">{user?.name}</div>
              <div className="addr-detail">
                Apartment {user?.apartmentNumber}
                {user?.block ? `, Block ${user.block}` : ''}
              </div>
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
                {
                  value: 'card',
                  label: 'Pay by Card',
                  sub: 'Debit / Credit card (simulated)',
                  icon: CreditCard,
                  badge: 'Recommended',
                },
                {
                  value: 'wallet',
                  label: 'ApartEase Wallet',
                  sub: `Balance: AED ${walletBalance.toLocaleString()}`,
                  icon: Wallet,
                  badge: walletBalance >= cartTotal ? null : 'Low balance',
                },
                {
                  value: 'cash_on_delivery',
                  label: 'Cash on Delivery',
                  sub: 'Pay when service is delivered',
                  icon: Truck,
                  badge: null,
                },
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
                  {badge && (
                    <span className={`pay-badge ${badge === 'Recommended' ? 'green' : 'orange'}`}>
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Card form — shown only when card is selected */}
            {payMethod === 'card' && (
              <div className="card-form" style={{ marginTop: 16, padding: '16px 0 4px' }}>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4, display: 'block' }}>
                    Card Holder Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4, display: 'block' }}>
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', letterSpacing: 2, boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4, display: 'block' }}>
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4, display: 'block' }}>
                      CVV
                    </label>
                    <input
                      type="password"
                      placeholder="•••"
                      value={cardCVV}
                      onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <p style={{ fontSize: 11, color: '#999', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={11} /> This is a simulated payment — no real charge will occur.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: summary */}
        <div className="checkout-right">
          <div className="card order-summary">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {cart.map((item) => (
                <div key={item._id} className="summary-item">
                  <div className="si-name">
                    {item.name}<span className="si-qty"> ×{item.quantity}</span>
                  </div>
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
              {loading
                ? 'Processing...'
                : payMethod === 'card'
                ? `Pay AED ${cartTotal.toLocaleString()}`
                : payMethod === 'wallet'
                ? 'Pay from Wallet'
                : 'Place Order (COD)'}
            </button>

            <div className="secure-note">
              <ShieldCheck size={14} />
              <span>All transactions are secured & encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
