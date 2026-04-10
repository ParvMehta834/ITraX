const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware, requireRole } = require('../middleware/auth');
const CompanyOrder = require('../models/CompanyOrder');
const Asset = require('../models/Asset');
const MockDB = require('../config/mockDb');
const { isConnected } = require('../config/db');
const { Parser } = require('json2csv');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

const router = express.Router();

// Validation helper
const validateOrder = (data) => {
  const errors = {};
  if (!data.assetName) errors.assetName = 'Asset name is required';
  if (!data.quantity || data.quantity < 1) errors.quantity = 'Quantity must be at least 1';
  if (!data.supplier) errors.supplier = 'Supplier is required';
  if (!data.estimatedDelivery) errors.estimatedDelivery = 'Estimated delivery date is required';
  if (!data.currentLocation) errors.currentLocation = 'Current location is required';
  if (!data.assignedEmployeeId && !data.assignedEmployeeName) {
    errors.assignedEmployee = 'Assigned employee name or id is required';
  }
  if (data.status && !['Ordered', 'Processing', 'Shipped', 'InTransit', 'OutForDelivery', 'Delivered'].includes(data.status)) {
    errors.status = 'Invalid status';
  }
  return errors;
};

const normalizeOrgId = (orgId) => String(orgId || '');
const normalizeRole = (role) => String(role || '').trim().toUpperCase();

const userOwnsOrder = (order, user) => {
  if (!order || !user) return false;
  const userId = String(user._id || user.id || '');
  const orderAssignedUserId = String(order.assignedEmployeeId?._id || order.assignedEmployeeId || '');
  if (orderAssignedUserId && userId && orderAssignedUserId === userId) return true;
  if (order.assignedEmployeeCode && user.employeeCode && String(order.assignedEmployeeCode) === String(user.employeeCode)) return true;
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
  return Boolean(fullName) && String(order.assignedEmployeeName || '').trim().toLowerCase() === fullName;
};

// Generate unique order ID
const generateOrderId = async () => {
  const count = await CompanyOrder.countDocuments();
  const timestamp = Date.now().toString().slice(-6);
  return `ORD-${timestamp}-${count + 1}`;
};

const isValidObjectId = (value) => {
  if (!value) return false;
  return mongoose.Types.ObjectId.isValid(String(value));
};

