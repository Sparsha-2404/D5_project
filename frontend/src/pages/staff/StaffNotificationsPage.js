import { useNotif } from '../../context/NotifContext';
import { Bell, CheckCheck } from 'lucide-react';
import './StaffPages.css';

export default function StaffNotificationsPage() {
  const { notifications, markAllRead, markRead, unread } = useNotif();
  return (
    <div className="staff-page fade-up">
      <div className="staff-page-header">
        <div><h1>Notifications</h1><p>{unread > 0 ? `${unread} unread` : 'All caught up!'}</p></div>
        {unread > 0 && <button className="btn btn-outline btn-sm" onClick={markAllRead}><CheckCheck size={14} /> Mark all read</button>}
      </div>
      {notifications.length === 0 ? (
        <div className="empty-state"><Bell size={56} strokeWidth={1} /><h3>No notifications yet</h3><p>Task assignments and updates will appear here</p></div>
      ) : (
        <div className="notif-list-card">
          {notifications.map(n => (
            <div key={n._id} className={`notif-row ${!n.isRead ? 'unread' : ''}`} onClick={() => !n.isRead && markRead(n._id)}>
              <div className="notif-emoji">{n.icon || '🔔'}</div>
              <div className="notif-text">
                <div className="notif-ntitle">{n.title}</div>
                <div className="notif-nmsg">{n.message}</div>
                <div className="notif-ntime">{new Date(n.createdAt).toLocaleString('en-AE', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
              {!n.isRead && <div className="notif-unread-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
