const MockDB = require('../config/mockDb');
const { isConnected } = require('../config/db');
const Category = require('../models/Category');

const categoryController = {
  getCategories: async (req, res) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      if (isConnected()) {
        let query = {};
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ];
        }

        const total = await Category.countDocuments(query);
        const data = await Category.find(query)
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
        const categories = MockDB.getCategories();
        let filtered = categories;

        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(c =>
            c.name?.toLowerCase().includes(searchLower) ||
            c.description?.toLowerCase().includes(searchLower)
          );
        }

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
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
    }
  },

  createCategory: async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
      }

      if (isConnected()) {
        const category = await Category.create({
          name,
          description,
          createdAt: new Date()
        });
        res.status(201).json(category);
      } else {
        const category = MockDB.createCategory({ name, description });
        res.status(201).json(category);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Failed to create category', error: error.message });
    }
  },

  getCategoryById: async (req, res) => {
    try {
      const { id } = req.params;

      if (isConnected()) {
        const category = await Category.findById(id).lean();
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
      } else {
        const category = MockDB.getCategoryById(id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ message: 'Failed to fetch category', error: error.message });
    }
  },

  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (isConnected()) {
        const category = await Category.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true }).lean();
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
      } else {
        const category = MockDB.updateCategory(id, updates);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Failed to update category', error: error.message });
    }
  },

  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;

      if (isConnected()) {
        const category = await Category.findByIdAndDelete(id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted successfully' });
      } else {
        const category = MockDB.deleteCategory(id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted successfully' });
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Failed to delete category', error: error.message });
    }
  }
};

module.exports = categoryController;
