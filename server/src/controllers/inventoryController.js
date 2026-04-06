const MockDB = require('../config/mockDb');
const { isConnected } = require('../config/db');
const InventoryItem = require('../models/InventoryItem');

const inventoryController = {
  getInventory: async (req, res) => {
    try {
      const { search, location, page = 1, limit = 10 } = req.query;

      if (isConnected()) {
        let query = {};
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ];
        }
        if (location) query.location = location;

        const total = await InventoryItem.countDocuments(query);
        const data = await InventoryItem.find(query)
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit))
          .lean();

        res.json({
          data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        });
      } else {
        const items = MockDB.getInventoryItems();
        let filtered = items;

        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(i =>
            i.name?.toLowerCase().includes(searchLower) ||
            i.description?.toLowerCase().includes(searchLower)
          );
        }
        if (location) filtered = filtered.filter(i => i.location === location);

        const total = filtered.length;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const data = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        res.json({
          data,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        });
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ message: 'Failed to fetch inventory', error: error.message });
    }
  },

  createInventory: async (req, res) => {
    try {
      const { name, description, quantity, location, sku, reorderLevel } = req.body;

      if (!name || quantity === undefined || quantity === null || quantity === '') {
        return res.status(400).json({ message: 'Name and quantity are required' });
      }

      if (isConnected()) {
        const item = await InventoryItem.create({
          orgId: req.user.orgId,
          name,
          quantityOnHand: Number(quantity) || 0,
          quantityMinimum: Number(reorderLevel) || 0,
          costPerItem: Number(req.body.costPerItem) || 0,
          location,
          createdBy: req.user._id,
          createdAt: new Date()
        });
        res.status(201).json(item);
      } else {
        const payload = {
          name,
          description,
          quantityOnHand: Number(quantity) || 0,
          quantityMinimum: Number(reorderLevel) || 0,
          costPerItem: Number(req.body.costPerItem) || 0,
          location,
          sku,
          reorderLevel
        };

        const item = typeof MockDB.createInventoryItem === 'function'
          ? MockDB.createInventoryItem(payload)
          : (() => {
            const fallback = {
              _id: `inv_${Date.now()}`,
              ...payload,
              total: (Number(payload.quantityOnHand) || 0) * (Number(payload.costPerItem) || 0),
              createdAt: new Date()
            };
            MockDB.getInventoryItems().push(fallback);
            return fallback;
          })();
        res.status(201).json(item);
      }
    } catch (error) {
      console.error('Error creating inventory item:', error);
      res.status(500).json({ message: 'Failed to create inventory item', error: error.message });
    }
  },

  getInventoryById: async (req, res) => {
    try {
      const { id } = req.params;

      if (isConnected()) {
        const item = await InventoryItem.findById(id).lean();
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });
        res.json(item);
      } else {
        const item = MockDB.getInventoryItemById(id);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });
        res.json(item);
      }
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      res.status(500).json({ message: 'Failed to fetch inventory item', error: error.message });
    }
  },

  updateInventory: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (isConnected()) {
        const item = await InventoryItem.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true }).lean();
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });
        res.json(item);
      } else {
        const item = MockDB.updateInventoryItem(id, updates);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });
        res.json(item);
      }
    } catch (error) {
      console.error('Error updating inventory item:', error);
      res.status(500).json({ message: 'Failed to update inventory item', error: error.message });
    }
  },

  deleteInventory: async (req, res) => {
    try {
      const { id } = req.params;

      if (isConnected()) {
        const item = await InventoryItem.findByIdAndDelete(id);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });
        res.json({ message: 'Inventory item deleted successfully' });
      } else {
        const item = MockDB.deleteInventoryItem(id);
        if (!item) return res.status(404).json({ message: 'Inventory item not found' });
        res.json({ message: 'Inventory item deleted successfully' });
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      res.status(500).json({ message: 'Failed to delete inventory item', error: error.message });
    }
  }
};

module.exports = inventoryController;
