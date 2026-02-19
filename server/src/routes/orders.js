const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const CompanyOrder = require('../models/CompanyOrder');
const { Parser } = require('json2csv');

const router = express.Router();

// Validation helper
const validateOrder = (data) => {
  const errors = {};
  if (!data.assetName) errors.assetName = 'Asset name is required';
  if (!data.quantity || data.quantity < 1) errors.quantity = 'Quantity must be at least 1';
  if (!data.supplier) errors.supplier = 'Supplier is required';
  if (!data.estimatedDelivery) errors.estimatedDelivery = 'Estimated delivery date is required';
  if (!data.currentLocation) errors.currentLocation = 'Current location is required';
  if (data.status && !['Ordered', 'Processing', 'Shipped', 'InTransit', 'OutForDelivery', 'Delivered'].includes(data.status)) {
    errors.status = 'Invalid status';
  }
  return errors;
};

// Generate unique order ID
const generateOrderId = async () => {
  const count = await CompanyOrder.countDocuments();
  const timestamp = Date.now().toString().slice(-6);
  return `ORD-${timestamp}-${count + 1}`;
};

// GET /api/orders - Get all orders with search, filters, pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { assetName: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) filter.status = status;

    const total = await CompanyOrder.countDocuments(filter);
    const data = await CompanyOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'firstName lastName email')
      .lean();

    res.json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/orders - Create order (Admin only)
router.post('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { orderId, assetName, quantity, supplier, orderDate, estimatedDelivery, currentLocation, status, notes } = req.body;

    const errors = validateOrder({ assetName, quantity, supplier, estimatedDelivery, currentLocation, status });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const finalOrderId = orderId || (await generateOrderId());

    // Check if order ID already exists
    const existing = await CompanyOrder.findOne({ orderId: finalOrderId });
    if (existing) {
      return res.status(400).json({ message: 'Order ID already exists' });
    }

    // Initialize tracking history with first stage
    const trackingHistory = [
      {
        stage: status || 'Ordered',
        date: new Date()
      }
    ];

    const order = await CompanyOrder.create({
      orderId: finalOrderId,
      assetName,
      quantity,
      supplier,
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      estimatedDelivery: new Date(estimatedDelivery),
      currentLocation,
      status: status || 'Ordered',
      trackingHistory,
      notes,
      createdBy: req.user._id
    });

    const populated = await order.populate('createdBy', 'firstName lastName email');

    res.status(201).json({ order: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await CompanyOrder.findById(req.params.id).populate('createdBy', 'firstName lastName email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/orders/:id - Update order (Admin only)
router.put('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { assetName, quantity, supplier, estimatedDelivery, currentLocation, status } = req.body;

    const errors = validateOrder({ assetName, quantity, supplier, estimatedDelivery, currentLocation, status });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const order = await CompanyOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/orders/:id/status - Update order status and tracking (Admin only)
router.patch('/:id/status', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['Ordered', 'Processing', 'Shipped', 'InTransit', 'OutForDelivery', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await CompanyOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Add new tracking history entry
    order.status = status;
    order.trackingHistory.push({
      stage: status,
      date: new Date()
    });

    await order.save();
    const populated = await order.populate('createdBy', 'firstName lastName email');

    res.json({ order: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/orders/:id - Delete order (Admin only)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const order = await CompanyOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/orders/export - Export orders as CSV (Admin only)
router.get('/export/download', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { search, status } = req.query;

    // Build filter (same as GET /orders)
    const filter = {};
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { assetName: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) filter.status = status;

    const orders = await CompanyOrder.find(filter).lean();

    if (orders.length === 0) {
      return res.json({ message: 'No orders to export' });
    }

    const fields = ['orderId', 'assetName', 'quantity', 'supplier', 'orderDate', 'estimatedDelivery', 'currentLocation', 'status'];
    const parser = new Parser({ fields });
    const csv = parser.parse(orders);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders-export.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
