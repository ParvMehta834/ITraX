const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const Location = require('../models/Location');
const Asset = require('../models/Asset');
const { Parser } = require('json2csv');

const router = express.Router();

// Validation helper
const validateLocation = (data) => {
  const errors = {};
  if (!data.name || !data.name.trim()) {
    errors.name = 'Location name is required';
  }
  if (!data.type) {
    errors.type = 'Location type is required';
  }
  if (!['Office', 'Warehouse'].includes(data.type)) {
    errors.type = 'Location type must be Office or Warehouse';
  }
  if (data.capacity === undefined || data.capacity < 0) {
    errors.capacity = 'Capacity must be a positive number';
  }
  return errors;
};

// GET /api/locations - Get all locations with assigned asset counts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { search, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = { orgId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } }
      ];
    }

    // Get locations with pagination
    const locations = await Location.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Location.countDocuments(query);

    // Get assigned asset counts for each location
    const locationsWithCounts = await Promise.all(
      locations.map(async (location) => {
        const assignedAssets = await Asset.countDocuments({
          orgId,
          currentLocation: location.name,
          status: 'Assigned'
        });

        return {
          ...location,
          assignedAssets
        };
      })
    );

    res.json({
      data: locationsWithCounts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/locations - Create location (Admin only)
router.post('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, type, address, city, state, capacity, status } = req.body;
    const orgId = req.user.orgId;

    const errors = validateLocation({ name, type, capacity });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    // Check if location exists
    const existing = await Location.findOne({ orgId, name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Location already exists' });
    }

    const location = await Location.create({
      orgId,
      name: name.trim(),
      type,
      address: address || '',
      city: city || '',
      state: state || '',
      capacity: parseInt(capacity, 10),
      status: status || 'Active',
      createdBy: req.user._id || req.user.id
    });

    res.status(201).json({ data: location });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/locations/:id - Get single location
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const location = await Location.findOne({ _id: req.params.id, orgId });
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const assignedAssets = await Asset.countDocuments({
      orgId,
      currentLocation: location.name,
      status: 'Assigned'
    });

    res.json({
      data: { ...location.toObject(), assignedAssets }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/locations/:id - Update location (Admin only)
router.put('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, type, address, city, state, capacity, status } = req.body;
    const orgId = req.user.orgId;

    const errors = validateLocation({ name, type, capacity });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    // Check if new name is already taken by another location
    const existing = await Location.findOne({
      orgId,
      name: name.trim(),
      _id: { $ne: req.params.id }
    });
    if (existing) {
      return res.status(400).json({ message: 'Location name already exists' });
    }

    const location = await Location.findOneAndUpdate(
      { _id: req.params.id, orgId },
      {
        name: name.trim(),
        type,
        address: address || '',
        city: city || '',
        state: state || '',
        capacity: parseInt(capacity, 10),
        status: status || 'Active'
      },
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json({ data: location });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/locations/:id - Delete location (Admin only)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const location = await Location.findOneAndDelete({ _id: req.params.id, orgId });
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/locations/export/download - Export to CSV (Admin only)
router.get('/export/download', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { search } = req.query;

    const query = { orgId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } }
      ];
    }

    const locations = await Location.find(query).sort({ createdAt: -1 }).lean();

    if (locations.length === 0) {
      return res.status(400).json({ message: 'No locations to export' });
    }

    // Get assigned asset counts for each location
    const locationsWithCounts = await Promise.all(
      locations.map(async (location) => {
        const assignedAssets = await Asset.countDocuments({
          orgId,
          currentLocation: location.name,
          status: 'Assigned'
        });

        return {
          name: location.name,
          type: location.type,
          address: location.address || '',
          city: location.city || '',
          state: location.state || '',
          capacity: location.capacity,
          assignedAssets,
          status: location.status
        };
      })
    );

    const fields = ['name', 'type', 'address', 'city', 'state', 'capacity', 'assignedAssets', 'status'];
    const parser = new Parser({ fields });
    const csv = parser.parse(locationsWithCounts);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=locations.csv');
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
