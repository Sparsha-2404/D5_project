import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import './WalletPage.css';

const TOPUP_AMOUNTS = [100, 250, 500, 1000, 2000];

export default function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [topping, setTopping] = useState(false);

  // Card simulation fields for top-up
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');

  const fetchWallet = async () => {
    try {
      const { data } = await api.get('/wallet/transactions');
      setWallet(data);
    } catch {
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWallet(); }, []);

  const finalAmount = customAmount ? Number(customAmount) : topupAmount;

  const handleTopup = async () => {
    if (!finalAmount || finalAmount < 10) return toast.error('Minimum top-up is AED 10');

    if (!showCardForm) {
      setShowCardForm(true);
      return;
    }

    // Validate card fields
    if (!cardHolder.trim()) return toast.error('Please enter card holder name');
    if (cardNumber.replace(/\s/g, '').length < 12) return toast.error('Please enter a valid card number');
    if (!cardExpiry.trim()) return toast.error('Please enter card expiry');
    if (!cardCVV.trim()) return toast.error('Please enter CVV');

    setTopping(true);
    try {
      // Simulated top-up — no Razorpay required
      await api.post('/payment/simulate-topup', {
        amount: finalAmount,
        cardHolder: cardHolder.trim(),
        cardLast4: cardNumber.replace(/\s/g, '').slice(-4),
        cardExpiry: cardExpiry.trim(),
      });
      toast.success(`AED ${finalAmount} added to your wallet! 💰`);
      setShowCardForm(false);
      setCardHolder(''); setCardNumber(''); setCardExpiry(''); setCardCVV('');
      setCustomAmount('');
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Top-up failed. Please try again.');
    } finally {
      setTopping(false);
    }
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

  if (loading) return <div className="spinner" />;

  return (
    <div className="wallet-page fade-up">
      <div className="page-title">My Wallet</div>
      <div className="page-subtitle">Manage your ApartEase wallet balance</div>

      <div className="wallet-grid">
        {/* Balance card */}
        <div className="wallet-balance-card">
          <div className="wbc-label"><Wallet size={18} /> Current Balance</div>
          <div className="wbc-amount">AED {wallet?.balance?.toLocaleString() || '0'}</div>
          <div className="wbc-sub">Use wallet balance for fast checkout</div>

          <div className="topup-section">
            <div className="topup-title">Add Money</div>
            <div className="topup-amounts">
              {TOPUP_AMOUNTS.map((a) => (
                <button
                  key={a}
                  className={`topup-chip ${topupAmount === a && !customAmount ? 'active' : ''}`}
                  onClick={() => { setTopupAmount(a); setCustomAmount(''); setShowCardForm(false); }}
                >AED {a}</button>
              ))}
            </div>
            <input
              className="topup-custom"
              type="number"
              placeholder="Or enter custom amount"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setShowCardForm(false); }}
              min={10}
            />

            {/* Card form — revealed after clicking Add Money */}
            {showCardForm && (
              <div style={{ marginTop: 12 }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#fff', opacity: 0.8, display: 'block', marginBottom: 4 }}>
                    Card Holder Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none', fontSize: 14, boxSizing: 'border-box', background: 'rgba(255,255,255,0.15)', color: 'white' }}
                  />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#fff', opacity: 0.8, display: 'block', marginBottom: 4 }}>
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none', fontSize: 14, boxSizing: 'border-box', background: 'rgba(255,255,255,0.15)', color: 'white', letterSpacing: 2 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#fff', opacity: 0.8, display: 'block', marginBottom: 4 }}>MM/YY</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none', fontSize: 14, boxSizing: 'border-box', background: 'rgba(255,255,255,0.15)', color: 'white' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#fff', opacity: 0.8, display: 'block', marginBottom: 4 }}>CVV</label>
                    <input
                      type="password"
                      placeholder="•••"
                      value={cardCVV}
                      onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none', fontSize: 14, boxSizing: 'border-box', background: 'rgba(255,255,255,0.15)', color: 'white' }}
                    />
                  </div>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={11} /> Simulated payment — no real charge occurs.
                </p>
              </div>
            )}

            <button className="btn btn-primary w-full" onClick={handleTopup} disabled={topping}>
              <Plus size={16} />
              {topping
                ? 'Processing...'
                : showCardForm
                ? `Confirm AED ${finalAmount} Top-up`
                : `Add AED ${finalAmount} to Wallet`}
            </button>

            {showCardForm && (
              <button
                className="btn btn-ghost w-full"
                style={{ marginTop: 8, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}
                onClick={() => setShowCardForm(false)}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Transactions */}
        <div className="card wallet-txns">
          <div className="txn-header">
            <h3>Transaction History</h3>
            <button className="btn btn-ghost btn-sm" onClick={fetchWallet}><RefreshCw size={14} /></button>
          </div>

          {!wallet?.transactions?.length ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <Wallet size={40} strokeWidth={1} />
              <h3>No transactions yet</h3>
              <p>Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="txn-list">
              {wallet.transactions.map((txn, i) => (
                <div key={i} className="txn-row">
                  <div className={`txn-icon ${txn.type}`}>
                    {txn.type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div className="txn-info">
                    <div className="txn-desc">{txn.description}</div>
                    <div className="txn-date">{new Date(txn.createdAt).toLocaleString('en-AE', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                  </div>
                  <div className={`txn-amount ${txn.type}`}>
                    {txn.type === 'credit' ? '+' : '-'}AED {txn.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
