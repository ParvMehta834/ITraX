const MockDB = require('../config/mockDb');
const { isConnected } = require('../config/db');
const Asset = require('../models/Asset');
const License = require('../models/License');
const InventoryItem = require('../models/InventoryItem');
const Employee = require('../models/Employee');

const reportsController = {
  getAssetReport: async (req, res) => {
    try {
      const { reportId } = req.query;

      if (isConnected()) {
        const assets = await Asset.find({}).lean();
        res.json({
          data: assets,
          reportId: reportId || 'assets-master',
          generatedAt: new Date()
        });
      } else {
        const assets = MockDB.getAssets();
        res.json({
          data: assets,
          reportId: reportId || 'assets-master',
          generatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error generating asset report:', error);
      res.status(500).json({ message: 'Failed to generate report', error: error.message });
    }
  },

  getLicenseReport: async (req, res) => {
    try {
      if (isConnected()) {
        const licenses = await License.find({}).lean();
        res.json({
          data: licenses,
          reportId: 'licenses-master',
          generatedAt: new Date()
        });
      } else {
        const licenses = MockDB.getLicenses();
        res.json({
          data: licenses,
          reportId: 'licenses-master',
          generatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error generating license report:', error);
      res.status(500).json({ message: 'Failed to generate report', error: error.message });
    }
  },

  getInventoryReport: async (req, res) => {
    try {
      if (isConnected()) {
        const inventory = await InventoryItem.find({}).lean();
        res.json({
          data: inventory,
          reportId: 'inventory-master',
          generatedAt: new Date()
        });
      } else {
        const inventory = MockDB.getInventoryItems();
        res.json({
          data: inventory,
          reportId: 'inventory-master',
          generatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error generating inventory report:', error);
      res.status(500).json({ message: 'Failed to generate report', error: error.message });
    }
  },

  getEmployeeReport: async (req, res) => {
    try {
      if (isConnected()) {
        const employees = await Employee.find({}).lean();
        res.json({
          data: employees,
          reportId: 'employees-master',
          generatedAt: new Date()
        });
      } else {
        const employees = MockDB.getEmployees();
        res.json({
          data: employees,
          reportId: 'employees-master',
          generatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error generating employee report:', error);
      res.status(500).json({ message: 'Failed to generate report', error: error.message });
    }
  },

  getTrackingReport: async (req, res) => {
    try {
      // This would return tracking/order information
      res.json({
        data: [],
        reportId: 'tracking-master',
        generatedAt: new Date(),
        message: 'Tracking reports are available through the orders API'
      });
    } catch (error) {
      console.error('Error generating tracking report:', error);
      res.status(500).json({ message: 'Failed to generate report', error: error.message });
    }
  }
};

module.exports = reportsController;
