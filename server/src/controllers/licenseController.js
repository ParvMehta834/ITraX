const MockDB = require('../config/mockDb');
const { isConnected } = require('../config/db');
const License = require('../models/License');

const licenseController = {
  getLicenses: async (req, res) => {
    try {
      const { search, status, page = 1, limit = 10 } = req.query;

      if (isConnected()) {
        let query = {};
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { licenseKey: { $regex: search, $options: 'i' } }
          ];
        }
        if (status) query.status = status;

        const total = await License.countDocuments(query);
        const data = await License.find(query)
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
        const licenses = MockDB.getLicenses();
        let filtered = licenses;

        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(l =>
            l.name?.toLowerCase().includes(searchLower) ||
            l.licenseKey?.toLowerCase().includes(searchLower)
          );
        }
        if (status) filtered = filtered.filter(l => l.status === status);

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
      console.error('Error fetching licenses:', error);
      res.status(500).json({ message: 'Failed to fetch licenses', error: error.message });
    }
  },

  createLicense: async (req, res) => {
    try {
      const { name, licenseKey, vendor, expirationDate, seats, assignedTo, status } = req.body;

      if (!name || !licenseKey) {
        return res.status(400).json({ message: 'License name and key are required' });
      }

      if (isConnected()) {
        const license = await License.create({
          name,
          licenseKey,
          vendor,
          expirationDate,
          seats,
          assignedTo,
          status: status || 'Active',
          createdAt: new Date()
        });
        res.status(201).json(license);
      } else {
        const license = MockDB.createLicense({
          name,
          licenseKey,
          vendor,
          expirationDate,
          seats,
          assignedTo,
          status: status || 'Active'
        });
        res.status(201).json(license);
      }
    } catch (error) {
      console.error('Error creating license:', error);
      res.status(500).json({ message: 'Failed to create license', error: error.message });
    }
  },

  getLicenseById: async (req, res) => {
    try {
      const { id } = req.params;

      if (isConnected()) {
        const license = await License.findById(id).lean();
        if (!license) return res.status(404).json({ message: 'License not found' });
        res.json(license);
      } else {
        const license = MockDB.getLicenseById(id);
        if (!license) return res.status(404).json({ message: 'License not found' });
        res.json(license);
      }
    } catch (error) {
      console.error('Error fetching license:', error);
      res.status(500).json({ message: 'Failed to fetch license', error: error.message });
    }
  },

  updateLicense: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (isConnected()) {
        const license = await License.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true }).lean();
        if (!license) return res.status(404).json({ message: 'License not found' });
        res.json(license);
      } else {
        const license = MockDB.updateLicense(id, updates);
        if (!license) return res.status(404).json({ message: 'License not found' });
        res.json(license);
      }
    } catch (error) {
      console.error('Error updating license:', error);
      res.status(500).json({ message: 'Failed to update license', error: error.message });
    }
  },

  deleteLicense: async (req, res) => {
    try {
      const { id } = req.params;

      if (isConnected()) {
        const license = await License.findByIdAndDelete(id);
        if (!license) return res.status(404).json({ message: 'License not found' });
        res.json({ message: 'License deleted successfully' });
      } else {
        const license = MockDB.deleteLicense(id);
        if (!license) return res.status(404).json({ message: 'License not found' });
        res.json({ message: 'License deleted successfully' });
      }
    } catch (error) {
      console.error('Error deleting license:', error);
      res.status(500).json({ message: 'Failed to delete license', error: error.message });
    }
  }
};

module.exports = licenseController;
