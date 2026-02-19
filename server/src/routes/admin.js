const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { authMiddleware, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Asset = require('../models/Asset');
const { Parser } = require('json2csv');

const router = express.Router();

// Validation helper
const validateEmployee = (data) => {
  const errors = {};
  if (!data.firstName || !data.firstName.trim()) {
    errors.firstName = 'First name is required';
  }
  if (!data.lastName || !data.lastName.trim()) {
    errors.lastName = 'Last name is required';
  }
  if (!data.email || !data.email.trim()) {
    errors.email = 'Email is required';
  }
  return errors;
};

// ====== EMPLOYEES ROUTES ======

// GET /api/admin/employees - Get all employees with assigned asset counts
router.get('/employees', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const orgId = req.user.orgId;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = { role: 'EMPLOYEE', orgId };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    // Get employees with pagination
    const employees = await User.find(query)
      .select('-passwordHash')
      .populate('locationId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await User.countDocuments(query);

    // Get assigned asset counts for each employee
    const employeesWithCounts = await Promise.all(
      employees.map(async (employee) => {
        const assignedAssets = await Asset.countDocuments({
          orgId,
          currentEmployee: `${employee.firstName} ${employee.lastName}`,
          status: 'Assigned'
        });

        return {
          ...employee,
          assignedAssets,
          locationName: employee.locationId?.name || 'N/A'
        };
      })
    );

    res.json({
      data: employeesWithCounts,
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

// POST /api/admin/employees - Create employee (Admin only)
router.post('/employees', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, department, locationId, status } = req.body;
    const orgId = req.user.orgId;

    const errors = validateEmployee({ firstName, lastName, email });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    // Check if email exists
    const existing = await User.findOne({ orgId, email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Generate random password
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const employee = await User.create({
      orgId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '',
      department: department || '',
      locationId: locationId || null,
      status: status || 'ACTIVE',
      passwordHash,
      role: 'EMPLOYEE'
    });

    res.status(201).json({
      data: {
        _id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        locationId: employee.locationId,
        status: employee.status
      },
      tempPassword
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/admin/employees/:id - Get single employee
router.get('/employees/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const employee = await User.findOne({ _id: req.params.id, orgId })
      .select('-passwordHash')
      .populate('locationId');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const assignedAssets = await Asset.countDocuments({
      orgId,
      currentEmployee: `${employee.firstName} ${employee.lastName}`,
      status: 'Assigned'
    });

    res.json({
      data: { ...employee.toObject(), assignedAssets }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/admin/employees/:id - Update employee (Admin only)
router.put('/employees/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, department, locationId, status } = req.body;
    const orgId = req.user.orgId;

    const errors = validateEmployee({ firstName, lastName, email });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    // Check if new email is taken by another user
    const existing = await User.findOne({
      orgId,
      email: email.trim().toLowerCase(),
      _id: { $ne: req.params.id }
    });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const employee = await User.findOneAndUpdate(
      { _id: req.params.id, orgId },
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone || '',
        department: department || '',
        locationId: locationId || null,
        status: status || 'ACTIVE'
      },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ data: employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/admin/employees/:id - Delete employee (Admin only)
router.delete('/employees/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const employee = await User.findOneAndDelete({ _id: req.params.id, orgId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/admin/employees/export/download - Export to CSV (Admin only)
router.get('/employees/export/download', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { search } = req.query;
    const orgId = req.user.orgId;

    const query = { role: 'EMPLOYEE', orgId };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await User.find(query)
      .select('-passwordHash')
      .populate('locationId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    if (employees.length === 0) {
      return res.status(400).json({ message: 'No employees to export' });
    }

    // Get assigned asset counts for each employee
    const employeesWithCounts = await Promise.all(
      employees.map(async (employee) => {
        const assignedAssets = await Asset.countDocuments({
          orgId,
          currentEmployee: `${employee.firstName} ${employee.lastName}`,
          status: 'Assigned'
        });

        return {
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone || '',
          department: employee.department || '',
          location: employee.locationId?.name || '',
          assignedAssets,
          status: employee.status
        };
      })
    );

    const fields = ['firstName', 'lastName', 'email', 'phone', 'department', 'location', 'assignedAssets', 'status'];
    const parser = new Parser({ fields });
    const csv = parser.parse(employeesWithCounts);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=employees.csv');
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ====== ASSETS ROUTES (EXISTING) ======

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/assets', authMiddleware, requireRole('ADMIN'), upload.single('image'), async (req, res) => {
  try {
    const data = req.body;
    if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
    const asset = await Asset.create(data);
    res.json({ asset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/assets', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const q = req.query.q || '';
  const filter = {};
  if (q) filter.$or = [ { assetId: new RegExp(q, 'i') }, { manufacturer: new RegExp(q, 'i') }, { model: new RegExp(q, 'i') } ];
  const list = await Asset.find(filter).limit(200).lean();
  res.json({ data: list });
});

router.patch('/assets/:id', authMiddleware, requireRole('ADMIN'), upload.single('image'), async (req, res) => {
  try {
    const id = req.params.id;
    const update = { ...req.body };
    if (req.file) update.imageUrl = `/uploads/${req.file.filename}`;
    const asset = await Asset.findByIdAndUpdate(id, update, { new: true });
    res.json({ asset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
