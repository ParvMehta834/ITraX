/**
 * Reports Routes - Aggregated data and analysis
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const ReportController = require('../controllers/reportsController');

const router = express.Router();

router.use(authMiddleware);

// Asset Reports
router.get('/assets', ReportController.getAssetReport);

// License Reports
router.get('/licenses', ReportController.getLicenseReport);

// Inventory Reports
router.get('/inventory', ReportController.getInventoryReport);

// Employee Reports
router.get('/employees', ReportController.getEmployeeReport);

// Tracking Reports
router.get('/tracking', ReportController.getTrackingReport);

module.exports = router;
