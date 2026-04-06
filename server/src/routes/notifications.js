const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  listNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../services/notificationService');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const list = await listNotificationsForUser(req.user);
    res.json({ data: list });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    await markNotificationRead(id, req.user);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
});

router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await markAllNotificationsRead(req.user);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all notifications as read', error: error.message });
  }
});

module.exports = router;
