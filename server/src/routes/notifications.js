const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const list = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ data: list });
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
  const id = req.params.id;
  await Notification.findByIdAndUpdate(id, { read: true });
  res.json({ ok: true });
});

module.exports = router;
