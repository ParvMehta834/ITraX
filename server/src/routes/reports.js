const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const Asset = require('../models/Asset');
const User = require('../models/User');
const License = require('../models/License');
const { Parser } = require('json2csv');

const router = express.Router();

// ====== ASSET REPORTS ======

// GET /api/reports/assets-master - Asset Master List
router.get('/assets-master', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const assets = await Asset.find({ orgId }).lean();

    const data = assets.map(asset => ({
      assetId: asset.assetId || asset.assetTag,
      category: asset.category,
      manufacturer: asset.manufacturer,
      model: asset.model,
      status: asset.status,
      currentEmployee: asset.currentEmployee || 'Unassigned',
      currentLocation: asset.currentLocation,
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A',
      warrantyExpiryDate: asset.warrantyExpiryDate ? new Date(asset.warrantyExpiryDate).toLocaleDateString() : 'N/A'
    }));

    res.json({ data, total: data.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/reports/assets-by-status - Assets grouped by status
router.get('/assets-by-status', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const statuses = ['Available', 'Assigned', 'Maintenance'];
    const data = await Promise.all(
      statuses.map(async (status) => {
        const count = await Asset.countDocuments({ orgId, status });
        return { status, count };
      })
    );

    res.json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/reports/assets-by-location - Assets by location
router.get('/assets-by-location', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const locations = await Asset.distinct('currentLocation', { orgId });
    const data = await Promise.all(
      locations.map(async (location) => {
        const total = await Asset.countDocuments({ orgId, currentLocation: location });
        const available = await Asset.countDocuments({
          orgId,
          currentLocation: location,
          status: 'Available'
        });
        const assigned = await Asset.countDocuments({
          orgId,
          currentLocation: location,
          status: 'Assigned'
        });
        const maintenance = await Asset.countDocuments({
          orgId,
          currentLocation: location,
          status: 'Maintenance'
        });

        return { location, total, available, assigned, maintenance };
      })
    );

    res.json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/reports/assets-by-category - Assets by category
router.get('/assets-by-category', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const categories = await Asset.distinct('category', { orgId });
    const data = await Promise.all(
      categories.map(async (category) => {
        const total = await Asset.countDocuments({ orgId, category });
        const available = await Asset.countDocuments({
          orgId,
          category,
          status: 'Available'
        });
        const assigned = await Asset.countDocuments({
          orgId,
          category,
          status: 'Assigned'
        });

        return { category, total, available, assigned };
      })
    );

    res.json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/reports/assets-by-department - Assets by department
router.get('/assets-by-department', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const departments = await Asset.aggregate([
      { $match: { orgId, status: 'Assigned' } },
      { $group: { _id: '$currentEmployee' } },
      { $sort: { _id: 1 } }
    ]);

    const data = [];
    for (const dept of departments) {
      if (dept._id) {
        const count = await Asset.countDocuments({ orgId, currentEmployee: dept._id });
        data.push({ department: dept._id, assignedAssets: count });
      }
    }

    res.json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/reports/warranty-expiring - Assets with warranty expiring within 30 days
router.get('/warranty-expiring', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const now = new Date();

    const assets = await Asset.find({
      orgId,
      $or: [
        { warrantyExpiryDate: { $gte: now, $lte: thirtyDaysFromNow } },
        { warrantyExpiry: { $gte: now, $lte: thirtyDaysFromNow } }
      ]
    }).lean();

    const data = assets.map(asset => ({
      assetId: asset.assetId || asset.assetTag,
      category: asset.category,
      manufacturer: asset.manufacturer,
      model: asset.model,
      status: asset.status,
      warrantyExpiryDate: (asset.warrantyExpiryDate || asset.warrantyExpiry)
        ? new Date(asset.warrantyExpiryDate || asset.warrantyExpiry).toLocaleDateString()
        : 'N/A',
      daysUntilExpiry: Math.ceil((new Date(asset.warrantyExpiryDate || asset.warrantyExpiry) - now) / (1000 * 60 * 60 * 24))
    }));

    res.json({ data, total: data.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ====== EXPORT ROUTES ======

// GET /api/reports/export/assets-master - Export asset master list as CSV
router.get('/export/assets-master', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const assets = await Asset.find({ orgId }).lean();

    if (assets.length === 0) {
      return res.status(400).json({ message: 'No assets to export' });
    }

    const data = assets.map(asset => ({
      assetId: asset.assetId || asset.assetTag,
      category: asset.category,
      manufacturer: asset.manufacturer,
      model: asset.model,
      status: asset.status,
      currentEmployee: asset.currentEmployee || 'Unassigned',
      currentLocation: asset.currentLocation,
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A',
      warrantyExpiryDate: asset.warrantyExpiryDate ? new Date(asset.warrantyExpiryDate).toLocaleDateString() : 'N/A'
    }));

    const fields = ['assetId', 'category', 'manufacturer', 'model', 'status', 'currentEmployee', 'currentLocation', 'purchaseDate', 'warrantyExpiryDate'];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=asset-master-list.csv');
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/reports/export/warranty-expiring - Export warranty expiring assets as CSV
router.get('/export/warranty-expiring', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const now = new Date();

    const assets = await Asset.find({
      orgId,
      $or: [
        { warrantyExpiryDate: { $gte: now, $lte: thirtyDaysFromNow } },
        { warrantyExpiry: { $gte: now, $lte: thirtyDaysFromNow } }
      ]
    }).lean();

    if (assets.length === 0) {
      return res.status(400).json({ message: 'No expiring warranties to export' });
    }

    const data = assets.map(asset => ({
      assetId: asset.assetId || asset.assetTag,
      category: asset.category,
      manufacturer: asset.manufacturer,
      model: asset.model,
      warrantyExpiryDate: (asset.warrantyExpiryDate || asset.warrantyExpiry)
        ? new Date(asset.warrantyExpiryDate || asset.warrantyExpiry).toLocaleDateString()
        : 'N/A',
      daysUntilExpiry: Math.ceil((new Date(asset.warrantyExpiryDate || asset.warrantyExpiry) - now) / (1000 * 60 * 60 * 24))
    }));

    const fields = ['assetId', 'category', 'manufacturer', 'model', 'warrantyExpiryDate', 'daysUntilExpiry'];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=warranty-expiring-assets.csv');
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
