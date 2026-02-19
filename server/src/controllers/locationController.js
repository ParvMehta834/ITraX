const MockDB = require('../config/mockDb');
const { isConnected } = require('../config/db');
const Location = require('../models/Location');

const locationController = {
  getLocations: async (req, res) => {
    try {
      const { search, status, page = 1, limit = 10 } = req.query;

      if (isConnected()) {
        let query = {};
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { address: { $regex: search, $options: 'i' } }
          ];
        }
        if (status) query.status = status;

        const total = await Location.countDocuments(query);
        const data = await Location.find(query)
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
        const locations = MockDB.getLocations();
        let filtered = locations;

        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(l =>
            l.name?.toLowerCase().includes(searchLower) ||
            l.address?.toLowerCase().includes(searchLower)
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
      console.error('Error fetching locations:', error);
      res.status(500).json({ message: 'Failed to fetch locations', error: error.message });
    }
  },

  createLocation: async (req, res) => {
    try {
      const { name, address, city, country, status } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Location name is required' });
      }

      if (isConnected()) {
        const location = await Location.create({
          name,
          address,
          city,
          country,
          status: status || 'Active',
          createdAt: new Date()
        });
        res.status(201).json(location);
      } else {
        const location = MockDB.createLocation({
          name,
          address,
          city,
          country,
          status: status || 'Active'
        });
        res.status(201).json(location);
      }
    } catch (error) {
      console.error('Error creating location:', error);
      res.status(500).json({ message: 'Failed to create location', error: error.message });
    }
  },

  getLocationById: async (req, res) => {
    try {
      const { id } = req.params;

      if (isConnected()) {
        const location = await Location.findById(id).lean();
        if (!location) return res.status(404).json({ message: 'Location not found' });
        res.json(location);
      } else {
        const location = MockDB.getLocationById(id);
        if (!location) return res.status(404).json({ message: 'Location not found' });
        res.json(location);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      res.status(500).json({ message: 'Failed to fetch location', error: error.message });
    }
  },

  updateLocation: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (isConnected()) {
        const location = await Location.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true }).lean();
        if (!location) return res.status(404).json({ message: 'Location not found' });
        res.json(location);
      } else {
        const location = MockDB.updateLocation(id, updates);
        if (!location) return res.status(404).json({ message: 'Location not found' });
        res.json(location);
      }
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ message: 'Failed to update location', error: error.message });
    }
  },

  deleteLocation: async (req, res) => {
    try {
      const { id } = req.params;

      if (isConnected()) {
        const location = await Location.findByIdAndDelete(id);
        if (!location) return res.status(404).json({ message: 'Location not found' });
        res.json({ message: 'Location deleted successfully' });
      } else {
        const location = MockDB.deleteLocation(id);
        if (!location) return res.status(404).json({ message: 'Location not found' });
        res.json({ message: 'Location deleted successfully' });
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      res.status(500).json({ message: 'Failed to delete location', error: error.message });
    }
  }
};

module.exports = locationController;
