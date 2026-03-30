import { useNotif } from '../../context/NotifContext';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const { notifications, markAllRead, markRead, unread } = useNotif();
  const navigate = useNavigate();

  const handleClick = async (notif) => {
    if (!notif.isRead) await markRead(notif._id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="notif-page fade-up">
      <div className="notif-header">
        <div>
          <div className="page-title">Notifications</div>
          <div className="page-subtitle">{unread > 0 ? `${unread} unread` : 'All caught up!'}</div>
        </div>
        {unread > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={52} strokeWidth={1} />
          <h3>No notifications</h3>
          <p>You're all caught up! Notifications about orders and activity will appear here.</p>
        </div>
      ) : (
        <div className="notif-list card">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`notif-item ${!n.isRead ? 'unread' : ''}`}
              onClick={() => handleClick(n)}
            >
              <div className="notif-icon">{n.icon || '🔔'}</div>
              <div className="notif-body">
                <div className="notif-title">{n.title}</div>
                <div className="notif-msg">{n.message}</div>
                <div className="notif-time">{new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
              {!n.isRead && <div className="notif-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
