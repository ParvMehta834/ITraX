const MockDB = require('../config/mockDb');
const { isConnected } = require('../config/db');
const Asset = require('../models/Asset');

const assetController = {
  // Get all assets with pagination, search, and filters
  getAssets: async (req, res) => {
    try {
      const { search, status, category, location, page = 1, limit = 10 } = req.query;
      
      if (isConnected()) {
        // Use MongoDB
        let query = {};
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { assetTag: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ];
        }
        if (status) query.status = status;
        if (category) query.category = category;
        if (location) query.location = location;

        const total = await Asset.countDocuments(query);
        const data = await Asset.find(query)
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
        // Use mock database
        const assets = MockDB.getAssets();
        let filtered = assets;

        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(a =>
            a.name?.toLowerCase().includes(searchLower) ||
            a.assetTag?.toLowerCase().includes(searchLower) ||
            a.description?.toLowerCase().includes(searchLower)
          );
        }
        if (status) filtered = filtered.filter(a => a.status === status);
        if (category) filtered = filtered.filter(a => a.category === category);
        if (location) filtered = filtered.filter(a => a.location === location);

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
      console.error('Error fetching assets:', error);
      res.status(500).json({ message: 'Failed to fetch assets', error: error.message });
    }
  },

  // Create new asset
  createAsset: async (req, res) => {
    try {
      const { assetId, category, manufacturer, model, status, currentEmployee, currentLocation, purchaseDate, warrantyExpiryDate, notes } = req.body;

      // Validate required fields
      if (!assetId) {
        return res.status(400).json({ message: 'Asset ID is required' });
      }

      if (isConnected()) {
        // Use MongoDB
        const asset = await Asset.create({
          name: assetId || manufacturer || 'Unnamed Asset',
          assetTag: assetId,
          description: notes,
          category,
          manufacturer,
          model,
          status: status || 'Available',
          location: currentLocation,
          assignedTo: currentEmployee,
          purchaseDate,
          warrantyExpiryDate,
          createdAt: new Date()
        });
        res.status(201).json(asset);
      } else {
        // Use mock database
        const asset = MockDB.createAsset({
          assetId,
          name: assetId || manufacturer || 'Unnamed Asset',
          assetTag: assetId,
          description: notes,
          category,
          manufacturer,
          model,
          status: status || 'Available',
          location: currentLocation,
          assignedTo: currentEmployee,
          purchaseDate,
          warrantyExpiryDate
        });
        res.status(201).json(asset);
      }
    } catch (error) {
      console.error('Error creating asset:', error);
      res.status(500).json({ message: 'Failed to create asset', error: error.message });
    }
  },

  // Get single asset by ID
  getAssetById: async (req, res) => {
    try {
      const { id } = req.params;

      if (isConnected()) {
        const asset = await Asset.findById(id).lean();
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json(asset);
      } else {
        const asset = MockDB.getAssetById(id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json(asset);
      }
    } catch (error) {
      console.error('Error fetching asset:', error);
      res.status(500).json({ message: 'Failed to fetch asset', error: error.message });
    }
  },

  // Update asset
  updateAsset: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (isConnected()) {
        const asset = await Asset.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true }).lean();
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json(asset);
      } else {
        const asset = MockDB.updateAsset(id, updates);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json(asset);
      }
    } catch (error) {
      console.error('Error updating asset:', error);
      res.status(500).json({ message: 'Failed to update asset', error: error.message });
    }
  },

  // Delete asset
  deleteAsset: async (req, res) => {
    try {
      const { id } = req.params;

      if (isConnected()) {
        const asset = await Asset.findByIdAndDelete(id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json({ message: 'Asset deleted successfully' });
      } else {
        const asset = MockDB.deleteAsset(id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json({ message: 'Asset deleted successfully' });
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      res.status(500).json({ message: 'Failed to delete asset', error: error.message });
    }
  },

  // Export assets as CSV
  exportAssets: async (req, res) => {
    try {
      if (isConnected()) {
        const assets = await Asset.find({}).lean();
        const csv = convertToCSV(assets);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=assets.csv');
        res.send(csv);
      } else {
        const assets = MockDB.getAssets();
        const csv = convertToCSV(assets);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=assets.csv');
        res.send(csv);
      }
    } catch (error) {
      console.error('Error exporting assets:', error);
      res.status(500).json({ message: 'Failed to export assets', error: error.message });
    }
  }
};

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csv = [headers.join(',')];
  for (const row of data) {
    csv.push(headers.map(h => JSON.stringify(row[h] || '')).join(','));
  }
  return csv.join('\n');
}

module.exports = assetController;
