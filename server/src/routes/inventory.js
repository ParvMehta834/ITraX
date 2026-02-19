const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const InventoryItem = require('../models/InventoryItem');
const { Parser } = require('json2csv');

const router = express.Router();

// GET /api/inventory - List with search, filter, pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, location, page = 1, limit = 10 } = req.query;
    const orgId = req.user.orgId;
    const query = { orgId };
    
    // Search by name or location
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by location
    if (location) {
      query.location = location;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [items, total] = await Promise.all([
      InventoryItem.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      InventoryItem.countDocuments(query)
    ]);
    
    res.json({
      data: items,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/inventory - Create new item (Admin only)
router.post('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, location, quantityOnHand, quantityMinimum, costPerItem } = req.body;
    const orgId = req.user.orgId;
    
    // Validation
    if (!name || !location) {
      return res.status(400).json({ message: 'Name and location are required' });
    }
    
    const total = (quantityOnHand || 0) * (costPerItem || 0);
    
    const item = await InventoryItem.create({
      orgId,
      name,
      location,
      quantityOnHand: quantityOnHand || 0,
      quantityMinimum: quantityMinimum || 0,
      costPerItem: costPerItem || 0,
      total,
      createdBy: req.user._id || req.user.id
    });
    
    res.status(201).json({ data: item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/inventory/export/download - Export to CSV (Admin only)
// Must come before /:id route to avoid matching as ID
router.get('/export/download', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { search, location } = req.query;
    const orgId = req.user.orgId;
    const query = { orgId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    if (location) {
      query.location = location;
    }
    
    const items = await InventoryItem.find(query).sort({ createdAt: -1 }).lean();
    
    const fields = ['name', 'location', 'quantityOnHand', 'quantityMinimum', 'costPerItem', 'total'];
    const parser = new Parser({ fields });
    const csv = parser.parse(items);
    
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=inventory.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/inventory/:id - Get single item
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const item = await InventoryItem.findOne({ _id: req.params.id, orgId });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ data: item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/inventory/:id - Update item (Admin only)
router.put('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, location, quantityOnHand, quantityMinimum, costPerItem } = req.body;
    const orgId = req.user.orgId;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;
    if (quantityOnHand !== undefined) updateData.quantityOnHand = quantityOnHand;
    if (quantityMinimum !== undefined) updateData.quantityMinimum = quantityMinimum;
    if (costPerItem !== undefined) updateData.costPerItem = costPerItem;
    
    // Recalculate total
    if (quantityOnHand !== undefined || costPerItem !== undefined) {
      const item = await InventoryItem.findOne({ _id: req.params.id, orgId });
      const newQty = quantityOnHand !== undefined ? quantityOnHand : item.quantityOnHand;
      const newCost = costPerItem !== undefined ? costPerItem : item.costPerItem;
      updateData.total = newQty * newCost;
    }
    
      const item = await InventoryItem.findOneAndUpdate(
        { _id: req.params.id, orgId },
        updateData,
        { new: true, runValidators: true }
      );
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json({ data: item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/inventory/:id - Delete item (Admin only)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const item = await InventoryItem.findOneAndDelete({ _id: req.params.id, orgId });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
