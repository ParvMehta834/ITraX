const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { authMiddleware, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Asset = require('../models/Asset');
const MockDB = require('../config/mockDb');
const { isConnected } = require('../config/db');
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

const normalizeOrgId = (orgId) => String(orgId || '');

const isSameOrg = (user, orgId) => normalizeOrgId(user?.orgId) === normalizeOrgId(orgId);

const matchesEmployeeSearch = (employee, search) => {
  if (!search) return true;
  const searchLower = String(search).toLowerCase();
  return [employee.firstName, employee.lastName, employee.email, employee.department]
    .some((value) => String(value || '').toLowerCase().includes(searchLower));
};

const sanitizeEmployee = (employee) => ({
  _id: employee._id,
  employeeCode: employee.employeeCode || '',
  firstName: employee.firstName,
  lastName: employee.lastName,
  email: employee.email,
  phone: employee.phone || '',
  department: employee.department || '',
  locationId: employee.locationId || null,
  status: employee.status || 'ACTIVE'
});

const generateUniqueEmployeeCode = async (orgId) => {
  const makeCode = () => String(Math.floor(100000 + Math.random() * 900000));

  if (isConnected()) {
    for (let i = 0; i < 20; i += 1) {
      const code = makeCode();
      const exists = await User.findOne({ orgId, employeeCode: code }).select('_id').lean();
      if (!exists) return code;
    }
    return String(Date.now()).slice(-6);
  }

  const existingCodes = new Set(
    MockDB.getUsers()
      .filter((user) => isSameOrg(user, orgId))
      .map((user) => String(user.employeeCode || ''))
  );

  let code = makeCode();
  while (existingCodes.has(code)) {
    code = makeCode();
  }
  return code;
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

    let employees = [];
    let total = 0;

    if (isConnected()) {
      const query = { role: 'EMPLOYEE', orgId };
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } }
        ];
      }

      employees = await User.find(query)
        .select('-passwordHash')
        .populate('locationId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      total = await User.countDocuments(query);

      employees = await Promise.all(
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
    } else {
      const list = MockDB.getUsers()
        .filter((user) => user.role === 'EMPLOYEE' && isSameOrg(user, orgId))
        .filter((user) => matchesEmployeeSearch(user, search))
        .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

      total = list.length;
      employees = list.slice(skip, skip + limitNum).map((employee) => {
        const assignedAssets = MockDB.getAssets().filter((asset) => {
          return isSameOrg(asset, orgId) && asset.currentEmployee === `${employee.firstName} ${employee.lastName}` && asset.status === 'Assigned';
        }).length;

        return {
          ...sanitizeEmployee(employee),
          assignedAssets,
          locationName: 'N/A'
        };
      });
    }

    res.json({
      data: employees,
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
    const { firstName, lastName, email, password, phone, department, locationId, status } = req.body;
    const orgId = req.user.orgId;

    const errors = validateEmployee({ firstName, lastName, email });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    const providedPassword = typeof password === 'string' ? password.trim() : '';
    if (providedPassword && providedPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const tempPassword = providedPassword || Math.random().toString(36).slice(-8);
    const employeeCode = await generateUniqueEmployeeCode(orgId);

    let employee;

    if (isConnected()) {
      // Check if email exists
      const existing = await User.findOne({ orgId, email: email.trim().toLowerCase() });
      if (existing) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const passwordHash = await bcrypt.hash(tempPassword, 10);

      employee = await User.create({
        orgId,
        employeeCode,
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
    } else {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = MockDB.getUsers().find((user) => user.role === 'EMPLOYEE' && isSameOrg(user, orgId) && user.email === normalizedEmail);
      if (existing) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const passwordHash = await bcrypt.hash(tempPassword, 10);
      employee = MockDB.createUser({
        orgId,
        employeeCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: phone || '',
        department: department || '',
        locationId: locationId || null,
        status: status || 'ACTIVE',
        passwordHash,
        role: 'EMPLOYEE'
      });
    }

    res.status(201).json({
      data: {
        _id: employee._id,
        employeeCode: employee.employeeCode,
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
    let employee;

    if (isConnected()) {
      employee = await User.findOne({ _id: req.params.id, orgId })
        .select('-passwordHash')
        .populate('locationId');
    } else {
      employee = MockDB.getUsers().find((user) => user._id === req.params.id && user.role === 'EMPLOYEE' && isSameOrg(user, orgId));
    }

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const assignedAssets = await Asset.countDocuments({
      orgId,
      currentEmployee: `${employee.firstName} ${employee.lastName}`,
      status: 'Assigned'
    });

    const employeeData = employee.toObject ? employee.toObject() : employee;
    res.json({
      data: { ...employeeData, assignedAssets }
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

    let employee;

    if (isConnected()) {
      // Check if new email is taken by another user
      const existing = await User.findOne({
        orgId,
        email: email.trim().toLowerCase(),
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      employee = await User.findOneAndUpdate(
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
    } else {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = MockDB.getUsers().find((user) => user.role === 'EMPLOYEE' && isSameOrg(user, orgId) && user.email === normalizedEmail && user._id !== req.params.id);
      if (existing) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      employee = MockDB.updateUser(req.params.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: phone || '',
        department: department || '',
        locationId: locationId || null,
        status: status || 'ACTIVE'
      });
    }

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ data: employee.toObject ? employee.toObject() : employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/admin/employees/:id - Delete employee (Admin only)
router.delete('/employees/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const employee = isConnected()
      ? await User.findOneAndDelete({ _id: req.params.id, orgId })
      : MockDB.deleteUser(req.params.id);
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

    let employees;
    if (isConnected()) {
      const query = { role: 'EMPLOYEE', orgId };
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } }
        ];
      }

      employees = await User.find(query)
        .select('-passwordHash')
        .populate('locationId', 'name')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      employees = MockDB.getUsers()
        .filter((user) => user.role === 'EMPLOYEE' && isSameOrg(user, orgId))
        .filter((user) => matchesEmployeeSearch(user, search))
        .map((employee) => ({ ...sanitizeEmployee(employee), locationId: { name: '' } }));
    }

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
          employeeCode: employee.employeeCode || '',
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

    const fields = ['employeeCode', 'firstName', 'lastName', 'email', 'phone', 'department', 'location', 'assignedAssets', 'status'];
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
    const data = { ...req.body };
    if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;

    const payload = {
      ...data,
      orgId: req.user.orgId,
      createdBy: req.user._id,
      assignedToEmployeeId: data.assignedToEmployeeId || null,
      currentEmployee: String(data.currentEmployee || '').trim(),
      status: data.assignedToEmployeeId ? 'Assigned' : (data.status || 'Available')
    };

    const asset = await Asset.create(payload);
    res.json({ asset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/assets', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const q = req.query.q || '';
  const filter = { orgId: req.user.orgId, isDeleted: { $ne: true } };
  if (q) filter.$or = [ { assetId: new RegExp(q, 'i') }, { manufacturer: new RegExp(q, 'i') }, { model: new RegExp(q, 'i') } ];
  const list = await Asset.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ data: list });
});

router.patch('/assets/:id', authMiddleware, requireRole('ADMIN'), upload.single('image'), async (req, res) => {
  try {
    const id = req.params.id;
    const update = { ...req.body };
    if (req.file) update.imageUrl = `/uploads/${req.file.filename}`;

    if (Object.prototype.hasOwnProperty.call(update, 'assignedToEmployeeId')) {
      update.assignedToEmployeeId = update.assignedToEmployeeId || null;
      if (update.assignedToEmployeeId) {
        update.status = 'Assigned';
      }
    }

    const asset = await Asset.findOneAndUpdate(
      { _id: id, orgId: req.user.orgId },
      { ...update, updatedBy: req.user._id, updatedAt: new Date() },
      { new: true }
    );

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json({ asset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
