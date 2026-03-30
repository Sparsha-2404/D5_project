import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotifContext = createContext();

export const NotifProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useSocket();
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    } catch {}
  }, [user]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    const handler = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnread((n) => n + 1);
    };
    socket.on('new_notification', handler);
    return () => socket.off('new_notification', handler);
  }, [socketRef]);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  };

  return (
    <NotifContext.Provider value={{ unread, notifications, fetchNotifs, markAllRead, markRead }}>
      {children}
    </NotifContext.Provider>
  );
};

export const useNotif = () => useContext(NotifContext);
