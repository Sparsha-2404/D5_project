import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Package, ChevronRight } from 'lucide-react';
import './OrdersPage.css';

const STATUS_ORDER = ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/orders/my')
      .then(({ data }) => setOrders(data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  if (orders.length === 0) {
    return (
      <div className="orders-empty fade-up">
        <Package size={64} strokeWidth={1} />
        <h2>No orders yet</h2>
        <p>Place your first order and track it here</p>
        <button className="btn btn-primary" onClick={() => navigate('/services')}>
          Browse Services
        </button>
      </div>
    );
  }

  return (
    <div className="orders-page fade-up">
      <div className="page-title">My Orders</div>
      <div className="page-subtitle">{orders.length} total orders</div>

      <div className="orders-list">
        {orders.map((order) => (
          <div
            key={order._id}
            className="order-card"
            onClick={() => navigate(`/orders/${order._id}`)}
          >
            <div className="order-left">
              <div className="order-type-badge">{order.orderType.replace('_', ' ')}</div>
              <div className="order-id">#{order._id.slice(-8).toUpperCase()}</div>
              <div className="order-items-preview">
                {order.items.slice(0, 2).map((i) => i.name).join(', ')}
                {order.items.length > 2 && ` +${order.items.length - 2} more`}
              </div>
              <div className="order-date">{new Date(order.createdAt).toLocaleString()}</div>
            </div>

            <div className="order-right">
              <span className={`badge badge-${order.status}`}>{order.status.replace('_', ' ')}</span>
              <div className="order-amount">AED {order.totalAmount.toLocaleString()}</div>
              <ChevronRight size={18} className="order-arrow" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
