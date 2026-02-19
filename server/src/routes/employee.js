const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const Asset = require('../models/Asset');

const router = express.Router();

// Get assets assigned to current employee
router.get('/assets', authMiddleware, requireRole('EMPLOYEE'), async (req, res) => {
  const list = await Asset.find({ currentEmployeeId: req.user._id }).lean();
  res.json({ data: list });
});

// Employee can create an order/request (basic)
router.post('/orders', authMiddleware, requireRole('EMPLOYEE'), async (req, res) => {
  // minimal stub for orders
  res.json({ ok: true, message: 'Order request created (demo)' });
});

module.exports = router;
