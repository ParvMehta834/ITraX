const Notification = require('../models/Notification');
const MockDB = require('../config/mockDb');
const { isConnected } = require('../config/db');

const mockNotifications = [];

const normalize = (value) => String(value || '');

const createMockNotification = (payload) => {
  const item = {
    _id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    read: false,
    createdAt: new Date(),
    ...payload,
  };
  mockNotifications.push(item);
  return item;
};

const listMockNotificationsForUser = (user) => {
  const userId = normalize(user?._id || user?.id);
  const role = normalize(user?.role);

  return mockNotifications
    .filter((item) => {
      if (item.userId && normalize(item.userId) === userId) return true;
      if (item.targetRole && normalize(item.targetRole) === role) return true;
      return false;
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

const markMockRead = (notificationId, user) => {
  const userId = normalize(user?._id || user?.id);
  const role = normalize(user?.role);

  const notification = mockNotifications.find((item) => item._id === notificationId);
  if (!notification) return false;

  const isOwner = notification.userId && normalize(notification.userId) === userId;
  const isTargetRole = notification.targetRole && normalize(notification.targetRole) === role;
  if (!isOwner && !isTargetRole) return false;

  notification.read = true;
  notification.updatedAt = new Date();
  return true;
};

const createNotification = async ({ userId, targetRole, title, message, type = 'INFO' }) => {
  if (isConnected()) {
    const payload = {
      title,
      message,
      type,
      createdAt: new Date(),
      read: false,
      ...(userId ? { userId } : {})
    };
    return Notification.create(payload);
  }

  return createMockNotification({
    userId: userId || null,
    targetRole: targetRole || null,
    title,
    message,
    type,
  });
};

const listNotificationsForUser = async (user) => {
  if (isConnected()) {
    return Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50).lean();
  }

  const base = listMockNotificationsForUser(user);

  // Add expiring license notifications for admin users in mock mode.
  if (normalize(user?.role) === 'ADMIN') {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const expiring = MockDB.getLicenses().filter((license) => {
      const renewal = new Date(license.renewalDate || license.expirationDate || 0).getTime();
      return renewal && renewal > now && renewal <= now + thirtyDays;
    });

    const generated = expiring.map((license) => ({
      _id: `auto_exp_${license._id}`,
      read: false,
      title: 'License Expiring Soon',
      message: `${license.name || 'A license'} is expiring soon.`,
      type: 'EXPIRY',
      createdAt: new Date(license.updatedAt || license.createdAt || Date.now())
    }));

    return [...generated, ...base].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 50);
  }

  return base.slice(0, 50);
};

const markNotificationRead = async (notificationId, user) => {
  if (isConnected()) {
    await Notification.findOneAndUpdate({ _id: notificationId, userId: user._id }, { read: true });
    return true;
  }

  // Auto-generated mock IDs are synthetic and considered read-only.
  if (String(notificationId || '').startsWith('auto_exp_')) {
    return true;
  }

  return markMockRead(notificationId, user);
};

const markAllNotificationsRead = async (user) => {
  if (isConnected()) {
    await Notification.updateMany({ userId: user._id, read: false }, { read: true });
    return true;
  }

  const userId = normalize(user?._id || user?.id);
  const role = normalize(user?.role);

  mockNotifications.forEach((item) => {
    const isOwner = item.userId && normalize(item.userId) === userId;
    const isTargetRole = item.targetRole && normalize(item.targetRole) === role;
    if (isOwner || isTargetRole) {
      item.read = true;
      item.updatedAt = new Date();
    }
  });
  return true;
};

module.exports = {
  createNotification,
  listNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
};
