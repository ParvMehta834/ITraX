const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const Category = require('../models/Category');
const Asset = require('../models/Asset');
const { Parser } = require('json2csv');

const router = express.Router();

// Validation helper
const validateCategory = (data) => {
  const errors = {};
  if (!data.name || !data.name.trim()) {
    errors.name = 'Category name is required';
  }
  return errors;
};

// GET /api/categories - Get all categories with asset counts
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
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get categories with pagination
    const categories = await Category.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Category.countDocuments(query);

    // Get asset counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const totalAssets = await Asset.countDocuments({ orgId, category: category.name });
        const availableAssets = await Asset.countDocuments({
          orgId,
          category: category.name,
          status: 'Available'
        });
        const assignedAssets = await Asset.countDocuments({
          orgId,
          category: category.name,
          status: 'Assigned'
        });

        return {
          ...category,
          totalAssets,
          availableAssets,
          assignedAssets
        };
      })
    );

    res.json({
      data: categoriesWithCounts,
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

// POST /api/categories - Create category (Admin only)
router.post('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const orgId = req.user.orgId;

    const errors = validateCategory({ name });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    // Check if category exists
    const existing = await Category.findOne({ orgId, name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      orgId,
      name: name.trim(),
      description: description || '',
      createdBy: req.user._id || req.user.id
    });

    res.status(201).json({ data: category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/categories/:id - Get single category
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const category = await Category.findOne({ _id: req.params.id, orgId });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const totalAssets = await Asset.countDocuments({ orgId, category: category.name });
    const availableAssets = await Asset.countDocuments({
      orgId,
      category: category.name,
      status: 'Available'
    });
    const assignedAssets = await Asset.countDocuments({
      orgId,
      category: category.name,
      status: 'Assigned'
    });

    res.json({
      data: { ...category.toObject(), totalAssets, availableAssets, assignedAssets }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/categories/:id - Update category (Admin only)
router.put('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const orgId = req.user.orgId;

    const errors = validateCategory({ name });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    // Check if new name is already taken by another category
    const existing = await Category.findOne({
      orgId,
      name: name.trim(),
      _id: { $ne: req.params.id }
    });
    if (existing) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, orgId },
      {
        name: name.trim(),
        description: description || ''
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ data: category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const category = await Category.findOneAndDelete({ _id: req.params.id, orgId });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/categories/export/download - Export to CSV (Admin only)
router.get('/export/download', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { search } = req.query;

    const query = { orgId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const categories = await Category.find(query).sort({ createdAt: -1 }).lean();

    if (categories.length === 0) {
      return res.status(400).json({ message: 'No categories to export' });
    }

    // Get asset counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const totalAssets = await Asset.countDocuments({ orgId, category: category.name });
        const availableAssets = await Asset.countDocuments({
          orgId,
          category: category.name,
          status: 'Available'
        });
        const assignedAssets = await Asset.countDocuments({
          orgId,
          category: category.name,
          status: 'Assigned'
        });

        return {
          name: category.name,
          description: category.description || '',
          totalAssets,
          availableAssets,
          assignedAssets
        };
      })
    );

    const fields = ['name', 'description', 'totalAssets', 'availableAssets', 'assignedAssets'];
    const parser = new Parser({ fields });
    const csv = parser.parse(categoriesWithCounts);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=categories.csv');
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
