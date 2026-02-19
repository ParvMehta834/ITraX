const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const Asset = require('../models/Asset');
const { Parser } = require('json2csv');

const router = express.Router();

// Validation helpers
const validateAsset = (data) => {
  const errors = {};
  if (!data.category) errors.category = 'Category is required';
  if (!data.manufacturer) errors.manufacturer = 'Manufacturer is required';
  if (!data.model) errors.model = 'Model is required';
  if (!data.currentLocation) errors.currentLocation = 'Location is required';
  if (data.status && !['Available', 'Assigned', 'Maintenance'].includes(data.status)) {
    errors.status = 'Invalid status';
  }
  return errors;
};

// Generate unique asset ID if not provided
const generateAssetId = async () => {
  const count = await Asset.countDocuments();
  const timestamp = Date.now().toString().slice(-6);
  return `AST-${timestamp}-${count + 1}`;
};

// GET /api/assets - Get all assets with search, filters, pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { search, status, category, location, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = { orgId };
    if (search) {
      filter.$or = [
        { assetId: { $regex: search, $options: 'i' } },
        { assetTag: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (location) filter.currentLocation = { $regex: location, $options: 'i' };

    const total = await Asset.countDocuments(filter);
    const data = await Asset.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
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

// POST /api/assets - Create asset (Admin only)
router.post('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { assetId, category, manufacturer, model, status, currentEmployee, currentLocation, ...rest } = req.body;
    const orgId = req.user.orgId;

    const errors = validateAsset({ category, manufacturer, model, status, currentLocation });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const finalAssetId = assetId || (await generateAssetId());

    // Check if asset ID already exists
    const existing = await Asset.findOne({ orgId, assetId: finalAssetId });
    if (existing) {
      return res.status(400).json({ message: 'Asset ID already exists' });
    }

    const asset = await Asset.create({
      orgId,
      assetId: finalAssetId,
      category,
      manufacturer,
      model,
      status: status || 'Available',
      currentEmployee: currentEmployee || null,
      currentLocation,
      createdBy: req.user._id || req.user.id,
      ...rest
    });

    res.status(201).json({ asset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/assets/:id - Get single asset
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const asset = await Asset.findOne({ _id: req.params.id, orgId });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json({ asset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/assets/:id - Update asset (Admin only)
router.put('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { category, manufacturer, model, status, currentLocation } = req.body;
    const orgId = req.user.orgId;

    const errors = validateAsset({ category, manufacturer, model, status, currentLocation });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, orgId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json({ asset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/assets/:id - Delete asset (Admin only)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const asset = await Asset.findOneAndDelete({ _id: req.params.id, orgId });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json({ message: 'Asset deleted successfully', asset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/assets/export - Export assets as CSV (Admin only)
router.get('/export/download', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { search, status, category, location } = req.query;

    // Build filter (same as GET /assets)
    const filter = { orgId };
    if (search) {
      filter.$or = [
        { assetId: { $regex: search, $options: 'i' } },
        { assetTag: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (location) filter.currentLocation = { $regex: location, $options: 'i' };

    const assets = await Asset.find(filter).lean();

    if (assets.length === 0) {
      return res.json({ message: 'No assets to export' });
    }

    // Prepare CSV fields
    const fields = ['assetId', 'category', 'manufacturer', 'model', 'status', 'currentEmployee', 'currentLocation', 'purchaseDate', 'warrantyExpiryDate'];
    const parser = new Parser({ fields });
    const csv = parser.parse(assets);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=assets-export.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
