import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import './AdminServices.css';

const CATEGORIES = ['grocery', 'housekeeping', 'maintenance', 'utility', 'spa_wellness'];
const EMPTY = { name: '', description: '', category: 'grocery', subCategory: '', price: '', unit: '', estimatedTime: '30-60 mins', isAvailable: true };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    api.get('/services' + (activeCategory ? `?category=${activeCategory}` : ''))
      .then(({ data }) => setServices(data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (s) => { setForm({ ...s, price: String(s.price) }); setEditing(s._id); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price) };
      if (editing) {
        const { data } = await api.put(`/services/${editing}`, payload);
        setServices((prev) => prev.map((s) => (s._id === editing ? data : s)));
        toast.success('Service updated');
      } else {
        const { data } = await api.post('/services', payload);
        setServices((prev) => [data, ...prev]);
        toast.success('Service created');
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await api.delete(`/services/${id}`);
      setServices((prev) => prev.filter((s) => s._id !== id));
      toast.success('Service deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleToggle = async (service) => {
    try {
      const { data } = await api.put(`/services/${service._id}`, { isAvailable: !service.isAvailable });
      setServices((prev) => prev.map((s) => (s._id === service._id ? data : s)));
    } catch {
      toast.error('Toggle failed');
    }
  };

  return (
    <div className="admin-services fade-up">
      <div className="as-header">
        <div>
          <div className="page-title">Services & Inventory</div>
          <div className="page-subtitle">Manage all service offerings</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* Category filter */}
      <div className="cat-filter">
        <button className={`cat-pill ${activeCategory === '' ? 'active' : ''}`} onClick={() => setActiveCategory('')}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} className={`cat-pill ${activeCategory === c ? 'active' : ''}`} onClick={() => setActiveCategory(c)}>
            {c.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editing ? 'Edit Service' : 'Add New Service'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Sub Category</label>
                  <input value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Price (AED )</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Unit (e.g. per kg)</label>
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Estimated Time</label>
                  <input value={form.estimatedTime} onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Check size={16} /> {saving ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="spinner" /> : (
        <div className="services-table-wrap">
          <table className="services-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Sub-Category</th>
                <th>Price</th>
                <th>Est. Time</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s._id}>
                  <td className="svc-name">{s.name}</td>
                  <td><span className="type-pill">{s.category.replace('_', ' ')}</span></td>
                  <td className="text-muted">{s.subCategory}</td>
                  <td className="font-bold">{s.price === 0 ? 'Free' : `AED ${s.price}`}</td>
                  <td className="text-muted">{s.estimatedTime}</td>
                  <td>
                    <button className={`toggle-btn ${s.isAvailable ? 'on' : 'off'}`} onClick={() => handleToggle(s)}>
                      {s.isAvailable ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="icon-btn edit-btn" onClick={() => openEdit(s)}><Pencil size={15} /></button>
                      <button className="icon-btn delete-btn" onClick={() => handleDelete(s._id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
