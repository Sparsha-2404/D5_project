import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';
import './AdminReviews.css';

function Stars({ rating }) {
  return (
    <div className="stars-display">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} size={14} className={s <= rating ? 'filled' : ''} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avg: 0, total: 0 });

  useEffect(() => {
    api.get('/admin/reviews')
      .then(({ data }) => {
        setReviews(data);
        if (data.length > 0) {
          const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
          setStats({ avg: avg.toFixed(1), total: data.length });
        }
      })
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-reviews fade-up">
      <div className="page-title">Customer Reviews</div>
      <div className="page-subtitle">All service ratings and feedback</div>

      <div className="review-stats">
        <div className="card rs-card">
          <div className="rs-number">{stats.avg || '—'}</div>
          <div className="rs-stars"><Stars rating={Math.round(stats.avg)} /></div>
          <div className="rs-label">Average Rating</div>
        </div>
        <div className="card rs-card">
          <div className="rs-number">{stats.total}</div>
          <div className="rs-label">Total Reviews</div>
        </div>
        <div className="card rs-card">
          <div className="rs-number">{reviews.filter(r => r.rating >= 4).length}</div>
          <div className="rs-label">Positive Reviews (4★+)</div>
        </div>
        <div className="card rs-card">
          <div className="rs-number">{reviews.filter(r => r.rating <= 2).length}</div>
          <div className="rs-label">Needs Attention (≤2★)</div>
        </div>
      </div>

      {loading ? <div className="spinner" /> : reviews.length === 0 ? (
        <div className="empty-state"><Star size={48} strokeWidth={1} /><h3>No reviews yet</h3><p>Reviews from completed orders will appear here.</p></div>
      ) : (
        <div className="reviews-list">
          {reviews.map((r) => (
            <div key={r._id} className="review-card card">
              <div className="rc-header">
                <div className="rc-user">
                  <div className="rc-avatar">{r.user?.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div className="rc-name">{r.user?.name}</div>
                    <div className="rc-apt">Apt {r.user?.apartmentNumber}</div>
                  </div>
                </div>
                <div className="rc-meta">
                  <Stars rating={r.rating} />
                  <div className="rc-type">{r.order?.orderType?.replace('_', ' ')}</div>
                  <div className="rc-date">{new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                </div>
              </div>
              {r.comment && <div className="rc-comment">"{r.comment}"</div>}
              {r.staffRating && (
                <div className="rc-staff-rating">
                  <span>Staff Rating:</span> <Stars rating={r.staffRating} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
