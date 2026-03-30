import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import './CartPage.css';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="empty-state fade-up" style={{ minHeight: '60vh' }}>
        <ShoppingBag size={64} strokeWidth={1} />
        <h3>Your cart is empty</h3>
        <p>Browse our services and add items to your cart</p>
        <button className="btn btn-primary" onClick={() => navigate('/services')}>Browse Services</button>
      </div>
    );
  }

  return (
    <div className="cart-page fade-up">
      <div className="page-title">Your Cart</div>
      <div className="page-subtitle">{cart.length} item(s) · AED {cartTotal.toLocaleString()} total</div>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item._id} className="cart-item">
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">AED {item.price.toLocaleString()} {item.unit && `· ${item.unit}`}</div>
              </div>
              <div className="cart-item-actions">
                <div className="qty-control">
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1)}><Minus size={13} /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, item.quantity + 1)}><Plus size={13} /></button>
                </div>
                <div className="cart-item-total">AED {(item.price * item.quantity).toLocaleString()}</div>
                <button className="remove-btn" onClick={() => removeFromCart(item._id)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="card cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-line"><span>Subtotal</span><span>AED {cartTotal.toLocaleString()}</span></div>
          <div className="summary-line"><span>Delivery</span><span style={{ color: 'var(--success)', fontWeight: 600 }}>Free</span></div>
          <div className="summary-total"><span>Total</span><span>AED {cartTotal.toLocaleString()}</span></div>
          <button className="btn btn-primary btn-lg w-full" onClick={() => navigate('/checkout')}>
            Proceed to Checkout <ArrowRight size={16} />
          </button>
          <button className="btn btn-ghost w-full" onClick={() => navigate('/services')}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );
}
