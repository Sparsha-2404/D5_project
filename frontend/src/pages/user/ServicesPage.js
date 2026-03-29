import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { IMAGES } from '../../utils/images';
import toast from 'react-hot-toast';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import './ServicesPage.css';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'grocery', label: '🛒 Grocery' },
  { id: 'housekeeping', label: '🧹 Housekeeping' },
  { id: 'maintenance', label: '🔧 Maintenance' },
  { id: 'utility', label: '🚗 Utility' },
  { id: 'spa_wellness', label: '💆 Spa & Wellness' },
];

const CAT_INFO = {
  grocery:      { title: 'Fresh Groceries', sub: 'Farm-fresh produce delivered to your door', color: '#5A9E3A' },
  housekeeping: { title: 'Housekeeping', sub: 'Professional cleaning & laundry services', color: '#6B4F8A' },
  maintenance:  { title: 'Maintenance', sub: 'Expert repairs for your home', color: '#2E6FBF' },
  utility:      { title: 'Utility Services', sub: 'Car wash, moving & more', color: '#8A4F2E' },
  spa_wellness: { title: 'Spa & Wellness', sub: 'Premium self-care at your doorstep', color: '#8A2E6A' },
};

export default function ServicesPage() {
  const { category: paramCat } = useParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(paramCat || '');
  const { cart, addToCart, updateQuantity } = useCart();

  useEffect(() => { setActiveCategory(paramCat || ''); }, [paramCat]);

  useEffect(() => {
    setLoading(true);
    const params = activeCategory ? `?category=${activeCategory}` : '';
    api.get(`/services${params}`)
      .then(({ data }) => setServices(data))
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const getCartItem = (id) => cart.find(i => i._id === id);
  const handleAdd = (service) => { addToCart(service); toast.success(`${service.name} added to cart`); };

  const grouped = services.reduce((acc, s) => {
    const key = s.subCategory || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const bannerInfo = CAT_INFO[activeCategory];
  const bannerImg = IMAGES.serviceBanners[activeCategory];

  return (
    <div className="services-page fade-up">

      {/* Category banner photo */}
      {bannerInfo && bannerImg && (
        <div className="service-banner" style={{ backgroundImage: `url(${bannerImg})` }}>
          <div className="service-banner-overlay" style={{ '--bc': bannerInfo.color }} />
          <div className="service-banner-content">
            <h1 className="service-banner-title">{bannerInfo.title}</h1>
            <p className="service-banner-sub">{bannerInfo.sub}</p>
          </div>
        </div>
      )}

      {!bannerInfo && (
        <div>
          <div className="page-title">All Services</div>
          <div className="page-subtitle">Browse our full range of apartment services</div>
        </div>
      )}

      {/* Category filter pills */}
      <div className="cat-filter">
        {CATEGORIES.map(c => (
          <button key={c.id} className={`cat-pill ${activeCategory === c.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : services.length === 0 ? (
        <div className="empty-state">No services found.</div>
      ) : (
        Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="service-group">
            <h3 className="group-title">{group}</h3>
            <div className="services-grid">
              {items.map(service => {
                const cartItem = getCartItem(service._id);
                return (
                  <div key={service._id} className="service-card">
                    <div className="service-body">
                      <div className="service-name">{service.name}</div>
                      {service.description && <div className="service-desc">{service.description}</div>}
                      <div className="service-meta">
                        <span className="service-time">⏱ {service.estimatedTime}</span>
                        {service.unit && <span className="service-unit">{service.unit}</span>}
                      </div>
                    </div>
                    <div className="service-footer">
                      <div className="service-price">
                        {service.price === 0 ? 'Free' : `AED ${service.price.toLocaleString()}`}
                      </div>
                      {!cartItem ? (
                        <button className="btn btn-green btn-sm" onClick={() => handleAdd(service)}>
                          <ShoppingCart size={13} /> Add
                        </button>
                      ) : (
                        <div className="qty-control">
                          <button onClick={() => updateQuantity(service._id, cartItem.quantity - 1)}><Minus size={13} /></button>
                          <span>{cartItem.quantity}</span>
                          <button onClick={() => updateQuantity(service._id, cartItem.quantity + 1)}><Plus size={13} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
