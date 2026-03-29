const Notification = require('../models/Notification');

const createNotification = async (io, { userId, title, message, type, link, icon }) => {
  try {
    const notif = await Notification.create({ user: userId, title, message, type, link, icon });
    // Emit real-time to user's socket room
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', notif);
    }
    return notif;
  } catch (err) {
    console.error('Notification creation error:', err.message);
  }
};

module.exports = { createNotification };
