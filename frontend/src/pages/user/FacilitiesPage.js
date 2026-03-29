import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { IMAGES } from '../../utils/images';
import toast from 'react-hot-toast';
import { CalendarCheck, Clock, XCircle, Users } from 'lucide-react';
import './FacilitiesPage.css';

const TIME_SLOTS = ['06:00-07:00','07:00-08:00','08:00-09:00','09:00-10:00','10:00-11:00','11:00-12:00','14:00-15:00','15:00-16:00','16:00-17:00','17:00-18:00','18:00-19:00','19:00-20:00'];

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ date:'', timeSlot:'' });
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState('book');

  useEffect(() => {
    Promise.all([api.get('/facilities'), api.get('/facilities/my-bookings')])
      .then(([f,b]) => { setFacilities(f.data); setMyBookings(b.data); })
      .catch(() => toast.error('Failed to load facilities'))
      .finally(() => setLoading(false));
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selected) return toast.error('Select a facility');
    setSubmitting(true);
    try {
      const { data } = await api.post('/facilities/book', { facilityId: selected._id, date: form.date, timeSlot: form.timeSlot });
      setMyBookings(prev => [data, ...prev]);
      toast.success('Facility booked! Awaiting confirmation.');
      setSelected(null); setForm({ date:'', timeSlot:'' }); setTab('my');
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed'); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/facilities/bookings/${id}/cancel`);
      setMyBookings(prev => prev.map(b => b._id === id ? { ...b, status:'cancelled' } : b));
      toast.success('Booking cancelled');
    } catch { toast.error('Failed to cancel'); }
  };

  if (loading) return <div className="spinner" />;
  const facilityImg = (type) => IMAGES.facilities[type] || IMAGES.facilities.other;

  return (
    <div className="facilities-page fade-up">
      <div className="page-title">Facilities</div>
      <div className="page-subtitle">Book our premium amenities</div>

      <div className="fac-tabs">
        <button className={`fac-tab ${tab==='book'?'active':''}`} onClick={() => setTab('book')}>Book a Facility</button>
        <button className={`fac-tab ${tab==='my'?'active':''}`} onClick={() => setTab('my')}>
          My Bookings {myBookings.filter(b=>b.status!=='cancelled').length > 0 && (
            <span className="fac-count">{myBookings.filter(b=>b.status!=='cancelled').length}</span>
          )}
        </button>
      </div>

      {tab === 'book' && (
        <div className="fac-book-layout">
          <div className="fac-list">
            {facilities.map(f => (
              <div key={f._id} className={`fac-card ${selected?._id===f._id?'selected':''}`} onClick={() => setSelected(f)}>
                <div className="fac-card-img-wrap">
                  <img src={facilityImg(f.type)} alt={f.name} className="fac-card-img" onError={e => { e.target.style.display='none'; }} />
                  <div className="fac-card-img-overlay" />
                  {selected?._id===f._id && <div className="fac-selected-badge">✓ Selected</div>}
                </div>
                <div className="fac-card-body">
                  <div className="fac-name">{f.name}</div>
                  <div className="fac-desc">{f.description}</div>
                  <div className="fac-meta">
                    <span><Users size={12}/> Max {f.capacity}</span>
                    {f.operatingHours && <span><Clock size={12}/> {f.operatingHours}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="card fac-form">
              <h3>Book: {selected.name}</h3>
              <form onSubmit={handleBook}>
                <div className="form-group">
                  <label>Select Date</label>
                  <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Select Time Slot</label>
                  <div className="time-slots">
                    {TIME_SLOTS.map(slot => (
                      <button key={slot} type="button"
                        className={`time-slot ${form.timeSlot===slot?'active':''}`}
                        onClick={() => setForm({ ...form, timeSlot: slot })}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={submitting || !form.date || !form.timeSlot}>
                  <CalendarCheck size={16} /> {submitting ? 'Booking...' : 'Request Booking'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {tab === 'my' && (
        <div className="my-bookings">
          {myBookings.length === 0 ? (
            <div className="empty-state"><CalendarCheck size={48} strokeWidth={1}/><h3>No bookings yet</h3><p>Book a facility above!</p></div>
          ) : myBookings.map(b => (
            <div key={b._id} className={`booking-card ${b.status}`}>
              <div className="booking-img-wrap">
                <img src={facilityImg(b.facility?.type)} alt={b.facility?.name} className="booking-img" onError={e => e.target.style.display='none'} />
              </div>
              <div className="booking-info">
                <div className="booking-fac">{b.facility?.name}</div>
                <div className="booking-meta">📅 {new Date(b.date).toLocaleDateString()} &nbsp;|&nbsp; ⏰ {b.timeSlot}</div>
                {b.adminNote && <div className="booking-admin-note">💬 {b.adminNote}</div>}
              </div>
              <div className="booking-actions">
                <span className={`badge badge-${b.status}`}>{b.status}</span>
                {b.status==='pending' && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleCancel(b._id)}>
                    <XCircle size={13}/> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
