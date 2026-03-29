import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, X, Check } from 'lucide-react';
import './AdminFacilities.css';

const EMPTY = { name: '', type: 'gym', description: '', capacity: 10 };

export default function AdminFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('facilities');

  useEffect(() => {
    Promise.all([api.get('/facilities'), api.get('/facilities/all-bookings')])
      .then(([f, b]) => { setFacilities(f.data); setBookings(b.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/facilities', { ...form, capacity: Number(form.capacity) });
      setFacilities((prev) => [...prev, data]);
      toast.success('Facility added');
      setShowForm(false);
      setForm(EMPTY);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const icons = { gym: '🏋️', pool: '🏊', clubhouse: '🎉', other: '🏢' };

  return (
    <div className="admin-facilities fade-up">
      <div className="af-header">
        <div>
          <div className="page-title">Facilities</div>
          <div className="page-subtitle">Manage apartment amenities & bookings</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Facility
        </button>
      </div>

      <div className="af-tabs">
        <button className={`au-tab ${tab === 'facilities' ? 'active' : ''}`} onClick={() => setTab('facilities')}>Facilities ({facilities.length})</button>
        <button className={`au-tab ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>All Bookings ({bookings.length})</button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Add Facility</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {['gym', 'pool', 'clubhouse', 'other'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Description</label><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="form-group"><label>Max Capacity</label><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} min={1} /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}><Check size={16} /> {saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="spinner" /> : tab === 'facilities' ? (
        <div className="fac-grid">
          {facilities.map((f) => (
            <div key={f._id} className="fac-admin-card">
              <div className="fac-admin-icon">{icons[f.type]}</div>
              <div>
                <div className="fac-admin-name">{f.name}</div>
                <div className="fac-admin-desc">{f.description}</div>
                <div className="fac-admin-cap">Capacity: {f.capacity}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bookings-table-wrap">
          <table className="bookings-table">
            <thead>
              <tr><th>Resident</th><th>Facility</th><th>Date</th><th>Slot</th><th>Status</th></tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td><div className="bk-name">{b.user?.name}</div><div className="bk-apt">Apt {b.user?.apartmentNumber}</div></td>
                  <td>{icons[b.facility?.type]} {b.facility?.name}</td>
                  <td>{new Date(b.date).toLocaleDateString()}</td>
                  <td>{b.timeSlot}</td>
                  <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
