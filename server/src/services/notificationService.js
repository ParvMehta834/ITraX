const Notification = require('../models/Notification');
const MockDB = require('../config/mockDb');
const { isConnected } = require('../config/db');
const Asset = require('../models/Asset');
const License = require('../models/License');

const mockNotifications = [];

const normalize = (value) => String(value || '');
const normalizeRole = (value) => String(value || '').trim().toUpperCase();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const isWithinThirtyDays = (dateLike) => {
  const value = new Date(dateLike || 0).getTime();
  if (!value) return false;
  const now = Date.now();
  return value > now && value <= now + THIRTY_DAYS_MS;
};

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
  const role = normalizeRole(user?.role);
  const orgId = normalize(user?.orgId);

  return mockNotifications
    .filter((item) => {
      if (item.orgId && orgId && normalize(item.orgId) !== orgId) return false;
      if (item.userId && normalize(item.userId) === userId) return true;
      if (item.targetRole && normalizeRole(item.targetRole) === role) return true;
      return false;
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

const markMockRead = (notificationId, user) => {
  const userId = normalize(user?._id || user?.id);
  const role = normalizeRole(user?.role);
  const orgId = normalize(user?.orgId);

  const notification = mockNotifications.find((item) => item._id === notificationId);
  if (!notification) return false;

  if (notification.orgId && orgId && normalize(notification.orgId) !== orgId) {
    return false;
  }

  const isOwner = notification.userId && normalize(notification.userId) === userId;
  const isTargetRole = notification.targetRole && normalizeRole(notification.targetRole) === role;
  if (!isOwner && !isTargetRole) return false;

  notification.read = true;
  notification.updatedAt = new Date();
  return true;
};

const buildAutoExpiryNotifications = async (user) => {
  if (normalizeRole(user?.role) !== 'ADMIN') return [];

  const orgId = user?.orgId;
  const items = [];

  if (isConnected()) {
    const [assets, licenses] = await Promise.all([
      Asset.find({ orgId, isDeleted: { $ne: true } })
        .select('_id assetTag name warrantyExpiry warrantyExpiryDate updatedAt createdAt')
        .lean(),
      License.find({ orgId })
        .select('_id name renewalDate expirationDate updatedAt createdAt')
        .lean(),
    ]);

    assets.forEach((asset) => {
      const expiry = asset.warrantyExpiryDate || asset.warrantyExpiry;
      if (!isWithinThirtyDays(expiry)) return;
      items.push({
        _id: `auto_asset_exp_${asset._id}`,
        read: false,
        title: 'Asset Warranty Expiring Soon',
        message: `${asset.assetTag || asset.name || 'An asset'} warranty expires soon.`,
        type: 'EXPIRY',
        createdAt: new Date(asset.updatedAt || asset.createdAt || Date.now()),
      });
    });

    licenses.forEach((license) => {
      const expiry = license.renewalDate || license.expirationDate;
      if (!isWithinThirtyDays(expiry)) return;
      items.push({
        _id: `auto_license_exp_${license._id}`,
        read: false,
        title: 'License Expiring Soon',
        message: `${license.name || 'A license'} is expiring soon.`,
        type: 'EXPIRY',
        createdAt: new Date(license.updatedAt || license.createdAt || Date.now()),
      });
    });
  } else {
    const orgIdNormalized = normalize(orgId);

    MockDB.getAssets()
      .filter((asset) => normalize(asset.orgId) === orgIdNormalized)
      .forEach((asset) => {
        const expiry = asset.warrantyExpiryDate || asset.warrantyExpiry;
        if (!isWithinThirtyDays(expiry)) return;
        items.push({
          _id: `auto_asset_exp_${asset._id}`,
          read: false,
          title: 'Asset Warranty Expiring Soon',
          message: `${asset.assetTag || asset.name || 'An asset'} warranty expires soon.`,
          type: 'EXPIRY',
          createdAt: new Date(asset.updatedAt || asset.createdAt || Date.now()),
        });
      });

    MockDB.getLicenses()
      .filter((license) => normalize(license.orgId) === orgIdNormalized)
      .forEach((license) => {
        const expiry = license.renewalDate || license.expirationDate;
        if (!isWithinThirtyDays(expiry)) return;
        items.push({
          _id: `auto_license_exp_${license._id}`,
          read: false,
          title: 'License Expiring Soon',
          message: `${license.name || 'A license'} is expiring soon.`,
          type: 'EXPIRY',
          createdAt: new Date(license.updatedAt || license.createdAt || Date.now()),
        });
      });
  }

  return items;
};

const createNotification = async ({ userId, targetRole, orgId, title, message, type = 'INFO' }) => {
  if (isConnected()) {
    const payload = {
      orgId: orgId || null,
      title,
      message,
      type,
      createdAt: new Date(),
      read: false,
      ...(userId ? { userId } : {}),
      ...(targetRole ? { targetRole: normalizeRole(targetRole) } : {})
    };
    return Notification.create(payload);
  }

  return createMockNotification({
    orgId: orgId || null,
    userId: userId || null,
    targetRole: targetRole ? normalizeRole(targetRole) : null,
    title,
    message,
    type,
  });
};

const listNotificationsForUser = async (user) => {
  if (isConnected()) {
    const userId = user?._id;
    const role = normalizeRole(user?.role);
    const orgId = user?.orgId;

    const list = await Notification.find({
      orgId,
      $or: [
        { userId },
        { targetRole: role }
      ]
    }).sort({ createdAt: -1 }).limit(50).lean();

    const auto = await buildAutoExpiryNotifications(user);
    return [...auto, ...list]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 50);
  }

  const base = listMockNotificationsForUser(user);
  const auto = await buildAutoExpiryNotifications(user);
  return [...auto, ...base].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 50);
};

const markNotificationRead = async (notificationId, user) => {
  if (String(notificationId || '').startsWith('auto_')) {
    return true;
  }

  if (isConnected()) {
    const role = normalizeRole(user?.role);
    const orgId = user?.orgId;
    await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        orgId,
        $or: [{ userId: user._id }, { targetRole: role }]
      },
      { read: true }
    );
    return true;
  }

  return markMockRead(notificationId, user);
};

const markAllNotificationsRead = async (user) => {
  if (isConnected()) {
    const role = normalizeRole(user?.role);
    const orgId = user?.orgId;
    await Notification.updateMany(
      {
        orgId,
        read: false,
        $or: [{ userId: user._id }, { targetRole: role }]
      },
      { read: true }
    );
    return true;
  }

  const userId = normalize(user?._id || user?.id);
  const role = normalizeRole(user?.role);
  const orgId = normalize(user?.orgId);

  mockNotifications.forEach((item) => {
    if (item.orgId && orgId && normalize(item.orgId) !== orgId) return;
    const isOwner = item.userId && normalize(item.userId) === userId;
    const isTargetRole = item.targetRole && normalizeRole(item.targetRole) === role;
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
