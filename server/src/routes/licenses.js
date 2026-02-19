const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const License = require('../models/License');
const { Parser } = require('json2csv');

const router = express.Router();

// Validation helper
const validateLicense = (data) => {
  const errors = {};
  if (!data.name) errors.name = 'License name is required';
  if (data.seats === undefined || data.seats === null || data.seats < 1)
    errors.seats = 'Number of seats must be at least 1';
  if (!data.renewalDate) errors.renewalDate = 'Renewal date is required';
  if (data.cost === undefined || data.cost === null || data.cost < 0)
    errors.cost = 'Cost must be a positive number';
  return errors;
};

// Helper to calculate status based on renewal date
const calculateStatus = (renewalDate) => {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (renewalDate < now) {
    return 'Expired';
  } else if (renewalDate <= thirtyDaysFromNow) {
    return 'ExpiringSoon';
  } else {
    return 'Active';
  }
};

// GET /api/licenses - List with search, filter, pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { search, status, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = { orgId };

    // Search by name
    if (search) {
      query.$or = [{ name: { $regex: search, $options: 'i' } }];
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    const total = await License.countDocuments(query);
    const licenses = await License.find(query)
      .sort({ renewalDate: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      data: licenses,
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

// POST /api/licenses - Create new license (Admin only)
router.post('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, seats, renewalDate, cost, vendor } = req.body;
    const orgId = req.user.orgId;

    const errors = validateLicense({ name, seats, renewalDate, cost });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const status = calculateStatus(new Date(renewalDate));

    const license = await License.create({
      orgId,
      name,
      seats: parseInt(seats, 10),
      seatsTotal: parseInt(seats, 10),
      renewalDate: new Date(renewalDate),
      cost: parseFloat(cost),
      status,
      vendor: vendor || '',
      createdBy: req.user._id || req.user.id
    });

    res.status(201).json({ data: license });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/licenses/export/download - Export to CSV (Admin only)
// Must come before /:id route to avoid matching as ID
router.get('/export/download', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { search, status } = req.query;
    const orgId = req.user.orgId;

    const query = { orgId };
    if (search) {
      query.$or = [{ name: { $regex: search, $options: 'i' } }];
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const licenses = await License.find(query).sort({ renewalDate: 1 }).lean();

    if (licenses.length === 0) {
      return res.status(400).json({ message: 'No licenses to export' });
    }

    const fields = ['name', 'seats', 'renewalDate', 'cost', 'status'];
    const parser = new Parser({ fields });
    const csv = parser.parse(licenses);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=licenses.csv');
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/licenses/:id - Get single license
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const license = await License.findOne({ _id: req.params.id, orgId });
    if (!license) {
      return res.status(404).json({ message: 'License not found' });
    }
    res.json({ data: license });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/licenses/:id - Update license (Admin only)
router.put('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, seats, renewalDate, cost, vendor } = req.body;
    const orgId = req.user.orgId;

    const errors = validateLicense({ name, seats, renewalDate, cost });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const status = calculateStatus(new Date(renewalDate));

    const license = await License.findOneAndUpdate(
      { _id: req.params.id, orgId },
      {
        name,
        seats: parseInt(seats, 10),
        seatsTotal: parseInt(seats, 10),
        renewalDate: new Date(renewalDate),
        cost: parseFloat(cost),
        status,
        vendor: vendor || ''
      },
      { new: true, runValidators: true }
    );

    if (!license) {
      return res.status(404).json({ message: 'License not found' });
    }

    res.json({ data: license });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/licenses/:id - Delete license (Admin only)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const license = await License.findOneAndDelete({ _id: req.params.id, orgId });
    if (!license) {
      return res.status(404).json({ message: 'License not found' });
    }
    res.json({ message: 'License deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
