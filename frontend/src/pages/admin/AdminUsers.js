import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, X, Check, Trash2, Search } from 'lucide-react';
import './AdminUsers.css';

const EMPTY_STAFF = { name: '', email: '', password: '', phone: '', apartmentNumber: 'STAFF' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_STAFF);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/admin/users/staff', form);
      setUsers(prev => [...prev, { ...data, role: 'staff' }]);
      toast.success('Staff account created ✅');
      setShowForm(false);
      setForm(EMPTY_STAFF);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create staff');
    } finally { setSaving(false); }
  };

  const handleDelete = async (userId) => {
    setDeleting(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User deleted');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally { setDeleting(null); }
  };

  const filtered = users
    .filter(u => filter === 'all' || u.role === filter)
    .filter(u => {
      if (!search) return true;
      const s = search.toLowerCase();
      return u.name?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.apartmentNumber?.toLowerCase().includes(s);
    });

  const residents = users.filter(u => u.role === 'resident').length;
  const staff = users.filter(u => u.role === 'staff').length;

  return (
    <div className="admin-users fade-up">
      <div className="au-header">
        <div>
          <div className="page-title">Users & Staff</div>
          <div className="page-subtitle">{residents} residents · {staff} staff members</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16}/> Add Staff
        </button>
      </div>

      {/* Search */}
      <div className="au-search">
        <Search size={16} className="search-icon"/>
        <input
          placeholder="Search by name, email or apartment..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter tabs */}
      <div className="au-filter-tabs">
        {['all', 'resident', 'staff'].map(f => (
          <button key={f} className={`au-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? `All (${users.length})` : f === 'resident' ? `Residents (${residents})` : `Staff (${staff})`}
          </button>
        ))}
      </div>

      {/* Staff form modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Add Staff Member</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label>Full Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Mohammed Ali"/></div>
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="staff@apartment.com"/></div>
              <div className="form-group"><label>Temporary Password</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} placeholder="Min 6 characters"/></div>
              <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+971 50 000 0000"/></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Check size={16}/> {saving ? 'Creating...' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Delete User</h3>
              <button className="modal-close" onClick={() => setConfirmDelete(null)}><X size={20}/></button>
            </div>
            <div style={{ padding: '8px 0 20px' }}>
              <p style={{ fontSize: 15, marginBottom: 8 }}>
                Are you sure you want to delete <strong>{confirmDelete.name}</strong>?
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                This will permanently remove their account. Their orders will remain in the system.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(confirmDelete._id)}
                disabled={deleting === confirmDelete._id}
              >
                <Trash2 size={15}/>
                {deleting === confirmDelete._id ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="spinner"/> : (
        filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No users found</h3>
            <p>{search ? 'Try a different search term' : 'No users in this category'}</p>
          </div>
        ) : (
          <div className="users-grid">
            {filtered.map(u => (
              <div key={u._id} className="user-card">
                <div className="uc-avatar">{u.name?.[0]?.toUpperCase()}</div>
                <div className="uc-info">
                  <div className="uc-name">{u.name}</div>
                  <div className="uc-email">{u.email}</div>
                  {u.phone && <div className="uc-phone">📞 {u.phone}</div>}
                  <div className="uc-apt">🏠 Apt {u.apartmentNumber}{u.block ? `, Block ${u.block}` : ''}</div>
                </div>
                <div className="uc-actions">
                  <span className={`badge ${u.role === 'staff' ? 'badge-confirmed' : 'badge-assigned'}`}>
                    {u.role}
                  </span>
                  <button
                    className="delete-user-btn"
                    onClick={() => setConfirmDelete(u)}
                    title="Delete user"
                  >
                    <Trash2 size={15}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