const syncDeliveredOrderToAsset = async (order, reqUser) => {
  const rawAssignedEmployeeId = order?.assignedEmployeeId?._id || order?.assignedEmployeeId || null;
  const assignedEmployeeId = isValidObjectId(rawAssignedEmployeeId) ? String(rawAssignedEmployeeId) : null;
  if (order?.status !== 'Delivered' || !assignedEmployeeId) {
    return null;
  }

  const resolvedOrgId = order?.orgId || reqUser?.orgId;
  if (!resolvedOrgId) {
    return null;
  }

  let resolvedEmployeeName = String(order.assignedEmployeeName || '').trim();
  if (!resolvedEmployeeName && isConnected()) {
    const assignedUser = await User.findById(assignedEmployeeId).select('firstName lastName').lean();
    resolvedEmployeeName = `${assignedUser?.firstName || ''} ${assignedUser?.lastName || ''}`.trim();
  }

  const assetPayload = {
    orgId: resolvedOrgId,
    assetId: order.orderId,
    assetTag: order.orderId,
    name: order.assetName,
    category: 'Device',
    manufacturer: order.supplier,
    status: 'Assigned',
    currentLocation: order.currentLocation,
    currentEmployee: resolvedEmployeeName,
    assignedToEmployeeId: assignedEmployeeId,
    notes: `Delivered via order ${order.orderId}`,
  };

  let asset;
  if (isConnected()) {
    asset = await Asset.findOneAndUpdate(
      { orgId: resolvedOrgId, assetTag: order.orderId },
      {
        $set: {
          ...assetPayload,
          isDeleted: false,
          updatedAt: new Date(),
          updatedBy: reqUser._id,
        },
        $setOnInsert: {
          createdAt: new Date(),
          createdBy: reqUser._id,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    await CompanyOrder.findByIdAndUpdate(order._id, { isDeleted: true });
  } else {
    const orgId = normalizeOrgId(resolvedOrgId);
    const existingAsset = MockDB.getAssets().find((candidate) => {
      const candidateOrgId = normalizeOrgId(candidate.orgId);
      const candidateTag = String(candidate.assetTag || candidate.assetId || '');
      return candidateOrgId === orgId && candidateTag === String(order.orderId || '');
    });

    if (existingAsset) {
      asset = MockDB.updateAsset(existingAsset._id, {
        ...assetPayload,
        location: order.currentLocation,
        description: assetPayload.notes,
      });
    } else {
      asset = MockDB.createAsset({
        ...assetPayload,
        location: order.currentLocation,
        description: assetPayload.notes,
      });
    }

    const existingOrder = MockDB.getOrderById(order._id);
    if (existingOrder) {
      existingOrder.isDeleted = true;
      MockDB.updateOrder(order._id, existingOrder);
    }
  }

  await createNotification({
    orgId: resolvedOrgId,
    userId: assignedEmployeeId,
    title: 'Asset Delivered and Added',
    message: `${order.assetName} has been delivered to you and added to your assets.`,
    type: 'ASSET'
  });

  return asset;
};

// GET /api/orders - Get all orders with search, filters, pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    if (isConnected()) {
      // Build filter
      const filter = { isDeleted: { $ne: true } };
      if (req.user?.orgId) filter.orgId = req.user.orgId;
      if (search) {
        filter.$or = [
          { orderId: { $regex: search, $options: 'i' } },
          { assetName: { $regex: search, $options: 'i' } },
          { supplier: { $regex: search, $options: 'i' } },
          { assignedEmployeeName: { $regex: search, $options: 'i' } },
          { assignedEmployeeCode: { $regex: search, $options: 'i' } }
        ];
      }
      if (status) filter.status = status;

      if (req.user?.role === 'EMPLOYEE') {
        filter.$or = [
          { assignedEmployeeId: req.user._id },
          { assignedEmployeeCode: req.user.employeeCode || '__NO_CODE__' },
          { assignedEmployeeName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() }
        ];
      }

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
    } else {
      // Use mock database
      let allOrders = MockDB.getOrders().filter((order) => {
        if (order.isDeleted) return false;
        if (!req.user?.orgId) return true;
        return normalizeOrgId(order.orgId || req.user.orgId) === normalizeOrgId(req.user.orgId);
      });

      if (allOrders.length === 0) {
        let demoEmployee = MockDB.getUsers().find((u) => u.role === 'EMPLOYEE');
        if (!demoEmployee) {
          demoEmployee = MockDB.createUser({
            orgId: req.user.orgId,
            role: 'EMPLOYEE',
            firstName: 'Rahul',
            lastName: 'Sharma',
            employeeCode: '100001',
            email: 'rahul@itrax.local',
            passwordHash: req.user.passwordHash || '',
            status: 'ACTIVE'
          });
        }
        const demoName = `${demoEmployee.firstName || ''} ${demoEmployee.lastName || ''}`.trim() || 'Employee';
        MockDB.createOrder({
          orgId: req.user.orgId,
          orderId: `ORD-${String(Date.now()).slice(-6)}-1`,
          assetName: 'ThinkPad E14',
          quantity: 1,
          supplier: 'Lenovo',
          assignedEmployeeId: demoEmployee._id,
          assignedEmployeeCode: demoEmployee.employeeCode || '',
          assignedEmployeeName: demoName,
          orderDate: new Date(),
          estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          currentLocation: 'Warehouse',
          status: 'Processing',
          trackingHistory: [
            { stage: 'Ordered', date: new Date() },
            { stage: 'Processing', date: new Date() }
          ],
          notes: 'Demo seeded order'
        });

        allOrders = MockDB.getOrders().filter((order) => {
          if (!req.user?.orgId) return true;
          return normalizeOrgId(order.orgId || req.user.orgId) === normalizeOrgId(req.user.orgId);
        });
      }

      if (req.user?.role === 'EMPLOYEE') {
        allOrders = allOrders.filter((order) => userOwnsOrder(order, req.user));
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        allOrders = allOrders.filter(o =>
          o.orderId?.toLowerCase().includes(searchLower) ||
          o.assetName?.toLowerCase().includes(searchLower) ||
          o.supplier?.toLowerCase().includes(searchLower) ||
          o.assignedEmployeeName?.toLowerCase().includes(searchLower) ||
          o.assignedEmployeeCode?.toLowerCase().includes(searchLower)
        );
      }
      if (status) {
        allOrders = allOrders.filter(o => o.status === status);
      }

      // Sort by creation date descending
      allOrders = allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const total = allOrders.length;
      const data = allOrders.slice(skip, skip + limitNum);

      res.json({
        data,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/orders - Create order (Admin only)
router.post('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { orderId, assetName, quantity, supplier, orderDate, estimatedDelivery, currentLocation, status, notes, assignedEmployeeId, assignedEmployeeName } = req.body;

    const errors = validateOrder({ assetName, quantity, supplier, estimatedDelivery, currentLocation, status, assignedEmployeeId, assignedEmployeeName });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    let resolvedEmployeeId = null;
    let resolvedEmployeeCode = '';
    let resolvedEmployeeName = (assignedEmployeeName || '').trim();

    if (assignedEmployeeId) {
      const assignedUser = isConnected()
        ? await User.findById(assignedEmployeeId).select('_id firstName lastName employeeCode role orgId').lean()
        : MockDB.getUsers().find((u) => String(u._id) === String(assignedEmployeeId));

      if (!assignedUser) {
        return res.status(400).json({ message: 'Assigned employee not found' });
      }

      if (normalizeRole(assignedUser.role) !== 'EMPLOYEE') {
        return res.status(400).json({ message: 'Assigned user must be an employee' });
      }

      if (req.user?.orgId && normalizeOrgId(assignedUser.orgId || req.user.orgId) !== normalizeOrgId(req.user.orgId)) {
        return res.status(400).json({ message: 'Assigned employee must belong to your organization' });
      }

      resolvedEmployeeId = assignedUser._id;
      resolvedEmployeeCode = assignedUser.employeeCode || '';
      resolvedEmployeeName = `${assignedUser.firstName || ''} ${assignedUser.lastName || ''}`.trim() || resolvedEmployeeName;
    }

    if (isConnected()) {
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
        orgId: req.user.orgId,
        orderId: finalOrderId,
        assetName,
        quantity,
        supplier,
        assignedEmployeeId: resolvedEmployeeId,
        assignedEmployeeCode: resolvedEmployeeCode,
        assignedEmployeeName: resolvedEmployeeName,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        estimatedDelivery: new Date(estimatedDelivery),
        currentLocation,
        status: status || 'Ordered',
        trackingHistory,
        notes,
        createdBy: req.user._id
      });

      const populated = await order.populate('createdBy', 'firstName lastName email');

      if (resolvedEmployeeId) {
        await createNotification({
          orgId: req.user.orgId,
          userId: resolvedEmployeeId,
          title: 'New Order Assigned',
          message: `Order ${finalOrderId} has been assigned to you. Current status: ${order.status}.`,
          type: 'ORDER'
        });
      }

      res.status(201).json({ order: populated });
    } else {
      // Use mock database
      const finalOrderId = orderId || (await generateOrderId());

      // Check if order ID already exists in mock db
      const existing = MockDB.getOrders().find(o => o.orderId === finalOrderId);
      if (existing) {
        return res.status(400).json({ message: 'Order ID already exists' });
      }

      const trackingHistory = [
        {
          stage: status || 'Ordered',
          date: new Date()
        }
      ];

      const order = MockDB.createOrder({
        orgId: req.user.orgId,
        orderId: finalOrderId,
        assetName,
        quantity,
        supplier,
        assignedEmployeeId: resolvedEmployeeId,
        assignedEmployeeCode: resolvedEmployeeCode,
        assignedEmployeeName: resolvedEmployeeName,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        estimatedDelivery: new Date(estimatedDelivery),
        currentLocation,
        status: status || 'Ordered',
        trackingHistory,
        notes,
        createdBy: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email
        }
      });

      if (resolvedEmployeeId) {
        await createNotification({
          orgId: req.user.orgId,
          userId: resolvedEmployeeId,
          title: 'New Order Assigned',
          message: `Order ${finalOrderId} has been assigned to you. Current status: ${order.status}.`,
          type: 'ORDER'
        });
      }

      res.status(201).json({ order });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (isConnected()) {
      const order = await CompanyOrder.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate('createdBy', 'firstName lastName email');
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json({ order });
    } else {
      const order = MockDB.getOrderById(req.params.id);
      if (!order || order.isDeleted) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json({ order });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/orders/:id - Update order (Admin only)
router.put('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { assetName, quantity, supplier, estimatedDelivery, currentLocation, status, assignedEmployeeId, assignedEmployeeName } = req.body;

    const errors = validateOrder({ assetName, quantity, supplier, estimatedDelivery, currentLocation, status, assignedEmployeeId, assignedEmployeeName });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const updatePayload = { ...req.body };
    if (assignedEmployeeId) {
      const assignedUser = isConnected()
        ? await User.findById(assignedEmployeeId).select('_id firstName lastName employeeCode role orgId').lean()
        : MockDB.getUsers().find((u) => String(u._id) === String(assignedEmployeeId));

      if (!assignedUser) {
        return res.status(400).json({ message: 'Assigned employee not found' });
      }

      if (normalizeRole(assignedUser.role) !== 'EMPLOYEE') {
        return res.status(400).json({ message: 'Assigned user must be an employee' });
      }

      if (req.user?.orgId && normalizeOrgId(assignedUser.orgId || req.user.orgId) !== normalizeOrgId(req.user.orgId)) {
        return res.status(400).json({ message: 'Assigned employee must belong to your organization' });
      }

      updatePayload.assignedEmployeeId = assignedUser._id;
      updatePayload.assignedEmployeeCode = assignedUser.employeeCode || '';
      updatePayload.assignedEmployeeName = `${assignedUser.firstName || ''} ${assignedUser.lastName || ''}`.trim();
    } else {
      updatePayload.assignedEmployeeName = (assignedEmployeeName || '').trim();
      updatePayload.assignedEmployeeCode = '';
    }

    if (isConnected()) {
      const existing = await CompanyOrder.findById(req.params.id).select('orderId status assignedEmployeeId').lean();
      if (!existing) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const order = await CompanyOrder.findByIdAndUpdate(
        req.params.id,
        updatePayload,
        { new: true, runValidators: true }
      ).populate('createdBy', 'firstName lastName email');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const nextAssignedId = order.assignedEmployeeId?._id || order.assignedEmployeeId || null;
      if (nextAssignedId) {
        await createNotification({
          orgId: req.user.orgId,
          userId: nextAssignedId,
          title: 'Order Updated',
          message: `Order ${order.orderId} was updated. Current status: ${order.status}.`,
          type: 'ORDER'
        });
      }

      const prevAssignedId = existing.assignedEmployeeId || null;
      const wasReassigned = String(prevAssignedId || '') !== String(nextAssignedId || '');
      if (wasReassigned && nextAssignedId) {
        await createNotification({
          orgId: req.user.orgId,
          userId: nextAssignedId,
          title: 'Order Assigned To You',
          message: `Order ${order.orderId} is now assigned to you.`,
          type: 'ORDER'
        });
      }

      await syncDeliveredOrderToAsset(order, req.user);

      res.json({ order });
    } else {
      const existing = MockDB.getOrderById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const order = MockDB.updateOrder(req.params.id, updatePayload);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const nextAssignedId = order.assignedEmployeeId || null;
      if (nextAssignedId) {
        await createNotification({
          orgId: req.user.orgId,
          userId: nextAssignedId,
          title: 'Order Updated',
          message: `Order ${order.orderId} was updated. Current status: ${order.status}.`,
          type: 'ORDER'
        });
      }

      const wasReassigned = String(existing.assignedEmployeeId || '') !== String(nextAssignedId || '');
      if (wasReassigned && nextAssignedId) {
        await createNotification({
          orgId: req.user.orgId,
          userId: nextAssignedId,
          title: 'Order Assigned To You',
          message: `Order ${order.orderId} is now assigned to you.`,
          type: 'ORDER'
        });
      }

      await syncDeliveredOrderToAsset(order, req.user);

      res.json({ order });
    }
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

    if (isConnected()) {
      const order = await CompanyOrder.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Add new tracking history entry
      order.status = status;
      if (!Array.isArray(order.trackingHistory)) {
        order.trackingHistory = [];
      }
      order.trackingHistory.push({
        stage: status,
        date: new Date()
      });

      await order.save();
      const populated = await order.populate('createdBy', 'firstName lastName email');

      if (order.assignedEmployeeId) {
        await createNotification({
          orgId: req.user.orgId,
          userId: order.assignedEmployeeId,
          title: 'Order Status Updated',
          message: `Order ${order.orderId} status changed to ${status}.`,
          type: 'ORDER'
        });
      }

      await syncDeliveredOrderToAsset(order, req.user);

      res.json({ order: populated });
    } else {
      const order = MockDB.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      order.status = status;
      if (!order.trackingHistory) order.trackingHistory = [];
      order.trackingHistory.push({
        stage: status,
        date: new Date()
      });
      order.updatedAt = new Date();

      MockDB.updateOrder(req.params.id, order);

      if (order.assignedEmployeeId) {
        await createNotification({
          orgId: req.user.orgId,
          userId: order.assignedEmployeeId,
          title: 'Order Status Updated',
          message: `Order ${order.orderId} status changed to ${status}.`,
          type: 'ORDER'
        });
      }

      await syncDeliveredOrderToAsset(order, req.user);

      res.json({ order });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/orders/:id - Delete order (Admin only)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    if (isConnected()) {
      const order = await CompanyOrder.findByIdAndDelete(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json({ message: 'Order deleted successfully', order });
    } else {
      const order = MockDB.deleteOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json({ message: 'Order deleted successfully', order });
    }
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
        { supplier: { $regex: search, $options: 'i' } },
        { assignedEmployeeName: { $regex: search, $options: 'i' } },
        { assignedEmployeeCode: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) filter.status = status;

    const orders = await CompanyOrder.find(filter).lean();

    if (orders.length === 0) {
      return res.json({ message: 'No orders to export' });
    }

    const fields = ['orderId', 'assetName', 'quantity', 'supplier', 'assignedEmployeeCode', 'assignedEmployeeName', 'orderDate', 'estimatedDelivery', 'currentLocation', 'status'];
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
