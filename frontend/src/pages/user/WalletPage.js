import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import './WalletPage.css';

const TOPUP_AMOUNTS = [100, 250, 500, 1000, 2000];

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export default function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [topping, setTopping] = useState(false);

  const fetchWallet = async () => {
    try {
      const { data } = await api.get('/wallet/transactions');
      setWallet(data);
    } catch { toast.error('Failed to load wallet'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWallet(); }, []);

  const handleTopup = async () => {
    const amount = customAmount ? Number(customAmount) : topupAmount;
    if (!amount || amount < 10) return toast.error('Minimum top-up is AED 10');
    setTopping(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) return toast.error('Razorpay failed to load');

      const { data: rpData } = await api.post('/payment/create-topup-order', { amount });

      const options = {
        key: rpData.key,
        amount: rpData.amount,
        currency: rpData.currency,
        name: 'ApartEase Wallet',
        description: `Add AED ${amount} to wallet`,
        order_id: rpData.razorpayOrderId,
        handler: async (response) => {
          try {
            await api.post('/payment/topup-wallet', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount,
            });
            toast.success(`AED ${amount} added to wallet!`);
            fetchWallet();
          } catch { toast.error('Top-up verification failed'); }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#f97316' },
        modal: { ondismiss: () => setTopping(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Top-up failed');
    } finally { setTopping(false); }
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
          <div className="wbc-amount">AED {wallet?.balance?.toLocaleString('en-IN') || '0'}</div>
          <div className="wbc-sub">Use wallet balance for fast checkout</div>

          <div className="topup-section">
            <div className="topup-title">Add Money</div>
            <div className="topup-amounts">
              {TOPUP_AMOUNTS.map((a) => (
                <button
                  key={a}
                  className={`topup-chip ${topupAmount === a && !customAmount ? 'active' : ''}`}
                  onClick={() => { setTopupAmount(a); setCustomAmount(''); }}
                >AED {a}</button>
              ))}
            </div>
            <input
              className="topup-custom"
              type="number"
              placeholder="Or enter custom amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min={10}
            />
            <button className="btn btn-primary w-full" onClick={handleTopup} disabled={topping}>
              <Plus size={16} />
              {topping ? 'Processing...' : `Add AED ${customAmount || topupAmount} to Wallet`}
            </button>
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
                    <div className="txn-date">{new Date(txn.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
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
